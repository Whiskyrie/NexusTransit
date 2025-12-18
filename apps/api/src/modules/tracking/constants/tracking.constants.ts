/**
 * Constantes do módulo de rastreamento
 */

/**
 * Raio em metros para considerar que o motorista chegou ao destino
 */
export const ARRIVAL_RADIUS_METERS = 100;

/**
 * Raio em metros para considerar que o motorista está próximo ao destino
 */
export const NEAR_DESTINATION_RADIUS_METERS = 2000;

/**
 * Precisão máxima aceitável do GPS em metros
 */
export const MAX_GPS_ACCURACY_METERS = 100;

/**
 * Velocidade máxima aceitável em km/h
 */
export const MAX_SPEED_KMH = 300;

/**
 * Tempo de cache para rastreamento público em segundos (5 minutos)
 */
export const PUBLIC_TRACKING_CACHE_TTL = 300;

/**
 * Tempo de cache geral em segundos (5 minutos)
 */
export const CACHE_TTL_SECONDS = 300;

/**
 * Duração mínima de parada em minutos para considerar parada não programada
 */
export const MIN_STOP_DURATION_MINUTES = 10;

/**
 * Janela de tempo em minutos para calcular velocidade média
 */
export const AVERAGE_SPEED_WINDOW_MINUTES = 30;

/**
 * Número máximo de eventos em um lote
 */
export const MAX_BATCH_EVENTS = 100;

/**
 * Número máximo de itens por página
 */
export const MAX_ITEMS_PER_PAGE = 100;

/**
 * Tempo de retenção de eventos em meses
 */
export const EVENT_RETENTION_MONTHS = 6;

/**
 * Intervalo de atualização automática de eventos em minutos
 */
export const AUTO_EVENT_UPDATE_INTERVAL_MINUTES = 5;

/**
 * SLA padrão de entrega em minutos
 */
export const DEFAULT_DELIVERY_SLA_MINUTES = 240; // 4 horas

/**
 * Distância mínima entre eventos para considerar movimento significativo (metros)
 */
export const MIN_MOVEMENT_DISTANCE_METERS = 50;

/**
 * Tempo máximo sem atualização antes de considerar desconectado (minutos)
 */
export const MAX_TIME_WITHOUT_UPDATE_MINUTES = 30;

/**
 * Número mínimo de pontos para calcular velocidade média
 */
export const MIN_POINTS_FOR_AVERAGE_SPEED = 2;

/**
 * Precisão decimal para coordenadas (casas decimais)
 */
export const COORDINATE_PRECISION = 7;

/**
 * Mensagens de erro padrão
 */
export const ERROR_MESSAGES = {
  INVALID_COORDINATES: 'Coordenadas geográficas inválidas',
  INVALID_TIMESTAMP: 'Timestamp não pode ser futuro',
  INVALID_TRANSITION: 'Transição de evento inválida',
  DELIVERY_NOT_FOUND: 'Entrega não encontrada',
  DRIVER_NOT_FOUND: 'Motorista não encontrado',
  ROUTE_NOT_FOUND: 'Rota não encontrada',
  EVENT_NOT_FOUND: 'Evento de rastreamento não encontrado',
  ACCURACY_TOO_LOW: 'Precisão do GPS abaixo do aceitável',
  SPEED_TOO_HIGH: 'Velocidade excede o limite máximo',
} as const;

/**
 * Códigos de erro
 */
export const ERROR_CODES = {
  INVALID_COORDINATES: 'ERR_INVALID_COORDINATES',
  INVALID_TIMESTAMP: 'ERR_INVALID_TIMESTAMP',
  INVALID_TRANSITION: 'ERR_INVALID_TRANSITION',
  ENTITY_NOT_FOUND: 'ERR_ENTITY_NOT_FOUND',
  ACCURACY_TOO_LOW: 'ERR_ACCURACY_TOO_LOW',
  SPEED_TOO_HIGH: 'ERR_SPEED_TOO_HIGH',
} as const;
