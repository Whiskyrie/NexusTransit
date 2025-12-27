/**
 * Tipo de ordem de serviço
 *
 * Define a natureza da operação logística a ser executada
 */
export enum OrderType {
  /**
   * Coleta e entrega completa
   * Inclui retirada no endereço de origem e entrega no destino
   */
  PICKUP_DELIVERY = 'PICKUP_DELIVERY',

  /**
   * Apenas entrega
   * O cliente já entregou a carga e precisa apenas da entrega no destino
   */
  DELIVERY_ONLY = 'DELIVERY_ONLY',

  /**
   * Retorno de mercadoria
   * Devolução de produtos do cliente de volta ao remetente
   */
  RETURN = 'RETURN',

  /**
   * Transferência interna
   * Movimentação de carga entre depósitos ou filiais da empresa
   */
  TRANSFER = 'TRANSFER',
}

/**
 * Descrições dos tipos de ordem
 */
export const OrderTypeDescriptions: Record<OrderType, string> = {
  [OrderType.PICKUP_DELIVERY]: 'Coleta e Entrega',
  [OrderType.DELIVERY_ONLY]: 'Apenas Entrega',
  [OrderType.RETURN]: 'Retorno de Mercadoria',
  [OrderType.TRANSFER]: 'Transferência Interna',
};

/**
 * Valida se um tipo de ordem é válido
 */
export function isValidOrderType(type: string): type is OrderType {
  return Object.values(OrderType).includes(type as OrderType);
}

/**
 * Obtém todos os tipos de ordem disponíveis
 */
export function getAvailableOrderTypes(): OrderType[] {
  return Object.values(OrderType);
}

/**
 * Traduz o tipo de ordem para português
 */
export function translateOrderType(type: OrderType): string {
  return OrderTypeDescriptions[type] || type;
}
