/**
 * Método de pagamento da ordem de serviço
 *
 * Define a forma como o pagamento será processado
 */
export enum PaymentMethod {
  /**
   * Pagamento em dinheiro
   * Pagamento realizado em espécie no momento da entrega ou coleta
   */
  CASH = 'CASH',

  /**
   * Cartão de crédito
   * Pagamento processado via cartão de crédito (débito automático ou parcelado)
   */
  CREDIT_CARD = 'CREDIT_CARD',

  /**
   * Transferência bancária
   * Pagamento realizado via PIX, TED ou DOC para conta bancária
   */
  BANK_TRANSFER = 'BANK_TRANSFER',

  /**
   * Nota fiscal/Boleto
   * Pagamento via boleto bancário ou faturamento mensal para clientes corporativos
   */
  INVOICE = 'INVOICE',
}

/**
 * Descrições dos métodos de pagamento
 */
export const PaymentMethodDescriptions: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Dinheiro',
  [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
  [PaymentMethod.BANK_TRANSFER]: 'Transferência Bancária',
  [PaymentMethod.INVOICE]: 'Nota Fiscal/Boleto',
};

/**
 * Ícones para representação visual
 */
export const PaymentMethodIcons: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: '💵',
  [PaymentMethod.CREDIT_CARD]: '💳',
  [PaymentMethod.BANK_TRANSFER]: '🏦',
  [PaymentMethod.INVOICE]: '📄',
};

/**
 * Valida se um método de pagamento é válido
 */
export function isValidPaymentMethod(method: string): method is PaymentMethod {
  return Object.values(PaymentMethod).includes(method as PaymentMethod);
}

/**
 * Obtém todos os métodos de pagamento disponíveis
 */
export function getAvailablePaymentMethods(): PaymentMethod[] {
  return Object.values(PaymentMethod);
}

/**
 * Traduz o método de pagamento para português
 */
export function translatePaymentMethod(method: PaymentMethod): string {
  return PaymentMethodDescriptions[method] || method;
}

/**
 * Obtém o ícone do método de pagamento
 */
export function getPaymentMethodIcon(method: PaymentMethod): string {
  return PaymentMethodIcons[method] || '💰';
}

/**
 * Verifica se o método de pagamento requer processamento externo
 */
export function requiresExternalProcessing(method: PaymentMethod): boolean {
  return [PaymentMethod.CREDIT_CARD, PaymentMethod.BANK_TRANSFER, PaymentMethod.INVOICE].includes(
    method,
  );
}

/**
 * Verifica se o método de pagamento permite parcelamento
 */
export function allowsInstallments(method: PaymentMethod): boolean {
  return method === PaymentMethod.CREDIT_CARD || method === PaymentMethod.INVOICE;
}
