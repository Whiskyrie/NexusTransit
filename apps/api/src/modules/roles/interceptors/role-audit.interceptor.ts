import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthenticatedRequest } from '@nexus/auth';

/**
 * Interceptor para auditoria de operações relacionadas a roles e permissões
 *
 * Registra:
 * - Tentativas de modificação de roles
 * - Atribuição/remoção de permissões
 * - Alterações em hierarquia de roles
 * - Falhas de autorização
 */
@Injectable()
export class RoleAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RoleAuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method;
    const url = request.url;
    const body = request.body as Record<string, unknown>;
    const params = request.params as Record<string, string>;
    const user = request.user;

    // Extrair informações relevantes
    const userId = user?.id ?? 'anonymous';
    const userRole = JSON.stringify(user?.roles) ?? 'unknown';
    const timestamp = new Date().toISOString();

    // Determinar tipo de operação
    const operation = this.getOperationType(method, url);

    // Log de início da operação
    this.logger.log(`[AUDIT] Usuário ${userId} (${userRole}) iniciou operação: ${operation}`);

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;

        // Log de sucesso
        this.logger.log(
          `[AUDIT] ✓ Operação ${operation} concluída com sucesso por ${userId} ` +
            `em ${duration}ms. Dados: ${this.sanitizeData({ body, params })}`,
        );

        // Aqui poderia integrar com @nexus/audit para persistir em banco
        this.logToAuditService({
          timestamp,
          userId,
          userRole,
          operation,
          method,
          url,
          status: 'success',
          duration,
          data: this.sanitizeData({ body, params }),
        });
      }),
      catchError((error: Error) => {
        const duration = Date.now() - startTime;

        // Log de erro
        this.logger.error(
          `[AUDIT] ✗ Falha na operação ${operation} por ${userId} ` +
            `em ${duration}ms. Erro: ${error.message}`,
        );

        // Log de auditoria de erro
        this.logToAuditService({
          timestamp,
          userId,
          userRole,
          operation,
          method,
          url,
          status: 'error',
          duration,
          error: error.message,
          data: this.sanitizeData({ body, params }),
        });

        return throwError(() => error);
      }),
    );
  }

  /**
   * Determina o tipo de operação baseado no método HTTP e URL
   */
  private getOperationType(method: string, url: string): string {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('/roles')) {
      if (method === 'POST') {
        return 'CREATE_ROLE';
      }
      if (method === 'PATCH' || method === 'PUT') {
        return 'UPDATE_ROLE';
      }
      if (method === 'DELETE') {
        return 'DELETE_ROLE';
      }
      if (urlLower.includes('/assign-permission')) {
        return 'ASSIGN_PERMISSION';
      }
      if (urlLower.includes('/remove-permission')) {
        return 'REMOVE_PERMISSION';
      }
      if (urlLower.includes('/assign-role')) {
        return 'ASSIGN_ROLE';
      }
      if (urlLower.includes('/remove-role')) {
        return 'REMOVE_ROLE';
      }
      if (urlLower.includes('/restore')) {
        return 'RESTORE_ROLE';
      }
    }

    if (urlLower.includes('/permissions')) {
      if (method === 'POST') {
        return 'CREATE_PERMISSION';
      }
      if (method === 'PATCH' || method === 'PUT') {
        return 'UPDATE_PERMISSION';
      }
      if (method === 'DELETE') {
        return 'DELETE_PERMISSION';
      }
    }

    return `${method}_${urlLower}`;
  }

  /**
   * Sanitiza dados sensíveis antes de logar
   */
  private sanitizeData(data: Record<string, unknown>): string {
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

    const sanitize = (obj: unknown): unknown => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }

      const sanitized = { ...(obj as Record<string, unknown>) };

      for (const key in sanitized) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          sanitized[key] = '***REDACTED***';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = sanitize(sanitized[key]);
        }
      }

      return sanitized;
    };

    try {
      return JSON.stringify(sanitize(data));
    } catch {
      return '[Dados não serializáveis]';
    }
  }

  /**
   * Integração com serviço de auditoria
   * TODO: Integrar com @nexus/audit quando disponível
   */
  private logToAuditService(auditData: Record<string, unknown>): void {
    // Por enquanto apenas loga, mas pode ser integrado com AuditService
    this.logger.debug(`Audit data: ${JSON.stringify(auditData)}`);

    // Exemplo de integração futura:
    // this.auditService.create({
    //   entity: 'Role',
    //   action: auditData.operation,
    //   userId: auditData.userId,
    //   metadata: auditData,
    // });
  }
}
