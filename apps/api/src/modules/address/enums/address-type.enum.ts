/**
 * Tipo de endereço
 *
 * Representa os diferentes tipos de endereços que podem ser cadastrados
 */
export enum AddressType {
  /**
   * Endereço residencial
   */
  RESIDENTIAL = 'RESIDENTIAL',

  /**
   * Endereço comercial
   */
  COMMERCIAL = 'COMMERCIAL',

  /**
   * Endereço industrial
   */
  INDUSTRIAL = 'INDUSTRIAL',

  /**
   * Ponto de entrega
   */
  DELIVERY_POINT = 'DELIVERY_POINT',

  /**
   * Armazém/depósito
   */
  WAREHOUSE = 'WAREHOUSE',
}

/**
 * Utilitário para validar tipo de endereço
 */
export function isValidAddressType(type: string): type is AddressType {
  return Object.values(AddressType).includes(type as AddressType);
}

/**
 * Utilitário para obter tipos de endereço disponíveis
 */
export function getAvailableAddressTypes(): AddressType[] {
  return Object.values(AddressType);
}

/**
 * Utilitário para traduzir tipo de endereço
 */
export function translateAddressType(type: AddressType): string {
  const translations: Record<AddressType, string> = {
    [AddressType.RESIDENTIAL]: 'Residencial',
    [AddressType.COMMERCIAL]: 'Comercial',
    [AddressType.INDUSTRIAL]: 'Industrial',
    [AddressType.DELIVERY_POINT]: 'Ponto de Entrega',
    [AddressType.WAREHOUSE]: 'Armazém',
  };
  return translations[type] || type;
}
