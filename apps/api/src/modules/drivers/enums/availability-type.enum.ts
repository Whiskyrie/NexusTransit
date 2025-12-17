/**
 * Availability Type Enum
 * Tipos de disponibilidade/ausência do motorista
 */
export enum AvailabilityType {
  /**
   * Motorista disponível para atribuição
   */
  AVAILABLE = 'AVAILABLE',

  /**
   * Férias
   */
  VACATION = 'VACATION',

  /**
   * Licença médica/atestado
   */
  SICK_LEAVE = 'SICK_LEAVE',

  /**
   * Suspenso
   */
  SUSPENDED = 'SUSPENDED',

  /**
   * Em treinamento
   */
  TRAINING = 'TRAINING',

  /**
   * Outro motivo de indisponibilidade
   */
  OTHER = 'OTHER',
}

/**
 * Utilitário para validar tipo de disponibilidade
 */
export function isValidAvailabilityType(type: string): type is AvailabilityType {
  return Object.values(AvailabilityType).includes(type as AvailabilityType);
}

/**
 * Utilitário para obter tipos de disponibilidade
 */
export function getAvailabilityTypes(): AvailabilityType[] {
  return Object.values(AvailabilityType);
}

/**
 * Utilitário para traduzir tipo de disponibilidade
 */
export function translateAvailabilityType(type: AvailabilityType): string {
  const translations: Record<AvailabilityType, string> = {
    [AvailabilityType.AVAILABLE]: 'Disponível',
    [AvailabilityType.VACATION]: 'Férias',
    [AvailabilityType.SICK_LEAVE]: 'Licença Médica',
    [AvailabilityType.SUSPENDED]: 'Suspenso',
    [AvailabilityType.TRAINING]: 'Treinamento',
    [AvailabilityType.OTHER]: 'Outro',
  };
  return translations[type] || type;
}

/**
 * Verifica se o tipo indica indisponibilidade
 */
export function isUnavailable(type: AvailabilityType): boolean {
  return type !== AvailabilityType.AVAILABLE;
}
