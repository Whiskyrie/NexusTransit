/**
 * Constantes do módulo de motoristas
 */

/**
 * Idade mínima para ser motorista
 */
export const MINIMUM_DRIVER_AGE = 18;

/**
 * Autoridade emissora padrão da CNH
 */
export const DEFAULT_CNH_ISSUING_AUTHORITY = 'DENATRAN';

/**
 * Estado emissor padrão da CNH
 */
export const DEFAULT_CNH_ISSUING_STATE = 'SP';

/**
 * Dias antes do vencimento para alertar sobre renovação de CNH
 */
export const CNH_EXPIRATION_WARNING_DAYS = 30;

/**
 * Tamanho do CPF normalizado (somente números)
 */
export const CPF_LENGTH = 11;

/**
 * Tamanho da CNH normalizada (somente números)
 */
export const CNH_LENGTH = 11;

/**
 * Chave para metadados de rastreamento de status
 */
export const TRACK_STATUS_KEY = 'track_driver_status';

/**
 * Chave para metadados de validação de CNH
 */
export const VALIDATE_CNH_KEY = 'validate_cnh';

/**
 * Chave para metadados de rastreamento de atividade
 */
export const TRACK_ACTIVITY_KEY = 'track_driver_activity';

/**
 * Campos sensíveis que não devem ser logados
 */
export const SENSITIVE_FIELDS = ['cpf', 'email', 'phone'] as const;

/**
 * Status válidos para motoristas
 */
export const DRIVER_VALID_STATUSES = [
  'available',
  'on_route',
  'unavailable',
  'blocked',
  'vacation',
] as const;
