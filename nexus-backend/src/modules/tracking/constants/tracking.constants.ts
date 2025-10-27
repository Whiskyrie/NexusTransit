/**
 * Constantes para o módulo de rastreamento
 */

// Limites e validações
export const TRACKING_CONSTANTS = {
  // Validações de coordenadas
  COORDINATES: {
    MIN_LATITUDE: -90,
    MAX_LATITUDE: 90,
    MIN_LONGITUDE: -180,
    MAX_LONGITUDE: 180,
    MIN_ALTITUDE: -500, // Abaixo do nível do mar
    MAX_ALTITUDE: 9000, // Altitude máxima considerável
    PRECISION_DECIMALS: 7, // Precisão GPS padrão
  },

  // Limites de velocidade
  SPEED: {
    MIN_SPEED: 0,
    MAX_SPEED: 300, // km/h
    MAX_REALISTIC_SPEED: 150, // Velocidade realista para veículos comerciais
  },

  // Precisão e métricas
  ACCURACY: {
    MIN_ACCURACY: 0,
    MAX_ACCURACY: 1000, // metros
    GOOD_ACCURACY: 20, // < 20m é considerado boa precisão
    ACCEPTABLE_ACCURACY: 50, // < 50m é aceitável
  },

  // Bateria e sinal
  BATTERY: {
    MIN_LEVEL: 0,
    MAX_LEVEL: 100,
    LOW_BATTERY_THRESHOLD: 20,
    CRITICAL_BATTERY_THRESHOLD: 10,
  },

  SIGNAL: {
    MIN_STRENGTH: 0,
    MAX_STRENGTH: 100,
    WEAK_SIGNAL_THRESHOLD: 30,
    GOOD_SIGNAL_THRESHOLD: 70,
  },

  // Direção (heading)
  HEADING: {
    MIN_DEGREES: 0,
    MAX_DEGREES: 360,
  },

  // Configurações de parada
  STOP_DETECTION: {
    MIN_SPEED_FOR_STOP: 5, // km/h - abaixo disso considera parado
    MIN_DURATION_FOR_STOP: 2, // minutos - tempo mínimo para considerar uma parada
    MAX_RADIUS_FOR_STOP: 50, // metros - raio máximo de movimento para considerar parado
  },

  // Validação de pontos
  POINT_VALIDATION: {
    MAX_DISTANCE_BETWEEN_POINTS: 100, // km - distância máxima realista entre dois pontos consecutivos
    MAX_TIME_GAP: 3600, // segundos (1 hora) - tempo máximo entre pontos
    MIN_TIME_BETWEEN_POINTS: 5, // segundos - tempo mínimo entre pontos
  },

  // Paginação
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 500, // Mais alto que outros módulos devido a natureza de tracking
  },

  // Tipos de evento comuns
  EVENT_TYPES: {
    ROUTE_START: 'inicio_rota',
    ROUTE_END: 'fim_rota',
    DELIVERY_START: 'inicio_entrega',
    DELIVERY_END: 'fim_entrega',
    STOP: 'parada',
    FUEL: 'abastecimento',
    MAINTENANCE: 'manutencao',
    CHECKPOINT: 'checkpoint',
    EMERGENCY: 'emergencia',
    MANUAL: 'manual',
    AUTOMATIC: 'automatico',
  },

  // Configurações de dispositivo
  DEVICE: {
    MAX_DEVICE_ID_LENGTH: 100,
    MAX_DEVICE_TYPE_LENGTH: 50,
    TYPES: {
      GPS_TRACKER: 'GPS',
      MOBILE_APP: 'Mobile',
      TABLET: 'Tablet',
      OBD: 'OBD',
      SATELLITE: 'Satellite',
    },
  },

  // Geocoding
  ADDRESS: {
    MAX_ADDRESS_LENGTH: 255,
    MAX_CITY_LENGTH: 100,
    MAX_STATE_LENGTH: 2,
    MAX_COUNTRY_LENGTH: 50,
    MAX_POSTAL_CODE_LENGTH: 20,
  },

  // Cache e performance
  CACHE: {
    LAST_POSITION_TTL: 300, // 5 minutos
    ROUTE_STATS_TTL: 600, // 10 minutos
  },

  // Retenção de dados
  DATA_RETENTION: {
    KEEP_RAW_DATA_DAYS: 90, // Manter dados brutos por 90 dias
    KEEP_AGGREGATED_DATA_DAYS: 365, // Dados agregados por 1 ano
  },
} as const;

/**
 * Mensagens de erro padrão
 */
export const TRACKING_ERROR_MESSAGES = {
  INVALID_COORDINATES: 'Coordenadas GPS inválidas',
  INVALID_LATITUDE: 'Latitude deve estar entre -90 e 90',
  INVALID_LONGITUDE: 'Longitude deve estar entre -180 e 180',
  INVALID_SPEED: 'Velocidade inválida ou irrealista',
  INVALID_ACCURACY: 'Precisão GPS fora do intervalo aceitável',
  POINT_NOT_FOUND: 'Ponto de rastreamento não encontrado',
  NO_ENTITY_SPECIFIED: 'É necessário especificar delivery_id, vehicle_id ou driver_id',
  INVALID_TIME_SEQUENCE: 'Timestamp do ponto está fora de sequência',
  DUPLICATE_POINT: 'Ponto duplicado detectado',
  INVALID_DISTANCE: 'Distância entre pontos é irrealista',
} as const;

/**
 * Mensagens de sucesso
 */
export const TRACKING_SUCCESS_MESSAGES = {
  POINT_CREATED: 'Ponto de rastreamento registrado com sucesso',
  POINT_UPDATED: 'Ponto de rastreamento atualizado',
  POINT_DELETED: 'Ponto de rastreamento removido',
  ROUTE_COMPLETED: 'Rota completada e registrada',
} as const;
