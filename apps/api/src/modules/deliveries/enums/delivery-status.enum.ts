/**
 * Enum para status de entrega
 * Define o fluxo completo do ciclo de vida de uma entrega
 */
export enum DeliveryStatus {
  /** Aguardando atribuição de motorista/veículo */
  PENDING = 'PENDING',

  /** Entrega atribuída a um motorista */
  ASSIGNED = 'ASSIGNED',

  /** Produto coletado no remetente */
  PICKED_UP = 'PICKED_UP',

  /** Em trânsito para o destino */
  IN_TRANSIT = 'IN_TRANSIT',

  /** Saiu para entrega final */
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',

  /** Entrega realizada com sucesso */
  DELIVERED = 'DELIVERED',

  /** Falha na entrega */
  FAILED = 'FAILED',

  /** Entrega cancelada */
  CANCELLED = 'CANCELLED',
}

/**
 * Descrições detalhadas dos status para exibição em UI
 */
export const DeliveryStatusDescriptions: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]: 'Aguardando atribuição',
  [DeliveryStatus.ASSIGNED]: 'Atribuída ao motorista',
  [DeliveryStatus.PICKED_UP]: 'Produto coletado',
  [DeliveryStatus.IN_TRANSIT]: 'Em trânsito',
  [DeliveryStatus.OUT_FOR_DELIVERY]: 'Saiu para entrega',
  [DeliveryStatus.DELIVERED]: 'Entregue com sucesso',
  [DeliveryStatus.FAILED]: 'Falha na entrega',
  [DeliveryStatus.CANCELLED]: 'Cancelada',
};

/**
 * Transições válidas entre status
 * Controla o fluxo de trabalho para evitar transições inválidas
 */
export const DeliveryStatusTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.PENDING]: [DeliveryStatus.ASSIGNED, DeliveryStatus.CANCELLED],
  [DeliveryStatus.ASSIGNED]: [
    DeliveryStatus.PICKED_UP,
    DeliveryStatus.PENDING,
    DeliveryStatus.CANCELLED,
  ],
  [DeliveryStatus.PICKED_UP]: [DeliveryStatus.IN_TRANSIT, DeliveryStatus.FAILED],
  [DeliveryStatus.IN_TRANSIT]: [DeliveryStatus.OUT_FOR_DELIVERY, DeliveryStatus.FAILED],
  [DeliveryStatus.OUT_FOR_DELIVERY]: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED],
  [DeliveryStatus.DELIVERED]: [], // Status final
  [DeliveryStatus.FAILED]: [DeliveryStatus.ASSIGNED, DeliveryStatus.CANCELLED],
  [DeliveryStatus.CANCELLED]: [], // Status final
};

/**
 * Status finais (não permitem mais transições)
 */
export const FinalDeliveryStatuses = [DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED];

/**
 * Status que indicam entrega em andamento
 */
export const ActiveDeliveryStatuses = [
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.IN_TRANSIT,
  DeliveryStatus.OUT_FOR_DELIVERY,
];
