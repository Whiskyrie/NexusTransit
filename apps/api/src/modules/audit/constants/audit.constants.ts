/**
 * Constantes do módulo de Auditoria
 *
 * Centraliza configurações, limites e valores padrão para o módulo de auditoria da API.
 */

/**
 * Limites de exportação de logs de auditoria
 */
export const AUDIT_EXPORT_LIMITS = {
  /** Máximo de registros por exportação síncrona */
  MAX_SYNC_EXPORT: 10000,

  /** Máximo de registros por exportação assíncrona */
  MAX_ASYNC_EXPORT: 100000,

  /** Limite padrão de registros por exportação */
  DEFAULT_EXPORT_LIMIT: 5000,

  /** Tamanho máximo do arquivo de exportação em bytes (50MB) */
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
} as const;

/**
 * Períodos de retenção de logs de auditoria
 */
export const AUDIT_RETENTION = {
  /** Período padrão de retenção em dias */
  DEFAULT_RETENTION_DAYS: 90,

  /** Período mínimo de retenção em dias */
  MIN_RETENTION_DAYS: 7,

  /** Período máximo de retenção em dias */
  MAX_RETENTION_DAYS: 365,

  /** Período de retenção para logs críticos (segurança) em dias */
  CRITICAL_RETENTION_DAYS: 365,
} as const;

/**
 * Tipos de entidade que são auditáveis no sistema
 */
export const AUDITABLE_ENTITY_TYPES = [
  'User',
  'Vehicle',
  'Driver',
  'Customer',
  'Delivery',
  'Route',
  'ServiceOrder',
  'Incident',
  'Address',
  'Role',
] as const;

export type AuditableEntityType = (typeof AUDITABLE_ENTITY_TYPES)[number];

/**
 * Configurações de paginação para consultas de auditoria
 */
export const AUDIT_PAGINATION = {
  /** Página padrão */
  DEFAULT_PAGE: 1,

  /** Limite padrão de itens por página */
  DEFAULT_LIMIT: 10,

  /** Limite máximo de itens por página */
  MAX_LIMIT: 100,

  /** Limite mínimo de itens por página */
  MIN_LIMIT: 1,
} as const;

/**
 * Configurações do dashboard de auditoria
 */
export const AUDIT_DASHBOARD = {
  /** Número máximo de top usuários retornados */
  TOP_USERS_LIMIT: 10,

  /** Número máximo de top entidades retornadas */
  TOP_ENTITIES_LIMIT: 10,

  /** Número máximo de atividades na timeline */
  TIMELINE_LIMIT: 50,

  /** Período padrão de análise em dias */
  DEFAULT_PERIOD_DAYS: 7,

  /** Intervalo de atualização do cache em segundos */
  CACHE_TTL_SECONDS: 300,
} as const;

/**
 * Limiares para alertas de atividades suspeitas
 */
export const AUDIT_ALERT_THRESHOLDS = {
  /** Número de falhas de login para gerar alerta */
  LOGIN_FAILURES_THRESHOLD: 5,

  /** Período para contagem de falhas (em minutos) */
  LOGIN_FAILURES_WINDOW_MINUTES: 15,

  /** Número de exclusões em massa para alerta */
  BULK_DELETE_THRESHOLD: 10,

  /** Número de alterações por minuto para alerta de rate */
  HIGH_ACTIVITY_PER_MINUTE: 100,

  /** Número de acessos de IPs diferentes para alerta */
  DIFFERENT_IPS_THRESHOLD: 5,

  /** Período para contagem de IPs (em minutos) */
  DIFFERENT_IPS_WINDOW_MINUTES: 60,
} as const;

/**
 * Formatos de exportação suportados
 */
export const AUDIT_EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  XLSX: 'xlsx',
} as const;

export type AuditExportFormat = (typeof AUDIT_EXPORT_FORMATS)[keyof typeof AUDIT_EXPORT_FORMATS];

/**
 * Configurações de meta-auditoria (auditoria do acesso aos logs)
 */
export const META_AUDIT_CONFIG = {
  /** Habilitar meta-auditoria */
  ENABLED: true,

  /** Tipo de recurso para logs de meta-auditoria */
  RESOURCE_TYPE: 'AuditLog',

  /** Descrição padrão para consultas */
  QUERY_DESCRIPTION: 'Consulta de logs de auditoria',

  /** Descrição padrão para exportações */
  EXPORT_DESCRIPTION: 'Exportação de logs de auditoria',

  /** Descrição padrão para acesso ao dashboard */
  DASHBOARD_DESCRIPTION: 'Acesso ao dashboard de auditoria',
} as const;

/**
 * Campos que devem ser excluídos dos logs de auditoria por segurança
 */
export const AUDIT_EXCLUDED_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'refreshToken',
  'apiKey',
  'secret',
  'creditCard',
  'cvv',
  'pin',
] as const;

/**
 * Mensagens de erro do módulo de auditoria
 */
export const AUDIT_ERROR_MESSAGES = {
  LOG_NOT_FOUND: 'Log de auditoria não encontrado',
  EXPORT_LIMIT_EXCEEDED: 'Limite de exportação excedido',
  INVALID_DATE_RANGE: 'Intervalo de datas inválido',
  INVALID_EXPORT_FORMAT: 'Formato de exportação inválido',
  EXPORT_FAILED: 'Falha ao gerar exportação',
  PERMISSION_DENIED: 'Permissão negada para acessar logs de auditoria',
} as const;
