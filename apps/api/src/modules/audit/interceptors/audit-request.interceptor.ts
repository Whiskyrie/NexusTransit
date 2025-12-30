import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService, AuditAction, AuditCategory } from '@nexus/audit';
import { META_AUDIT_CONFIG } from '../constants/audit.constants';
import type { Request } from 'express';

/**
 * Interface para usuário autenticado na requisição
 */
interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * Interface para Request com usuário autenticado
 */
interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Interceptor de Meta-Auditoria
 *
 * Registra quem acessou os logs de auditoria, implementando meta-auditoria.
 * Isso permite rastrear quem está consultando informações sensíveis de auditoria.
 *
 * @example
 * ```typescript
 * @UseInterceptors(AuditRequestInterceptor)
 * @Controller('audit')
 * export class AuditController {}
 * ```
 */
@Injectable()
export class AuditRequestInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditRequestInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!META_AUDIT_CONFIG.ENABLED) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { method, url } = request;
    const user = request.user;
    const startTime = Date.now();

    // Determinar tipo de ação baseado no endpoint
    const actionInfo = this.getActionInfo(method, url);

    return next.handle().pipe(
      tap({
        next: () => {
          const executionTime = Date.now() - startTime;
          void this.logAccess(request, user, actionInfo, executionTime, true);
        },
        error: (error: Error) => {
          const executionTime = Date.now() - startTime;
          void this.logAccess(request, user, actionInfo, executionTime, false, error.message);
        },
      }),
    );
  }

  /**
   * Determina informações da ação baseado no endpoint acessado
   */
  private getActionInfo(method: string, url: string): { action: AuditAction; description: string } {
    // Normalizar URL removendo query strings
    const normalizedUrl = url.split('?')[0];

    // Detectar tipo de operação
    if (normalizedUrl.includes('/export')) {
      return {
        action: AuditAction.EXPORT,
        description: META_AUDIT_CONFIG.EXPORT_DESCRIPTION,
      };
    }

    if (normalizedUrl.includes('/dashboard') || normalizedUrl.includes('/stats')) {
      return {
        action: AuditAction.READ,
        description: META_AUDIT_CONFIG.DASHBOARD_DESCRIPTION,
      };
    }

    // Operação padrão de consulta
    return {
      action: AuditAction.READ,
      description: META_AUDIT_CONFIG.QUERY_DESCRIPTION,
    };
  }

  /**
   * Registra o acesso aos logs de auditoria
   */
  private async logAccess(
    request: AuthenticatedRequest,
    user: AuthenticatedUser | undefined,
    actionInfo: { action: AuditAction; description: string },
    executionTime: number,
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const metadata = this.buildMetadata(request, success, errorMessage);

      await this.auditService.logAction({
        action: actionInfo.action,
        category: AuditCategory.SECURITY,
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
        resourceType: META_AUDIT_CONFIG.RESOURCE_TYPE,
        description: `${actionInfo.description}${!success ? ' - FALHA' : ''}`,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'] ?? undefined,
        metadata: {
          ...metadata,
          executionTimeMs: executionTime,
        },
      });
    } catch (error) {
      // Não propagar erro para não afetar a resposta da requisição
      this.logger.error('Falha ao registrar meta-auditoria', error);
    }
  }

  /**
   * Constrói metadados da requisição para o log
   */
  private buildMetadata(
    request: AuthenticatedRequest,
    success: boolean,
    errorMessage?: string,
  ): Record<string, unknown> {
    const { method, url, query, params } = request;

    const metadata: Record<string, unknown> = {
      method,
      url,
      success,
    };

    // Adicionar filtros utilizados (query params)
    if (query && Object.keys(query).length > 0) {
      metadata.filters = this.sanitizeFilters(query);
    }

    // Adicionar parâmetros de rota
    if (params && Object.keys(params).length > 0) {
      metadata.params = params;
    }

    // Adicionar erro se houver
    if (errorMessage) {
      metadata.error = errorMessage;
    }

    return metadata;
  }

  /**
   * Sanitiza filtros removendo informações sensíveis
   */
  private sanitizeFilters(query: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(query)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Obtém o IP real do cliente considerando proxies
   */
  private getClientIp(request: AuthenticatedRequest): string | undefined {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (forwardedFor) {
      // x-forwarded-for pode conter múltiplos IPs separados por vírgula
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
      return ips?.trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return request.ip;
  }
}
