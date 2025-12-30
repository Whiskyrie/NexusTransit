/**
 * Permissões específicas do módulo de Auditoria
 *
 * Define as ações que podem ser realizadas nos logs de auditoria
 */
export enum AuditPermission {
  /**
   * Visualizar logs de auditoria
   * Permissão básica para consultar registros
   */
  VIEW_LOGS = 'audit:view_logs',

  /**
   * Visualizar todos os logs (sem filtro de usuário)
   * Permite ver logs de todos os usuários
   */
  VIEW_ALL_LOGS = 'audit:view_all_logs',

  /**
   * Exportar logs de auditoria
   * Permite gerar arquivos CSV, Excel, JSON
   */
  EXPORT_LOGS = 'audit:export_logs',

  /**
   * Acessar dashboard de auditoria
   * Visualizar métricas e estatísticas
   */
  VIEW_DASHBOARD = 'audit:view_dashboard',

  /**
   * Visualizar alertas de segurança
   * Acessar alertas de atividade suspeita
   */
  VIEW_SECURITY_ALERTS = 'audit:view_security_alerts',

  /**
   * Configurar retenção de dados
   * Definir políticas de retenção e limpeza
   */
  CONFIGURE_RETENTION = 'audit:configure_retention',

  /**
   * Gerenciar módulo de auditoria
   * Acesso administrativo completo
   */
  MANAGE_AUDIT = 'audit:manage',
}

/**
 * Mapeamento de roles para permissões de auditoria
 * Define quais roles têm quais permissões por padrão
 */
export const AuditRolePermissions: Record<string, AuditPermission[]> = {
  admin: [
    AuditPermission.VIEW_LOGS,
    AuditPermission.VIEW_ALL_LOGS,
    AuditPermission.EXPORT_LOGS,
    AuditPermission.VIEW_DASHBOARD,
    AuditPermission.VIEW_SECURITY_ALERTS,
    AuditPermission.CONFIGURE_RETENTION,
    AuditPermission.MANAGE_AUDIT,
  ],
  gestor: [
    AuditPermission.VIEW_LOGS,
    AuditPermission.VIEW_ALL_LOGS,
    AuditPermission.EXPORT_LOGS,
    AuditPermission.VIEW_DASHBOARD,
    AuditPermission.VIEW_SECURITY_ALERTS,
  ],
  despachante: [AuditPermission.VIEW_LOGS, AuditPermission.VIEW_DASHBOARD],
  motorista: [
    AuditPermission.VIEW_LOGS, // Apenas próprios logs
  ],
  cliente: [
    AuditPermission.VIEW_LOGS, // Apenas próprios logs
  ],
};

/**
 * Verifica se uma role tem uma permissão específica
 */
export function hasAuditPermission(role: string, permission: AuditPermission): boolean {
  const permissions = AuditRolePermissions[role.toLowerCase()];
  return permissions?.includes(permission) ?? false;
}

/**
 * Verifica se uma role pode ver logs de todos os usuários
 */
export function canViewAllLogs(role: string): boolean {
  return hasAuditPermission(role, AuditPermission.VIEW_ALL_LOGS);
}

/**
 * Retorna todas as permissões de uma role
 */
export function getAuditPermissionsForRole(role: string): AuditPermission[] {
  return AuditRolePermissions[role.toLowerCase()] ?? [];
}

/**
 * Descrições das permissões para documentação
 */
export const AuditPermissionDescriptions: Record<AuditPermission, string> = {
  [AuditPermission.VIEW_LOGS]: 'Visualizar logs de auditoria próprios',
  [AuditPermission.VIEW_ALL_LOGS]: 'Visualizar logs de todos os usuários',
  [AuditPermission.EXPORT_LOGS]: 'Exportar logs para arquivos',
  [AuditPermission.VIEW_DASHBOARD]: 'Acessar dashboard de métricas',
  [AuditPermission.VIEW_SECURITY_ALERTS]: 'Visualizar alertas de segurança',
  [AuditPermission.CONFIGURE_RETENTION]: 'Configurar políticas de retenção',
  [AuditPermission.MANAGE_AUDIT]: 'Gerenciamento completo do módulo',
};
