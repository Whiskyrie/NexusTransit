/**
 * Tipo de Evento de Rastreamento
 *
 * Define os diferentes tipos de eventos que podem ocorrer durante o rastreamento
 */
export enum EventType {
  /**
   * Entrega criada no sistema
   */
  CREATED = 'CREATED',

  /**
   * Entrega atribuída a uma rota/motorista
   */
  ASSIGNED = 'ASSIGNED',

  /**
   * Motorista iniciou processo de coleta
   */
  PICKUP_STARTED = 'PICKUP_STARTED',

  /**
   * Coleta concluída
   */
  PICKED_UP = 'PICKED_UP',

  /**
   * Em trânsito para o destino
   */
  IN_TRANSIT = 'IN_TRANSIT',

  /**
   * Próximo ao destino (< 2km)
   */
  NEAR_DESTINATION = 'NEAR_DESTINATION',

  /**
   * Chegou ao local de entrega (< 100m)
   */
  ARRIVED = 'ARRIVED',

  /**
   * Entrega concluída com sucesso
   */
  DELIVERED = 'DELIVERED',

  /**
   * Falha na entrega
   */
  FAILED = 'FAILED',

  /**
   * Entrega cancelada
   */
  CANCELED = 'CANCELED',

  /**
   * Atraso detectado
   */
  DELAYED = 'DELAYED',

  /**
   * Entrega reagendada
   */
  RESCHEDULED = 'RESCHEDULED',
}

/**
 * Descrições legíveis dos tipos de eventos
 */
export const EventTypeDescriptions: Record<EventType, string> = {
  [EventType.CREATED]: 'Criada',
  [EventType.ASSIGNED]: 'Atribuída',
  [EventType.PICKUP_STARTED]: 'Coleta Iniciada',
  [EventType.PICKED_UP]: 'Coletada',
  [EventType.IN_TRANSIT]: 'Em Trânsito',
  [EventType.NEAR_DESTINATION]: 'Próximo ao Destino',
  [EventType.ARRIVED]: 'Chegou ao Local',
  [EventType.DELIVERED]: 'Entregue',
  [EventType.FAILED]: 'Falha na Entrega',
  [EventType.CANCELED]: 'Cancelada',
  [EventType.DELAYED]: 'Atrasada',
  [EventType.RESCHEDULED]: 'Reagendada',
};

/**
 * Transições válidas entre tipos de eventos
 */
export const EventTypeTransitions: Record<EventType, EventType[]> = {
  [EventType.CREATED]: [EventType.ASSIGNED, EventType.PICKUP_STARTED, EventType.CANCELED],
  [EventType.ASSIGNED]: [EventType.PICKUP_STARTED, EventType.CANCELED],
  [EventType.PICKUP_STARTED]: [EventType.PICKED_UP, EventType.CANCELED],
  [EventType.PICKED_UP]: [EventType.IN_TRANSIT, EventType.CANCELED],
  [EventType.IN_TRANSIT]: [
    EventType.NEAR_DESTINATION,
    EventType.ARRIVED,
    EventType.DELAYED,
    EventType.CANCELED,
  ],
  [EventType.NEAR_DESTINATION]: [EventType.ARRIVED, EventType.DELAYED, EventType.CANCELED],
  [EventType.ARRIVED]: [EventType.DELIVERED, EventType.FAILED, EventType.CANCELED],
  [EventType.DELIVERED]: [],
  [EventType.FAILED]: [EventType.RESCHEDULED],
  [EventType.CANCELED]: [],
  [EventType.DELAYED]: [
    EventType.IN_TRANSIT,
    EventType.ARRIVED,
    EventType.CANCELED,
    EventType.RESCHEDULED,
  ],
  [EventType.RESCHEDULED]: [EventType.ASSIGNED, EventType.PICKUP_STARTED],
};

/**
 * Valida se um tipo de evento é válido
 */
export function isValidEventType(eventType: string): eventType is EventType {
  return Object.values(EventType).includes(eventType as EventType);
}

/**
 * Valida se uma transição de evento é válida
 */
export function isValidEventTransition(from: EventType, to: EventType): boolean {
  const allowedTransitions = EventTypeTransitions[from];
  return allowedTransitions.includes(to);
}

/**
 * Obtém todos os tipos de eventos disponíveis
 */
export function getAvailableEventTypes(): EventType[] {
  return Object.values(EventType);
}

/**
 * Obtém a descrição legível de um tipo de evento
 */
export function getEventTypeDescription(eventType: EventType): string {
  return EventTypeDescriptions[eventType] || eventType;
}

/**
 * Verifica se um evento é terminal (não permite mais transições)
 */
export function isTerminalEvent(eventType: EventType): boolean {
  return EventTypeTransitions[eventType].length === 0;
}
