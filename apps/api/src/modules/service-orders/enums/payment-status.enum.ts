/**
 * Status de pagamento da ordem de serviço
 *
 * Define o estado atual do pagamento relacionado à ordem
 */
export enum PaymentStatus {
  /**
   * Pagamento pendente
   * A ordem foi criada mas o pagamento ainda não foi realizado
   */
  PENDING = 'PENDING',

  /**
   * Pagamento realizado
   * O pagamento foi confirmado e processado com sucesso
   */
  PAID = 'PAID',

  /**
   * Pagamento em atraso
   * O prazo de pagamento expirou sem confirmação
   */
  OVERDUE = 'OVERDUE',

  /**
   * Pagamento cancelado
   * O pagamento foi cancelado ou a ordem foi cancelada antes do pagamento
   */
  CANCELED = 'CANCELED',
}

/**
 * Descrições dos status de pagamento
 */
export const PaymentStatusDescriptions: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pendente',
  [PaymentStatus.PAID]: 'Pago',
  [PaymentStatus.OVERDUE]: 'Em Atraso',
  [PaymentStatus.CANCELED]: 'Cancelado',
};

/**
 * Status finais (que não permitem mais mudanças)
 */
export const FinalPaymentStatuses = [PaymentStatus.PAID, PaymentStatus.CANCELED];

/**
 * Transições válidas de status de pagamento
 */
export const PaymentStatusTransitions: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.OVERDUE, PaymentStatus.CANCELED],
  [PaymentStatus.OVERDUE]: [PaymentStatus.PAID, PaymentStatus.CANCELED],
  [PaymentStatus.PAID]: [], // Status final
  [PaymentStatus.CANCELED]: [], // Status final
};

/**
 * Valida se uma transição de status de pagamento é permitida
 */
export function isValidPaymentStatusTransition(
  currentStatus: PaymentStatus,
  newStatus: PaymentStatus,
): boolean {
  const allowedTransitions = PaymentStatusTransitions[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Valida se um status de pagamento é válido
 */
export function isValidPaymentStatus(status: string): status is PaymentStatus {
  return Object.values(PaymentStatus).includes(status as PaymentStatus);
}

/**
 * Obtém todos os status de pagamento disponíveis
 */
export function getAvailablePaymentStatuses(): PaymentStatus[] {
  return Object.values(PaymentStatus);
}

/**
 * Traduz o status de pagamento para português
 */
export function translatePaymentStatus(status: PaymentStatus): string {
  return PaymentStatusDescriptions[status] || status;
}

/**
 * Verifica se o status é final
 */
export function isFinalPaymentStatus(status: PaymentStatus): boolean {
  return FinalPaymentStatuses.includes(status);
}
