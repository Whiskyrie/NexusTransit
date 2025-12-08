import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Request, Response } from 'express';

/**
 * Interface para tipar propriedades injetadas no Request
 * (User do Guard, Correlation ID do Logger, etc)
 */
interface RequestWithContext extends Request {
  correlationId?: string | number;
  user?: {
    id: string | number;
  };
}

/**
 * Interface para o corpo de resposta padrão de exceções HTTP do NestJS
 */
interface HttpExceptionResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

/**
 * Exception Filter global para capturar e logar todas as exceções
 *
 * - Captura todas as exceções da aplicação
 * - Loga exceções de forma estruturada com contexto completo
 * - Inclui correlation ID para rastreamento
 * - Retorna resposta padronizada ao cliente
 * - Sanitiza dados sensíveis automaticamente via Pino
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithContext>();

    // Determinar status code
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extrair resposta da exceção (pode ser string ou objeto)
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    // Determinar mensagem de erro de forma segura (sem 'any')
    let errorMessage: string | string[];

    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      // Type assertion seguro pois verificamos a propriedade 'message'
      errorMessage = (exceptionResponse as HttpExceptionResponse).message;
    } else {
      errorMessage = 'Unknown error';
    }

    // Log estruturado do erro com contexto completo
    this.logger.error(
      {
        err: exception,
        req: {
          method: request.method,
          url: request.url,
          correlationId: request.correlationId ?? request.headers['x-correlation-id'],
          userId: request.user?.id,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        },
        statusCode: status,
        timestamp: new Date().toISOString(),
      },
      `Exception caught: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
    );

    // Resposta padronizada ao cliente
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorMessage,
      correlationId: request.correlationId ?? request.headers['x-correlation-id'],
    });
  }
}
