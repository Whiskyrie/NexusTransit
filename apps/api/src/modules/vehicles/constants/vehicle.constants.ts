/**
 * Constantes para o módulo de veículos
 */

// Limites e validações
export const VEHICLE_CONSTANTS = {
  // Validações de placa
  LICENSE_PLATE: {
    MIN_LENGTH: 7,
    MAX_LENGTH: 8,
    OLD_FORMAT_REGEX: /^[A-Z]{3}-\d{4}$/,
    MERCOSUL_FORMAT_REGEX: /^[A-Z]{3}\d[A-Z]\d{2}$/,
  },

  // Limites de capacidade
  CAPACITY: {
    MIN_LOAD_CAPACITY: 0,
    MAX_LOAD_CAPACITY: 50000, // 50 toneladas
    MIN_CARGO_VOLUME: 0,
    MAX_CARGO_VOLUME: 200, // 200 m³
    MIN_FUEL_CAPACITY: 0,
    MAX_FUEL_CAPACITY: 1000, // 1000 litros
    MIN_PASSENGER_CAPACITY: 0,
    MAX_PASSENGER_CAPACITY: 60, // Ônibus grandes
  },

  // Limites de ano
  YEAR: {
    MIN_YEAR: 1900,
    MAX_YEAR: new Date().getFullYear() + 2, // Até 2 anos no futuro
  },

  // Limites de quilometragem
  MILEAGE: {
    MIN_MILEAGE: 0,
    MAX_MILEAGE: 9999999, // 9.999.999 km
  },

  // Configurações de documentos
  DOCUMENTS: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES_PER_UPLOAD: 10,
    ALLOWED_MIME_TYPES: [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    ALLOWED_EXTENSIONS: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
  },

  // Configurações de paginação
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // Configurações de manutenção
  MAINTENANCE: {
    DEFAULT_INTERVAL_DAYS: 180, // 6 meses
    DEFAULT_INTERVAL_KM: 10000, // 10.000 km
    WARNING_DAYS_BEFORE: 30, // Avisar 30 dias antes
  },
} as const;

// Mensagens de erro
export const VEHICLE_ERROR_MESSAGES = {
  NOT_FOUND: 'Veículo não encontrado',
  LICENSE_PLATE_EXISTS: 'Veículo com esta placa já existe',
  INVALID_LICENSE_PLATE: 'Placa de veículo inválida',
  INVALID_STATUS_TRANSITION: 'Transição de status não permitida',
  DOCUMENT_NOT_FOUND: 'Documento não encontrado',
  INVALID_FILE_TYPE: 'Tipo de arquivo não permitido',
  FILE_TOO_LARGE: 'Arquivo muito grande',
  TOO_MANY_FILES: 'Muitos arquivos enviados',
} as const;

// Padrões de formatação
export const VEHICLE_FORMATS = {
  LICENSE_PLATE_DISPLAY: /([A-Z]{3})([0-9A-Z]{4})/,
  LICENSE_PLATE_REPLACEMENT: '$1-$2',
} as const;
