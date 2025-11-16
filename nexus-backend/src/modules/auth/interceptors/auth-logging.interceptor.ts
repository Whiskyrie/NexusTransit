import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor para logging de autenticação
 *
 * Registra informações detalhadas sobre tentativas de autenticação:
 * - Timestamp da requisição
 * - IP do cliente
 * - User-Agent
 * - Endpoint acessado
 * - Tempo de resposta
 * - Status da resposta
 */
@Injectable()
export class AuthLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuthLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const { method, url, ip } = request;
    const headers = request.headers as Record<string, string | string[]>;

    const startTime = Date.now();
    const userAgent = (headers['user-agent'] as string) ?? 'Unknown';

    this.logger.log(
      `Auth Request: ${String(method)} ${String(url)} - IP: ${String(ip)} - UA: ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        next: response => {
          const duration = Date.now() - startTime;
          const statusCode = (response as { statusCode: number }).statusCode;

          this.logger.log(
            `Auth Success: ${String(method)} ${String(url)} - Status: ${statusCode} - Duration: ${duration}ms - IP: ${String(ip)}`,
          );
        },
        error: error => {
          const duration = Date.now() - startTime;
          const statusCode = (error as { statusCode: number }).statusCode;
          const errorMessage = (error as { message: string }).message;

          this.logger.error(
            `Auth Error: ${String(method)} ${String(url)} - Status: ${statusCode} - Duration: ${duration}ms - IP: ${String(ip)} - Error: ${errorMessage}`,
          );
        },
      }),
    );
  }
}
