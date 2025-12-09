/**
 * Constantes do módulo de entregas
 *
 * Define valores padrão, limites e configurações fixas
 * usadas em todo o módulo de entregas
 */

/**
 * Prefixo dos códigos de rastreamento
 */
export const TRACKING_CODE_PREFIX = 'NXT';

/**
 * Tamanho da sequência numérica no código de rastreamento
 */
export const TRACKING_CODE_SEQUENCE_LENGTH = 5;

/**
 * Número máximo de tentativas de entrega padrão
 */
export const MAX_DELIVERY_ATTEMPTS = 3;

/**
 * Duração padrão da janela de entrega em horas
 */
export const DEFAULT_DELIVERY_WINDOW_HOURS = 4;

/**
 * Distância máxima de entrega em km
 */
export const MAX_DELIVERY_DISTANCE_KM = 200;

/**
 * Distância mínima para considerar entregas na mesma região (km)
 */
export const MIN_REGION_DISTANCE_KM = 5;

/**
 * Tempo médio de parada/serviço por entrega (minutos)
 */
export const AVERAGE_SERVICE_TIME_MINUTES = 15;

/**
 * Velocidade média de entrega urbana (km/h)
 */
export const AVERAGE_URBAN_SPEED_KMH = 30;

/**
 * Velocidade média de entrega rodoviária (km/h)
 */
export const AVERAGE_HIGHWAY_SPEED_KMH = 80;

/**
 * Tempo mínimo da janela de entrega (minutos)
 */
export const MIN_TIME_WINDOW_DURATION_MINUTES = 30;

/**
 * Tempo máximo da janela de entrega (horas)
 */
export const MAX_TIME_WINDOW_DURATION_HOURS = 12;

/**
 * Peso máximo padrão para entregas (kg)
 */
export const MAX_DELIVERY_WEIGHT_KG = 30;

/**
 * Raio de geofence para detecção de chegada (metros)
 */
export const GEOFENCE_ARRIVAL_RADIUS_METERS = 100;

/**
 * Intervalo de atualização de localização em tempo real (segundos)
 */
export const TRACKING_UPDATE_INTERVAL_SECONDS = 30;

/**
 * Número máximo de entregas por rota
 */
export const MAX_DELIVERIES_PER_ROUTE = 20;

/**
 * Tempo de expiração do código de rastreamento (dias)
 * Após esse período, entregas antigas podem ser arquivadas
 */
export const TRACKING_CODE_EXPIRATION_DAYS = 90;

/**
 * Tempo mínimo de antecedência para agendamento (horas)
 */
export const MIN_SCHEDULE_ADVANCE_HOURS = 2;

/**
 * Tempo máximo de atraso tolerado (minutos)
 */
export const MAX_DELAY_TOLERANCE_MINUTES = 30;

/**
 * Bounds do Brasil para validação de coordenadas
 */
export const BRAZIL_BOUNDS = {
  minLat: -33.75,
  maxLat: 5.27,
  minLon: -73.99,
  maxLon: -28.84,
} as const;

/**
 * Regex para validação de CEP brasileiro
 */
export const CEP_REGEX = /^\d{5}-?\d{3}$/;

/**
 * Regex para validação de telefone brasileiro (celular)
 */
export const MOBILE_PHONE_REGEX = /^(?:\+?55\s?)?(?:\(?[1-9]{2}\)?\s?)?9\d{4}-?\d{4}$/;

/**
 * Regex para validação de telefone fixo brasileiro
 */
export const LANDLINE_PHONE_REGEX = /^(?:\+?55\s?)?(?:\(?[1-9]{2}\)?\s?)?[2-5]\d{3}-?\d{4}$/;

/**
 * Regex para validação de código de rastreamento
 */
export const TRACKING_CODE_REGEX = /^NXT-\d{8}-\d{5}$/;

/**
 * Estados brasileiros válidos (UF)
 */
export const VALID_BRAZILIAN_STATES = [
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
 * Tipos de documentos aceitos para comprovação de entrega
 */
export const PROOF_DOCUMENT_TYPES = ['signature', 'photo', 'id_document', 'barcode_scan'] as const;

/**
 * Formatos de imagem aceitos para comprovação
 */
export const ACCEPTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * Tamanho máximo de arquivo de imagem (MB)
 */
export const MAX_IMAGE_SIZE_MB = 5;

/**
 * Mensagens de erro padrão
 */
export const ERROR_MESSAGES = {
  INVALID_TRACKING_CODE: 'Código de rastreamento inválido',
  INVALID_ADDRESS: 'Endereço inválido',
  INVALID_COORDINATES: 'Coordenadas inválidas',
  INVALID_PHONE: 'Número de telefone inválido',
  INVALID_TIME_WINDOW: 'Janela de tempo inválida',
  DELIVERY_NOT_FOUND: 'Entrega não encontrada',
  DRIVER_NOT_AVAILABLE: 'Motorista não disponível',
  MAX_DISTANCE_EXCEEDED: 'Distância máxima excedida',
  INVALID_STATUS_TRANSITION: 'Transição de status inválida',
  DELIVERY_ALREADY_COMPLETED: 'Entrega já foi concluída',
  DELIVERY_ALREADY_CANCELLED: 'Entrega já foi cancelada',
  MAX_ATTEMPTS_REACHED: 'Número máximo de tentativas atingido',
  TIME_WINDOW_EXPIRED: 'Janela de tempo expirada',
} as const;

/**
 * Mensagens de sucesso padrão
 */
export const SUCCESS_MESSAGES = {
  DELIVERY_CREATED: 'Entrega criada com sucesso',
  DELIVERY_ASSIGNED: 'Motorista atribuído com sucesso',
  DELIVERY_PICKED_UP: 'Entrega coletada com sucesso',
  DELIVERY_COMPLETED: 'Entrega concluída com sucesso',
  DELIVERY_CANCELLED: 'Entrega cancelada com sucesso',
  STATUS_UPDATED: 'Status atualizado com sucesso',
  NOTIFICATION_SENT: 'Notificação enviada com sucesso',
} as const;
