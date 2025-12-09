import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

/**
 * Interface estendida para permitir a injeção do correlationId no objeto Request
 */
interface RequestWithCorrelation extends Request {
  correlationId: string;
}

/**
 * Interceptor para gerar e propagar Correlation IDs
 *
 * - Gera UUID v4 único para cada request
 * - Usa correlation ID existente se fornecido no header
 * - Adiciona correlation ID no response header
 * - Facilita rastreamento de requests através de logs
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithCorrelation>();
    const response = context.switchToHttp().getResponse<Response>();

    // Tenta obter do header (pode ser string ou array de strings)
    const headerCorrelationId = request.headers['x-correlation-id'];

    // Normaliza para uma única string
    const existingId = Array.isArray(headerCorrelationId)
      ? headerCorrelationId[0]
      : headerCorrelationId;

    // Usa o existente ou gera um novo
    const correlationId = existingId ?? uuidv4();

    // Adiciona no request para uso posterior (logs, services, etc)
    request.correlationId = correlationId;
    request.headers['x-correlation-id'] = correlationId;

    // Adiciona no response header para o cliente
    response.setHeader('X-Correlation-Id', correlationId);

    return next.handle();
  }
}
