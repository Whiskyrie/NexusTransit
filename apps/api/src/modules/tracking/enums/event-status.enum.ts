/**
 * Status do Evento de Rastreamento
 *
 * Indica o resultado ou gravidade do evento
 */
export enum EventStatus {
  /**
   * Evento executado com sucesso
   */
  SUCCESS = 'SUCCESS',

  /**
   * Evento com aviso (não crítico)
   */
  WARNING = 'WARNING',

  /**
   * Evento com erro (crítico)
   */
  ERROR = 'ERROR',

  /**
   * Evento informativo
   */
  INFO = 'INFO',
}

/**
 * Descrições legíveis dos status de eventos
 */
export const EventStatusDescriptions: Record<EventStatus, string> = {
  [EventStatus.SUCCESS]: 'Sucesso',
  [EventStatus.WARNING]: 'Aviso',
  [EventStatus.ERROR]: 'Erro',
  [EventStatus.INFO]: 'Informação',
};

/**
 * Ícones associados aos status (para UI)
 */
export const EventStatusIcons: Record<EventStatus, string> = {
  [EventStatus.SUCCESS]: '✓',
  [EventStatus.WARNING]: '⚠',
  [EventStatus.ERROR]: '✗',
  [EventStatus.INFO]: 'ℹ',
};

/**
 * Cores associadas aos status (para UI)
 */
export const EventStatusColors: Record<EventStatus, string> = {
  [EventStatus.SUCCESS]: '#10B981', // green-500
  [EventStatus.WARNING]: '#F59E0B', // amber-500
  [EventStatus.ERROR]: '#EF4444', // red-500
  [EventStatus.INFO]: '#3B82F6', // blue-500
};

/**
 * Valida se um status de evento é válido
 */
export function isValidEventStatus(status: string): status is EventStatus {
  return Object.values(EventStatus).includes(status as EventStatus);
}

/**
 * Obtém todos os status de eventos disponíveis
 */
export function getAvailableEventStatuses(): EventStatus[] {
  return Object.values(EventStatus);
}

/**
 * Obtém a descrição legível de um status de evento
 */
export function getEventStatusDescription(status: EventStatus): string {
  return EventStatusDescriptions[status] || status;
}

/**
 * Obtém o ícone associado a um status de evento
 */
export function getEventStatusIcon(status: EventStatus): string {
  return EventStatusIcons[status] || '';
}

/**
 * Obtém a cor associada a um status de evento
 */
export function getEventStatusColor(status: EventStatus): string {
  return EventStatusColors[status] || '#6B7280'; // gray-500
}
