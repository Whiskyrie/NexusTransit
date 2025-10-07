/**
 * Enum para prioridade de entrega
 * Define o nível de urgência e importância da entrega
 */
export enum DeliveryPriority {
  /** Baixa prioridade - entregas padrão */
  LOW = 'LOW',

  /** Prioridade normal - padrão do sistema */
  NORMAL = 'NORMAL',

  /** Alta prioridade - entregas urgentes */
  HIGH = 'HIGH',

  /** Prioridade crítica - emergências */
  CRITICAL = 'CRITICAL',
}

/**
 * Descrições detalhadas das prioridades para exibição em UI
 */
export const DeliveryPriorityDescriptions: Record<DeliveryPriority, string> = {
  [DeliveryPriority.LOW]: 'Baixa prioridade',
  [DeliveryPriority.NORMAL]: 'Prioridade normal',
  [DeliveryPriority.HIGH]: 'Alta prioridade',
  [DeliveryPriority.CRITICAL]: 'Prioridade crítica',
};

/**
 * Pesos numéricos para ordenação e cálculos
 * Valores maiores indicam maior prioridade
 */
export const DeliveryPriorityWeights: Record<DeliveryPriority, number> = {
  [DeliveryPriority.LOW]: 1,
  [DeliveryPriority.NORMAL]: 2,
  [DeliveryPriority.HIGH]: 3,
  [DeliveryPriority.CRITICAL]: 4,
};

/**
 * Prazos máximos para cada nível de prioridade (em horas)
 */
export const DeliveryPriorityDeadlines: Record<DeliveryPriority, number> = {
  [DeliveryPriority.LOW]: 72, // 3 dias
  [DeliveryPriority.NORMAL]: 48, // 2 dias
  [DeliveryPriority.HIGH]: 24, // 1 dia
  [DeliveryPriority.CRITICAL]: 4, // 4 horas
};

/**
 * Cores para representação visual em dashboards
 */
export const DeliveryPriorityColors: Record<DeliveryPriority, string> = {
  [DeliveryPriority.LOW]: '#6B7280', // gray-500
  [DeliveryPriority.NORMAL]: '#3B82F6', // blue-500
  [DeliveryPriority.HIGH]: '#F59E0B', // amber-500
  [DeliveryPriority.CRITICAL]: '#EF4444', // red-500
};
