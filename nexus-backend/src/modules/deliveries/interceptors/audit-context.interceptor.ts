import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from 'nestjs-cls';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { RequestUser } from '../interfaces/request-user.interface';

/**
 * Interceptor para configurar contexto de auditoria em entregas
 *
 * Utiliza CLS (Continuation Local Storage) para propagar informações
 * de auditoria através da stack de execução
 *
 * Captura e armazena:
 * - ID da requisição
 * - Dados do usuário autenticado
 * - IP de origem
 * - User Agent
 * - Timestamp da operação
 *
 * @class AuditContextInterceptor
 */
@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditContextInterceptor.name);

  constructor(private readonly clsService: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      // Gera ou extrai ID da requisição
      const requestId: string = request.get('x-request-id') ?? uuidv4();

      // Extrai informações do usuário (definidas pelo auth guard)
      const user = request.user as RequestUser | undefined;

      // Extrai metadados da requisição
      const ipAddress = this.extractIpAddress(request);
      const userAgentHeader = request.headers['user-agent'];
      const userAgent = typeof userAgentHeader === 'string' ? userAgentHeader : 'Unknown';

      // Define contexto no CLS
      (this.clsService.set as (key: string, value: unknown) => void)('requestId', requestId);
      this.clsService.set('userId', user?.id);
      this.clsService.set('userEmail', user?.email);
      this.clsService.set('userName', user?.name);
      this.clsService.set('userRoles', user?.roles);
      this.clsService.set('ipAddress', ipAddress);
      this.clsService.set('userAgent', userAgent);
      this.clsService.set('method', request.method);
      this.clsService.set('url', request.url);
      this.clsService.set('timestamp', new Date().toISOString());

      // Adiciona request ID aos headers de resposta
      const response = context.switchToHttp().getResponse<Response>();
      response.setHeader('X-Request-ID', requestId);

      this.logger.debug(
        `Contexto de auditoria configurado - Request: ${requestId}, User: ${user?.id ?? 'ANONYMOUS'}, IP: ${ipAddress}`,
      );
    } catch (error) {
      this.logger.error('Erro ao configurar contexto de auditoria:', error);
      // Continua execução mesmo se falhar a configuração do contexto
    }

    return next.handle();
  }

  /**
   * Extrai o endereço IP real da requisição
   *
   * Considera headers de proxy/load balancer:
   * - X-Forwarded-For
   * - X-Real-IP
   * - CF-Connecting-IP (Cloudflare)
   *
   * @param request - Request do Express
   * @returns Endereço IP
   */
  private extractIpAddress(request: Request): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    const xRealIp = request.headers['x-real-ip'];
    const cfConnectingIp = request.headers['cf-connecting-ip'];

    // Processa X-Forwarded-For (pode conter múltiplos IPs)
    if (xForwardedFor) {
      const forwardedValue = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;

      if (typeof forwardedValue === 'string') {
        const ips = forwardedValue.split(',');
        const firstIp = ips[0]?.trim();
        if (firstIp) {
          return firstIp;
        }
      }
    }

    // Usa X-Real-IP
    if (xRealIp) {
      const realIpValue = Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
      if (typeof realIpValue === 'string') {
        return realIpValue;
      }
    }

    // Usa Cloudflare connecting IP
    if (cfConnectingIp) {
      const cfIpValue = Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
      if (typeof cfIpValue === 'string') {
        return cfIpValue;
      }
    }

    // Fallback para remote address da conexão
    return request.socket.remoteAddress ?? 'unknown';
  }
}
