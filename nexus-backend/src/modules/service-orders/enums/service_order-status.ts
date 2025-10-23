/**
 * Status da ordem de serviço
 *
 * Define os diferentes estados que uma ordem pode ter durante seu ciclo de vida
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

/**
 * Descrições dos status para exibição
 */
export const OrderStatusDescriptions: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pendente',
  [OrderStatus.SCHEDULED]: 'Agendada',
  [OrderStatus.IN_PROGRESS]: 'Em Execução',
  [OrderStatus.DELIVERED]: 'Entregue',
  [OrderStatus.CANCELLED]: 'Cancelada',
  [OrderStatus.FAILED]: 'Falha na Entrega',
};

/**
 * Status finais (que não permitem mais transições)
 */
export const FinalOrderStatuses = [OrderStatus.DELIVERED, OrderStatus.CANCELLED];

/**
 * Transições válidas de status
 */
export const OrderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.SCHEDULED, OrderStatus.CANCELLED],
  [OrderStatus.SCHEDULED]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.DELIVERED, OrderStatus.FAILED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [], // Status final
  [OrderStatus.FAILED]: [OrderStatus.SCHEDULED, OrderStatus.CANCELLED],
  [OrderStatus.CANCELLED]: [], // Status final
};

/**
 * Valida se uma transição de status é permitida
 */
export function isValidStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): boolean {
  const allowedTransitions = OrderStatusTransitions[currentStatus];
  return allowedTransitions.includes(newStatus);
}
