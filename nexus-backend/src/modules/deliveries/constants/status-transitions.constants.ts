import { DeliveryStatus } from '../enums/delivery-status.enum';

/**
 * Mapa de transições de status permitidas
 *
 * Define quais mudanças de status são válidas no ciclo de vida de uma entrega.
 * Usado para validação de transições de estado.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.PENDING]: [DeliveryStatus.ASSIGNED, DeliveryStatus.CANCELLED],

  [DeliveryStatus.ASSIGNED]: [
    DeliveryStatus.PICKED_UP,
    DeliveryStatus.CANCELLED,
    DeliveryStatus.PENDING, // Pode voltar se motorista desistir
  ],

  [DeliveryStatus.PICKED_UP]: [
    DeliveryStatus.IN_TRANSIT,
    DeliveryStatus.FAILED,
    DeliveryStatus.CANCELLED,
  ],

  [DeliveryStatus.IN_TRANSIT]: [
    DeliveryStatus.OUT_FOR_DELIVERY,
    DeliveryStatus.FAILED,
    DeliveryStatus.CANCELLED,
  ],

  [DeliveryStatus.OUT_FOR_DELIVERY]: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED],

  [DeliveryStatus.DELIVERED]: [
    // Status final - sem transições permitidas
  ],

  [DeliveryStatus.FAILED]: [
    DeliveryStatus.PENDING, // Permite reagendar
    DeliveryStatus.CANCELLED,
  ],

  [DeliveryStatus.CANCELLED]: [
    // Status final - sem transições permitidas
  ],
};

/**
 * Status que permitem cancelamento
 */
export const CANCELLABLE_STATUSES: DeliveryStatus[] = [
  DeliveryStatus.PENDING,
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.IN_TRANSIT,
];

/**
 * Status considerados "em andamento"
 */
export const IN_PROGRESS_STATUSES: DeliveryStatus[] = [
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.IN_TRANSIT,
  DeliveryStatus.OUT_FOR_DELIVERY,
];

/**
 * Status finais (não permitem mais transições)
 */
export const FINAL_STATUSES: DeliveryStatus[] = [
  DeliveryStatus.DELIVERED,
  DeliveryStatus.CANCELLED,
];

/**
 * Status que requerem motorista atribuído
 */
export const DRIVER_REQUIRED_STATUSES: DeliveryStatus[] = [
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.IN_TRANSIT,
  DeliveryStatus.OUT_FOR_DELIVERY,
  DeliveryStatus.DELIVERED,
];

/**
 * Status que permitem reagendamento
 */
export const RESCHEDULABLE_STATUSES: DeliveryStatus[] = [
  DeliveryStatus.PENDING,
  DeliveryStatus.FAILED,
];

/**
 * Valida se uma transição de status é permitida
 *
 * @param from - Status atual
 * @param to - Status desejado
 * @returns True se a transição é válida
 */
export function isValidStatusTransition(from: DeliveryStatus, to: DeliveryStatus): boolean {
  if (from === to) {
    return false; // Não permite transição para o mesmo status
  }

  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[from];
  return allowedTransitions?.includes(to) ?? false;
}

/**
 * Obtém os próximos status possíveis para um status atual
 *
 * @param currentStatus - Status atual
 * @returns Array de status válidos para transição
 */
export function getNextPossibleStatuses(currentStatus: DeliveryStatus): DeliveryStatus[] {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];
}

/**
 * Verifica se um status é final
 *
 * @param status - Status a verificar
 * @returns True se é um status final
 */
export function isFinalStatus(status: DeliveryStatus): boolean {
  return FINAL_STATUSES.includes(status);
}

/**
 * Verifica se um status requer motorista
 *
 * @param status - Status a verificar
 * @returns True se requer motorista
 */
export function requiresDriver(status: DeliveryStatus): boolean {
  return DRIVER_REQUIRED_STATUSES.includes(status);
}

/**
 * Verifica se uma entrega pode ser cancelada no status atual
 *
 * @param status - Status atual
 * @returns True se pode ser cancelada
 */
export function canBeCancelled(status: DeliveryStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status);
}

/**
 * Verifica se uma entrega está em andamento
 *
 * @param status - Status a verificar
 * @returns True se está em andamento
 */
export function isInProgress(status: DeliveryStatus): boolean {
  return IN_PROGRESS_STATUSES.includes(status);
}
