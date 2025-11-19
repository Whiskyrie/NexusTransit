import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PinoLogger } from 'nestjs-pino';
import { Request, Response } from 'express';
import { MetricsService } from './../services/metrics.service';

/**
 * Interface para tipar o Request com propriedades customizadas
 */
interface RequestWithContext extends Request {
  correlationId?: string;
  user?: {
    id: string | number;
  };
}

/**
 * Interceptor para medir performance e registrar métricas
 *
 * - Mede tempo de resposta de cada request
 * - Registra métricas HTTP (sucesso, erro, duração)
 * - Detecta requests lentas (> 2000ms) e loga warning
 * - Integra com MetricsService para exposição de métricas
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly SLOW_REQUEST_THRESHOLD = 2000; // 2 segundos

  constructor(
    private readonly pinoLogger: PinoLogger,
    private readonly metricsService: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const { method, url, user, correlationId } = request;

    // Normaliza o userId para string para evitar erros de tipagem (string | number)
    // O métricas service e o logger esperam string | undefined
    const userId = user?.id?.toString();

    // Child logger com contexto da request
    const requestLogger = this.pinoLogger.logger.child({
      correlationId,
      userId,
      method,
      url,
    });

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const response = context.switchToHttp().getResponse<Response>();

        // Log de conclusão
        requestLogger.info(
          {
            duration,
            statusCode: response.statusCode,
          },
          'Request completed',
        );

        // Registrar métricas HTTP
        this.metricsService.recordHttpRequest({
          method,
          route: url,
          statusCode: response.statusCode,
          duration,
          userId,
          timestamp: new Date(),
        });

        // Alerta para requests lentas
        if (duration > this.SLOW_REQUEST_THRESHOLD) {
          requestLogger.warn(
            {
              duration,
              threshold: this.SLOW_REQUEST_THRESHOLD,
            },
            'Slow request detected',
          );

          this.metricsService.recordSlowRequest({
            method,
            route: url,
            duration,
            userId,
            timestamp: new Date(),
          });
        }
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - startTime;

        // Determinar status code de forma segura
        const statusCode =
          error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        // Determinar nome do erro de forma segura
        const errorName = error instanceof Error ? error.name : 'UnknownError';

        // Log de erro
        requestLogger.error(
          {
            err: error,
            duration,
            statusCode,
          },
          'Request failed',
        );

        // Registrar erro nas métricas
        this.metricsService.recordError({
          method,
          route: url,
          error: errorName,
          statusCode,
          duration,
          userId,
          timestamp: new Date(),
        });

        return throwError(() => error);
      }),
    );
  }
}
