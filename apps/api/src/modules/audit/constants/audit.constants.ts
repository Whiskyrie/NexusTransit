/**
 * Constantes do módulo de Auditoria
 *
 * Define valores padrão e configurações utilizadas pelo sistema de auditoria
 */

/**
 * Período de retenção padrão para logs de auditoria (em dias)
 */
export const AUDIT_RETENTION_DAYS = 30;

/**
 * Período estendido de retenção para logs críticos (em dias)
 */
export const AUDIT_RETENTION_DAYS_CRITICAL = 365;

/**
 * Padrões de URL que devem ser ignorados pela auditoria automática
 */
export const AUDIT_SKIP_PATTERNS = [
  '/health',
  '/favicon.ico',
  '/robots.txt',
  '/swagger',
  '/swagger-ui',
  '/docs',
  '/api-docs',
  '/metrics',
  '/.well-known',
];

/**
 * Número máximo de logs retornados por consulta
 */
export const AUDIT_MAX_LOGS_PER_QUERY = 100;

/**
 * Número padrão de logs por página
 */
export const AUDIT_DEFAULT_PAGE_SIZE = 10;

/**
 * Tempo de cache para estatísticas de auditoria (em segundos)
 */
export const AUDIT_STATS_CACHE_TTL = 300; // 5 minutos

/**
 * Métodos HTTP que devem ser auditados
 */
export const AUDIT_TRACKABLE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Prefixo para chaves de cache de auditoria
 */
export const AUDIT_CACHE_PREFIX = 'audit:';

/**
 * Chave de cache para estatísticas
 */
export const AUDIT_STATS_CACHE_KEY = `${AUDIT_CACHE_PREFIX}stats`;

/**
 * Campos que devem ser excluídos da auditoria automática
 */
export const AUDIT_EXCLUDED_FIELDS = [
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'secret',
  'apiKey',
  'api_key',
  'creditCard',
  'credit_card',
  'cvv',
  'ssn',
];

/**
 * Limite de tamanho para dados antigos armazenados (em caracteres)
 */
export const AUDIT_MAX_OLD_DATA_SIZE = 10000;

/**
 * Limite de tamanho para novos dados armazenados (em caracteres)
 */
export const AUDIT_MAX_NEW_DATA_SIZE = 10000;

/**
 * Ações que devem sempre ser registradas independente de configuração
 */
export const AUDIT_CRITICAL_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'DELETE',
  'PERMISSION_CHANGE',
  'ROLE_CHANGE',
  'PASSWORD_CHANGE',
];

/**
 * Categorias que requerem retenção estendida
 */
export const AUDIT_CRITICAL_CATEGORIES = [
  'SECURITY',
  'AUTHENTICATION',
  'AUTHORIZATION',
  'DATA_DELETION',
];
