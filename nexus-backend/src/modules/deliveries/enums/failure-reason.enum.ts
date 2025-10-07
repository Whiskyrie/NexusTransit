/**
 * Enum para motivos de falha na entrega
 * Define os possíveis motivos pelos quais uma entrega pode falhar
 */
export enum FailureReason {
  /** Cliente não encontrado no endereço */
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',

  /** Endereço incorreto ou incompleto */
  WRONG_ADDRESS = 'WRONG_ADDRESS',

  /** Cliente recusou a entrega */
  CUSTOMER_REFUSED = 'CUSTOMER_REFUSED',

  /** Cliente não estava no local */
  CUSTOMER_UNAVAILABLE = 'CUSTOMER_UNAVAILABLE',

  /** Problemas com o produto (danificado, errado) */
  PRODUCT_ISSUE = 'PRODUCT_ISSUE',

  /** Documentação necessária não apresentada */
  MISSING_DOCUMENTATION = 'MISSING_DOCUMENTATION',

  /** Valor da entrega não pago */
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',

  /** Problemas com o veículo */
  VEHICLE_BREAKDOWN = 'VEHICLE_BREAKDOWN',

  /** Condições climáticas adversas */
  BAD_WEATHER = 'BAD_WEATHER',

  /** Trânsito intenso ou bloqueios */
  TRAFFIC_ISSUES = 'TRAFFIC_ISSUES',

  /** Problemas de acesso ao local */
  ACCESS_DENIED = 'ACCESS_DENIED',

  /** Horário de atendimento encerrado */
  BUSINESS_CLOSED = 'BUSINESS_CLOSED',

  /** Cliente solicitou reagendamento */
  CUSTOMER_REQUESTED_RESCHEDULE = 'CUSTOMER_REQUESTED_RESCHEDULE',

  /** Outros motivos não especificados */
  OTHER = 'OTHER',
}

/**
 * Descrições detalhadas dos motivos para exibição em UI
 */
export const FailureReasonDescriptions: Record<FailureReason, string> = {
  [FailureReason.CUSTOMER_NOT_FOUND]: 'Cliente não encontrado',
  [FailureReason.WRONG_ADDRESS]: 'Endereço incorreto',
  [FailureReason.CUSTOMER_REFUSED]: 'Cliente recusou a entrega',
  [FailureReason.CUSTOMER_UNAVAILABLE]: 'Cliente indisponível',
  [FailureReason.PRODUCT_ISSUE]: 'Problemas com o produto',
  [FailureReason.MISSING_DOCUMENTATION]: 'Documentação faltante',
  [FailureReason.PAYMENT_ISSUE]: 'Problemas com pagamento',
  [FailureReason.VEHICLE_BREAKDOWN]: 'Pane no veículo',
  [FailureReason.BAD_WEATHER]: 'Condições climáticas adversas',
  [FailureReason.TRAFFIC_ISSUES]: 'Problemas no trânsito',
  [FailureReason.ACCESS_DENIED]: 'Acesso negado ao local',
  [FailureReason.BUSINESS_CLOSED]: 'Estabelecimento fechado',
  [FailureReason.CUSTOMER_REQUESTED_RESCHEDULE]: 'Cliente solicitou reagendamento',
  [FailureReason.OTHER]: 'Outros motivos',
};

/**
 * Categorias de falha para agrupamento e análise
 */
export enum FailureCategory {
  /** Problemas relacionados ao cliente */
  CUSTOMER_RELATED = 'CUSTOMER_RELATED',

  /** Problemas relacionados ao endereço/local */
  LOCATION_RELATED = 'LOCATION_RELATED',

  /** Problemas relacionados ao produto */
  PRODUCT_RELATED = 'PRODUCT_RELATED',

  /** Problemas operacionais/logísticos */
  OPERATIONAL = 'OPERATIONAL',

  /** Problemas externos (clima, trânsito) */
  EXTERNAL = 'EXTERNAL',

  /** Outros */
  OTHER = 'OTHER',
}

/**
 * Mapeamento de motivos para categorias
 */
export const FailureReasonCategories: Record<FailureReason, FailureCategory> = {
  [FailureReason.CUSTOMER_NOT_FOUND]: FailureCategory.CUSTOMER_RELATED,
  [FailureReason.WRONG_ADDRESS]: FailureCategory.LOCATION_RELATED,
  [FailureReason.CUSTOMER_REFUSED]: FailureCategory.CUSTOMER_RELATED,
  [FailureReason.CUSTOMER_UNAVAILABLE]: FailureCategory.CUSTOMER_RELATED,
  [FailureReason.PRODUCT_ISSUE]: FailureCategory.PRODUCT_RELATED,
  [FailureReason.MISSING_DOCUMENTATION]: FailureCategory.CUSTOMER_RELATED,
  [FailureReason.PAYMENT_ISSUE]: FailureCategory.CUSTOMER_RELATED,
  [FailureReason.VEHICLE_BREAKDOWN]: FailureCategory.OPERATIONAL,
  [FailureReason.BAD_WEATHER]: FailureCategory.EXTERNAL,
  [FailureReason.TRAFFIC_ISSUES]: FailureCategory.EXTERNAL,
  [FailureReason.ACCESS_DENIED]: FailureCategory.LOCATION_RELATED,
  [FailureReason.BUSINESS_CLOSED]: FailureCategory.LOCATION_RELATED,
  [FailureReason.CUSTOMER_REQUESTED_RESCHEDULE]: FailureCategory.CUSTOMER_RELATED,
  [FailureReason.OTHER]: FailureCategory.OTHER,
};

/**
 * Motivos que permitem nova tentativa automaticamente
 */
export const RetryableFailureReasons = [
  FailureReason.CUSTOMER_UNAVAILABLE,
  FailureReason.BUSINESS_CLOSED,
  FailureReason.BAD_WEATHER,
  FailureReason.TRAFFIC_ISSUES,
  FailureReason.ACCESS_DENIED,
];

/**
 * Motivos que exigem intervenção manual antes de retry
 */
export const ManualInterventionFailureReasons = [
  FailureReason.WRONG_ADDRESS,
  FailureReason.PRODUCT_ISSUE,
  FailureReason.MISSING_DOCUMENTATION,
  FailureReason.PAYMENT_ISSUE,
  FailureReason.VEHICLE_BREAKDOWN,
];
