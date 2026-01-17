/**
 * Constantes do módulo Address
 *
 * Define valores padrão e limites usados em todo o módulo
 */

/**
 * Tamanhos máximos de campos
 */
export const ADDRESS_FIELD_LENGTHS = {
  STREET: 255,
  NUMBER: 20,
  COMPLEMENT: 255,
  NEIGHBORHOOD: 100,
  CITY: 100,
  STATE: 2,
  POSTAL_CODE: 9,
  COUNTRY: 100,
  FORMATTED_ADDRESS: 500,
  IBGE_CODE: 50,
  GIA_CODE: 50,
  DDD: 10,
  SIAFI_CODE: 10,
  NOTES: 1000,
} as const;

/**
 * Expressões regulares para validação
 */
export const ADDRESS_REGEX = {
  CEP: /^\d{5}-?\d{3}$/,
  CEP_CLEAN: /^\d{8}$/,
  STATE: /^[A-Z]{2}$/,
  NUMBER: /^[0-9A-Za-z\s-]+$/,
} as const;

/**
 * Precisão de coordenadas geográficas
 */
export const COORDINATE_PRECISION = {
  LATITUDE: {
    SCALE: 8,
    PRECISION: 10,
    MIN: -90,
    MAX: 90,
  },
  LONGITUDE: {
    SCALE: 8,
    PRECISION: 11,
    MIN: -180,
    MAX: 180,
  },
} as const;

/**
 * TTL de cache em segundos
 */
export const CACHE_TTL = {
  CEP_LOOKUP: 60 * 60 * 24 * 7, // 7 dias
  GEOCODING: 60 * 60 * 24 * 30, // 30 dias
  REVERSE_GEOCODING: 60 * 60 * 24 * 30, // 30 dias
  ADDRESS_VALIDATION: 60 * 60 * 24, // 1 dia
  AUTOCOMPLETE: 60 * 5, // 5 minutos
  PLACE_DETAILS: 60 * 60 * 24 * 30, // 30 dias
} as const;

/**
 * Prefixos de chave para cache
 */
export const CACHE_KEYS = {
  CEP_LOOKUP: 'address:cep:',
  GEOCODING: 'address:geocode:',
  REVERSE_GEOCODING: 'address:reverse:',
  ADDRESS_VALIDATION: 'address:validate:',
  AUTOCOMPLETE: 'address:autocomplete:',
  PLACE_DETAILS: 'address:place:',
} as const;

/**
 * Valores padrão para endereços
 */
export const ADDRESS_DEFAULTS = {
  COUNTRY: 'Brasil',
  COUNTRY_CODE: 'BR',
  IS_ACTIVE: true,
  IS_VALIDATED: false,
} as const;

/**
 * Limites de paginação
 */
export const ADDRESS_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Mensagens de erro padrão
 */
export const ADDRESS_ERROR_MESSAGES = {
  NOT_FOUND: 'Endereço não encontrado',
  INVALID_CEP: 'CEP inválido',
  INVALID_STATE: 'Estado inválido',
  INVALID_COORDINATES: 'Coordenadas inválidas',
  GEOCODING_FAILED: 'Falha ao obter coordenadas do endereço',
  CEP_API_UNAVAILABLE: 'Serviço de consulta de CEP indisponível',
  VALIDATION_FAILED: 'Falha na validação do endereço',
} as const;

/**
 * Timeout para requisições externas (ms)
 */
export const ADDRESS_TIMEOUTS = {
  CEP_API: 5000, // 5 segundos
  GEOCODING_API: 10000, // 10 segundos
  REVERSE_GEOCODING_API: 10000, // 10 segundos
} as const;

/**
 * Configurações de retry para APIs externas
 */
export const ADDRESS_RETRY = {
  MAX_ATTEMPTS: 3,
  DELAY_MS: 1000,
  BACKOFF_MULTIPLIER: 2,
} as const;
