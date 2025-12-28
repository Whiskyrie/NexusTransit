import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuditPermission } from '../enums/audit-permission.enum';

/**
 * Metadata key para permissões de auditoria
 */
export const AUDIT_PERMISSIONS_KEY = 'audit_permissions';

/**
 * Metadata key para indicar se deve filtrar por owner
 */
export const AUDIT_OWNER_ONLY_KEY = 'audit_owner_only';

/**
 * Decorator para definir permissões necessárias de auditoria
 *
 * @example
 * ```typescript
 * @RequireAuditPermission(AuditPermission.VIEW_LOGS)
 * @Get()
 * findAll() { ... }
 * ```
 */
export const RequireAuditPermission = (
  ...permissions: AuditPermission[]
): ReturnType<typeof SetMetadata> => SetMetadata(AUDIT_PERMISSIONS_KEY, permissions);

/**
 * Decorator para indicar que o endpoint deve filtrar logs pelo usuário autenticado
 * Usado quando usuários podem ver apenas seus próprios logs
 *
 * @example
 * ```typescript
 * @AuditOwnerOnly()
 * @Get('my-logs')
 * getMyLogs() { ... }
 * ```
 */
export const AuditOwnerOnly = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(AUDIT_OWNER_ONLY_KEY, true);

/**
 * Decorator combinado para endpoints que requerem permissão de visualização
 * Inclui documentação Swagger automática
 *
 * @example
 * ```typescript
 * @CanViewAuditLogs()
 * @Get()
 * findAll() { ... }
 * ```
 */
export function CanViewAuditLogs(): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    RequireAuditPermission(AuditPermission.VIEW_LOGS),
    ApiUnauthorizedResponse({ description: 'Token de autenticação inválido ou ausente' }),
    ApiForbiddenResponse({ description: 'Usuário não possui permissão para visualizar logs' }),
  );
}

/**
 * Decorator combinado para endpoints que requerem permissão de visualização de todos os logs
 *
 * @example
 * ```typescript
 * @CanViewAllAuditLogs()
 * @Get('all')
 * findAll() { ... }
 * ```
 */
export function CanViewAllAuditLogs(): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    RequireAuditPermission(AuditPermission.VIEW_ALL_LOGS),
    ApiUnauthorizedResponse({ description: 'Token de autenticação inválido ou ausente' }),
    ApiForbiddenResponse({
      description: 'Usuário não possui permissão para visualizar todos os logs',
    }),
  );
}

/**
 * Decorator combinado para endpoints de exportação
 *
 * @example
 * ```typescript
 * @CanExportAuditLogs()
 * @Post('export')
 * export() { ... }
 * ```
 */
export function CanExportAuditLogs(): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    RequireAuditPermission(AuditPermission.EXPORT_LOGS),
    ApiUnauthorizedResponse({ description: 'Token de autenticação inválido ou ausente' }),
    ApiForbiddenResponse({ description: 'Usuário não possui permissão para exportar logs' }),
  );
}

/**
 * Decorator combinado para endpoints de dashboard
 *
 * @example
 * ```typescript
 * @CanViewAuditDashboard()
 * @Get('dashboard')
 * getDashboard() { ... }
 * ```
 */
export function CanViewAuditDashboard(): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    RequireAuditPermission(AuditPermission.VIEW_DASHBOARD),
    ApiUnauthorizedResponse({ description: 'Token de autenticação inválido ou ausente' }),
    ApiForbiddenResponse({ description: 'Usuário não possui permissão para acessar dashboard' }),
  );
}

/**
 * Decorator combinado para endpoints de alertas de segurança
 *
 * @example
 * ```typescript
 * @CanViewSecurityAlerts()
 * @Get('security/alerts')
 * getAlerts() { ... }
 * ```
 */
export function CanViewSecurityAlerts(): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    RequireAuditPermission(AuditPermission.VIEW_SECURITY_ALERTS),
    ApiUnauthorizedResponse({ description: 'Token de autenticação inválido ou ausente' }),
    ApiForbiddenResponse({ description: 'Usuário não possui permissão para visualizar alertas' }),
  );
}

/**
 * Decorator combinado para endpoints administrativos
 *
 * @example
 * ```typescript
 * @CanManageAudit()
 * @Delete('cleanup')
 * cleanup() { ... }
 * ```
 */
export function CanManageAudit(): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    RequireAuditPermission(AuditPermission.MANAGE_AUDIT),
    ApiUnauthorizedResponse({ description: 'Token de autenticação inválido ou ausente' }),
    ApiForbiddenResponse({ description: 'Usuário não possui permissão administrativa' }),
  );
}
