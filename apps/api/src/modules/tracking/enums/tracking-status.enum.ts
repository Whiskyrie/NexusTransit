/**
 * Status de rastreamento
 *
 * Define os estados possíveis de uma entrega durante o rastreamento
 */
export enum TrackingStatus {
  /**
   * Em trânsito para o destino
   */
  IN_TRANSIT = 'IN_TRANSIT',

  /**
   * Aguardando coleta
   */
  AWAITING_PICKUP = 'AWAITING_PICKUP',

  /**
   * Em um hub/centro de distribuição
   */
  AT_HUB = 'AT_HUB',

  /**
   * Saiu para entrega
   */
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',

  /**
   * Entrega realizada com sucesso
   */
  DELIVERED = 'DELIVERED',

  /**
   * Falha na tentativa de entrega
   */
  DELIVERY_FAILED = 'DELIVERY_FAILED',

  /**
   * Em processo de devolução
   */
  RETURNING = 'RETURNING',

  /**
   * Atrasado
   */
  DELAYED = 'DELAYED',

  /**
   * Em espera/retido
   */
  ON_HOLD = 'ON_HOLD',
}

/**
 * Tipo de evento de rastreamento
 *
 * Define os diferentes tipos de eventos que podem ocorrer
 */
export enum TrackingEventType {
  /**
   * Coleta realizada
   */
  PICKUP = 'PICKUP',

  /**
   * Chegada em hub
   */
  HUB_ARRIVAL = 'HUB_ARRIVAL',

  /**
   * Saída de hub
   */
  HUB_DEPARTURE = 'HUB_DEPARTURE',

  /**
   * Saiu para entrega
   */
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',

  /**
   * Entrega realizada
   */
  DELIVERED = 'DELIVERED',

  /**
   * Tentativa de entrega
   */
  DELIVERY_ATTEMPT = 'DELIVERY_ATTEMPT',

  /**
   * Exceção/problema
   */
  EXCEPTION = 'EXCEPTION',

  /**
   * Atraso reportado
   */
  DELAY = 'DELAY',

  /**
   * Atualização de localização
   */
  LOCATION_UPDATE = 'LOCATION_UPDATE',

  /**
   * Mudança de status
   */
  STATUS_CHANGE = 'STATUS_CHANGE',
}

/**
 * Descrições dos status para exibição
 */
export const TrackingStatusDescriptions: Record<TrackingStatus, string> = {
  [TrackingStatus.IN_TRANSIT]: 'Em Trânsito',
  [TrackingStatus.AWAITING_PICKUP]: 'Aguardando Coleta',
  [TrackingStatus.AT_HUB]: 'No Centro de Distribuição',
  [TrackingStatus.OUT_FOR_DELIVERY]: 'Saiu para Entrega',
  [TrackingStatus.DELIVERED]: 'Entregue',
  [TrackingStatus.DELIVERY_FAILED]: 'Falha na Entrega',
  [TrackingStatus.RETURNING]: 'Em Devolução',
  [TrackingStatus.DELAYED]: 'Atrasado',
  [TrackingStatus.ON_HOLD]: 'Em Espera',
};

/**
 * Descrições dos eventos para exibição
 */
export const TrackingEventTypeDescriptions: Record<TrackingEventType, string> = {
  [TrackingEventType.PICKUP]: 'Coleta Realizada',
  [TrackingEventType.HUB_ARRIVAL]: 'Chegada no Hub',
  [TrackingEventType.HUB_DEPARTURE]: 'Saída do Hub',
  [TrackingEventType.OUT_FOR_DELIVERY]: 'Saiu para Entrega',
  [TrackingEventType.DELIVERED]: 'Entrega Realizada',
  [TrackingEventType.DELIVERY_ATTEMPT]: 'Tentativa de Entrega',
  [TrackingEventType.EXCEPTION]: 'Exceção',
  [TrackingEventType.DELAY]: 'Atraso',
  [TrackingEventType.LOCATION_UPDATE]: 'Atualização de Localização',
  [TrackingEventType.STATUS_CHANGE]: 'Mudança de Status',
};

/**
 * Valida se um status é válido
 */
export function isValidTrackingStatus(status: string): status is TrackingStatus {
  return Object.values(TrackingStatus).includes(status as TrackingStatus);
}

/**
 * Valida se um tipo de evento é válido
 */
export function isValidEventType(eventType: string): eventType is TrackingEventType {
  return Object.values(TrackingEventType).includes(eventType as TrackingEventType);
}

/**
 * Obtém todos os status disponíveis
 */
export function getAvailableStatuses(): TrackingStatus[] {
  return Object.values(TrackingStatus);
}

/**
 * Obtém todos os tipos de eventos disponíveis
 */
export function getAvailableEventTypes(): TrackingEventType[] {
  return Object.values(TrackingEventType);
}
