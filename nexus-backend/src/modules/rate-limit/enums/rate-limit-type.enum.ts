/**
 * Tipos de rate limiting disponíveis
 */
export enum RateLimitType {
  /** Rate limiting baseado no role do usuário */
  BY_ROLE = 'by_role',

  /** Rate limiting por IP (para endpoints públicos) */
  BY_IP = 'by_ip',

  /** Rate limiting por usuário específico */
  BY_USER = 'by_user',

  /** Rate limiting global para endpoints críticos */
  GLOBAL = 'global',
}
