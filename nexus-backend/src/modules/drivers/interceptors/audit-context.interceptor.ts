import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from 'nestjs-cls';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestUser } from '../interfaces/request-user.interface';

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditContextInterceptor.name);

  constructor(private readonly clsService: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      // Generate or extract request ID
      const requestId: string = request.get('x-request-id') ?? uuidv4();

      // Extract user information (assuming it's set by auth guard)
      const user = request.user as RequestUser | undefined;

      // Extract request metadata
      const ipAddress = this.extractIpAddress(request);
      const userAgentHeader = request.headers['user-agent'];
      const userAgent = typeof userAgentHeader === 'string' ? userAgentHeader : 'Unknown';

      // Set context in CLS
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

      // Add request ID to response headers
      const response = context.switchToHttp().getResponse<Response>();
      response.setHeader('X-Request-ID', requestId);

      this.logger.debug(
        `Contexto de auditoria configurado - Request: ${requestId}, User: ${user?.id ?? 'ANONYMOUS'}, IP: ${ipAddress}`,
      );
    } catch (error) {
      this.logger.error('Erro ao configurar contexto de auditoria:', error);
      // Continue execution even if audit context setup fails
    }

    return next.handle();
  }

  private extractIpAddress(request: Request): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    const xRealIp = request.headers['x-real-ip'];
    const cfConnectingIp = request.headers['cf-connecting-ip'];

    // Handle X-Forwarded-For header (can contain multiple IPs)
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

    // Use X-Real-IP header
    if (xRealIp) {
      const realIpValue = Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
      if (typeof realIpValue === 'string') {
        return realIpValue;
      }
    }

    // Use CloudFlare connecting IP header
    if (cfConnectingIp) {
      const cfIpValue = Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
      if (typeof cfIpValue === 'string') {
        return cfIpValue;
      }
    }

    // Fallback to connection remote address
    return request.socket.remoteAddress ?? 'unknown';
  }
}
