/**
 * Employment Type Enum
 * Tipos de vínculo empregatício do motorista
 */
export enum EmploymentType {
  /**
   * Contratado pelo regime CLT (Consolidação das Leis do Trabalho)
   */
  CLT = 'CLT',

  /**
   * Pessoa Jurídica (Prestador de serviço)
   */
  PJ = 'PJ',

  /**
   * Contrato temporário
   */
  TEMPORARY = 'TEMPORARY',

  /**
   * Terceirizado (outsourced)
   */
  OUTSOURCED = 'OUTSOURCED',
}

/**
 * Utilitário para validar tipo de emprego
 */
export function isValidEmploymentType(type: string): type is EmploymentType {
  return Object.values(EmploymentType).includes(type as EmploymentType);
}

/**
 * Utilitário para obter tipos de emprego disponíveis
 */
export function getAvailableEmploymentTypes(): EmploymentType[] {
  return Object.values(EmploymentType);
}

/**
 * Utilitário para traduzir tipo de emprego
 */
export function translateEmploymentType(type: EmploymentType): string {
  const translations: Record<EmploymentType, string> = {
    [EmploymentType.CLT]: 'CLT',
    [EmploymentType.PJ]: 'Pessoa Jurídica',
    [EmploymentType.TEMPORARY]: 'Temporário',
    [EmploymentType.OUTSOURCED]: 'Terceirizado',
  };
  return translations[type] || type;
}
