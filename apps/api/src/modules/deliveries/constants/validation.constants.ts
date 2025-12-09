/**
 * Constantes de validação para o módulo de entregas
 *
 * Contém regras, padrões e limites usados em validações
 */

/**
 * Expressões regulares para validação
 */
export const VALIDATION_PATTERNS = {
  /** CEP brasileiro: 12345-678 ou 12345678 */
  CEP: /^\d{5}-?\d{3}$/,

  /** Telefone celular brasileiro: (11) 91234-5678 */
  MOBILE_PHONE: /^(?:\+?55\s?)?(?:\(?[1-9]{2}\)?\s?)?9\d{4}-?\d{4}$/,

  /** Telefone fixo brasileiro: (11) 1234-5678 */
  LANDLINE_PHONE: /^(?:\+?55\s?)?(?:\(?[1-9]{2}\)?\s?)?[2-5]\d{3}-?\d{4}$/,

  /** Código de rastreamento: NXT-20240101-00001 */
  TRACKING_CODE: /^NXT-\d{8}-\d{5}$/,

  /** Placa de veículo (Mercosul): ABC1D23 */
  VEHICLE_PLATE_MERCOSUL: /^[A-Z]{3}\d[A-Z]\d{2}$/,

  /** Placa de veículo (antiga): ABC-1234 */
  VEHICLE_PLATE_OLD: /^[A-Z]{3}-?\d{4}$/,

  /** CNPJ: 12.345.678/0001-90 */
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,

  /** CPF: 123.456.789-01 */
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,

  /** Email */
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
} as const;

/**
 * Limites de validação
 */
export const VALIDATION_LIMITS = {
  /** Comprimento mínimo de rua */
  MIN_STREET_LENGTH: 3,

  /** Comprimento máximo de rua */
  MAX_STREET_LENGTH: 200,

  /** Comprimento mínimo de cidade */
  MIN_CITY_LENGTH: 2,

  /** Comprimento máximo de cidade */
  MAX_CITY_LENGTH: 100,

  /** Comprimento de UF (estado) */
  STATE_LENGTH: 2,

  /** Peso mínimo de entrega (kg) */
  MIN_DELIVERY_WEIGHT: 0.1,

  /** Peso máximo de entrega (kg) */
  MAX_DELIVERY_WEIGHT: 30,

  /** Distância mínima de entrega (km) */
  MIN_DELIVERY_DISTANCE: 0.1,

  /** Distância máxima de entrega (km) */
  MAX_DELIVERY_DISTANCE: 200,

  /** Duração mínima de janela de tempo (minutos) */
  MIN_TIME_WINDOW_MINUTES: 30,

  /** Duração máxima de janela de tempo (horas) */
  MAX_TIME_WINDOW_HOURS: 12,

  /** Número mínimo de tentativas de entrega */
  MIN_DELIVERY_ATTEMPTS: 1,

  /** Número máximo de tentativas de entrega */
  MAX_DELIVERY_ATTEMPTS: 5,

  /** Tamanho máximo de nota/observação (caracteres) */
  MAX_NOTE_LENGTH: 500,

  /** Tamanho máximo de descrição de item (caracteres) */
  MAX_ITEM_DESCRIPTION_LENGTH: 200,

  /** Número máximo de itens por entrega */
  MAX_ITEMS_PER_DELIVERY: 50,

  /** Tamanho máximo de arquivo de imagem (MB) */
  MAX_IMAGE_SIZE_MB: 5,

  /** Tamanho máximo de arquivo de documento (MB) */
  MAX_DOCUMENT_SIZE_MB: 10,
} as const;

/**
 * Coordenadas válidas para o Brasil
 */
export const COORDINATES_BOUNDS = {
  /** Latitude mínima do Brasil */
  MIN_LATITUDE: -33.75,

  /** Latitude máxima do Brasil */
  MAX_LATITUDE: 5.27,

  /** Longitude mínima do Brasil */
  MIN_LONGITUDE: -73.99,

  /** Longitude máxima do Brasil */
  MAX_LONGITUDE: -28.84,
} as const;

/**
 * Regras de validação para endereços
 */
export const ADDRESS_VALIDATION_RULES = {
  /** Campos obrigatórios de endereço */
  REQUIRED_FIELDS: ['street', 'city', 'state', 'postal_code'] as const,

  /** Campos opcionais de endereço */
  OPTIONAL_FIELDS: [
    'number',
    'complement',
    'neighborhood',
    'country',
    'latitude',
    'longitude',
    'instructions',
  ] as const,

  /** País padrão */
  DEFAULT_COUNTRY: 'Brasil',
} as const;

/**
 * Tipos de validação personalizados
 */
export const CUSTOM_VALIDATION_TYPES = {
  /** Validação de código de rastreamento */
  TRACKING_CODE: 'is-tracking-code',

  /** Validação de endereço brasileiro */
  BRAZILIAN_ADDRESS: 'is-valid-address',

  /** Validação de coordenadas */
  COORDINATES: 'is-valid-coordinates',

  /** Validação de telefone brasileiro */
  PHONE_BR: 'is-phone-number-br',

  /** Validação de CEP */
  CEP: 'is-valid-cep',

  /** Validação de janela de tempo */
  TIME_WINDOW: 'is-valid-time-window',
} as const;

/**
 * Mensagens de validação padrão
 */
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'Campo obrigatório',
  INVALID_FORMAT: 'Formato inválido',
  INVALID_CEP: 'CEP inválido',
  INVALID_PHONE: 'Telefone inválido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_TRACKING_CODE: 'Código de rastreamento inválido',
  INVALID_COORDINATES: 'Coordenadas inválidas',
  INVALID_ADDRESS: 'Endereço inválido',
  OUT_OF_BOUNDS: 'Valor fora dos limites permitidos',
  TOO_SHORT: 'Valor muito curto',
  TOO_LONG: 'Valor muito longo',
  INVALID_TIME_WINDOW: 'Janela de tempo inválida',
  PAST_DATE: 'Data não pode ser no passado',
  FUTURE_DATE: 'Data não pode ser no futuro',
  INVALID_STATE: 'Estado inválido',
  INVALID_COUNTRY: 'País inválido',
} as const;

/**
 * Estados brasileiros válidos
 */
export const VALID_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

/**
 * DDDs válidos por região
 */
export const VALID_DDD_BY_REGION = {
  NORTE: ['68', '96', '92', '97', '91', '93', '94', '69', '95', '63'],
  NORDESTE: [
    '82',
    '71',
    '73',
    '74',
    '75',
    '77',
    '85',
    '88',
    '98',
    '99',
    '83',
    '81',
    '87',
    '86',
    '89',
    '84',
    '79',
  ],
  CENTRO_OESTE: ['61', '62', '64', '65', '66', '67'],
  SUDESTE: [
    '27',
    '28',
    '31',
    '32',
    '33',
    '34',
    '35',
    '37',
    '38',
    '21',
    '22',
    '24',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
  ],
  SUL: ['41', '42', '43', '44', '45', '46', '51', '53', '54', '55', '47', '48', '49'],
} as const;

/**
 * Tipos de comprovação aceitos
 */
export const PROOF_TYPES = {
  SIGNATURE: 'signature',
  PHOTO: 'photo',
  ID_DOCUMENT: 'id_document',
  BARCODE: 'barcode_scan',
  QR_CODE: 'qr_code_scan',
} as const;
