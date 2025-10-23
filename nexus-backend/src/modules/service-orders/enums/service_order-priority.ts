/**
 * Prioridade da ordem de serviço
 * Define o nível de urgência e importância da ordem
 */
export enum OrderPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Descrições das prioridades
 */
export const OrderPriorityDescriptions: Record<OrderPriority, string> = {
  [OrderPriority.LOW]: 'Baixa',
  [OrderPriority.NORMAL]: 'Normal',
  [OrderPriority.HIGH]: 'Alta',
  [OrderPriority.URGENT]: 'Urgente',
};

/**
 * Pesos numéricos para ordenação
 * Valores maiores = maior prioridade
 */
export const OrderPriorityWeights: Record<OrderPriority, number> = {
  [OrderPriority.LOW]: 1,
  [OrderPriority.NORMAL]: 2,
  [OrderPriority.HIGH]: 3,
  [OrderPriority.URGENT]: 4,
};
