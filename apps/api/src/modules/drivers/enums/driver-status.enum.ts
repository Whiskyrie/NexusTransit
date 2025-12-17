/**
 * Driver Status Enum
 * Status possíveis para um motorista
 */
export enum DriverStatus {
  /**
   * Disponível para atribuição
   */
  ACTIVE = 'ACTIVE',

  /**
   * Inativo (não disponível para trabalho)
   */
  INACTIVE = 'INACTIVE',

  /**
   * Suspenso temporariamente
   */
  SUSPENDED = 'SUSPENDED',

  /**
   * Em férias
   */
  ON_LEAVE = 'ON_LEAVE',

  /**
   * Status legado - disponível (mantido para compatibilidade)
   */
  AVAILABLE = 'available',

  /**
   * Status legado - em rota (mantido para compatibilidade)
   */
  ON_ROUTE = 'on_route',

  /**
   * Status legado - indisponível (mantido para compatibilidade)
   */
  UNAVAILABLE = 'unavailable',

  /**
   * Status legado - bloqueado (mantido para compatibilidade)
   */
  BLOCKED = 'blocked',

  /**
   * Status legado - férias (mantido para compatibilidade)
   */
  VACATION = 'vacation',
}

/**
 * Utilitário para validar status
 */
export function isValidDriverStatus(status: string): status is DriverStatus {
  return Object.values(DriverStatus).includes(status as DriverStatus);
}

/**
 * Utilitário para obter status disponíveis
 */
export function getAvailableStatuses(): DriverStatus[] {
  return Object.values(DriverStatus);
}

/**
 * Utilitário para traduzir status
 */
export function translateDriverStatus(status: DriverStatus): string {
  const translations: Record<DriverStatus, string> = {
    [DriverStatus.ACTIVE]: 'Ativo',
    [DriverStatus.INACTIVE]: 'Inativo',
    [DriverStatus.SUSPENDED]: 'Suspenso',
    [DriverStatus.ON_LEAVE]: 'Em Afastamento',
    [DriverStatus.AVAILABLE]: 'Disponível',
    [DriverStatus.ON_ROUTE]: 'Em Rota',
    [DriverStatus.UNAVAILABLE]: 'Indisponível',
    [DriverStatus.BLOCKED]: 'Bloqueado',
    [DriverStatus.VACATION]: 'Férias',
  };
  return translations[status] || status;
}

/**
 * Verifica se o motorista está disponível para trabalho
 */
export function isAvailableForWork(status: DriverStatus): boolean {
  return [DriverStatus.ACTIVE, DriverStatus.AVAILABLE].includes(status);
}

/**
 * Verifica se o status indica indisponibilidade
 */
export function isUnavailableStatus(status: DriverStatus): boolean {
  return [
    DriverStatus.INACTIVE,
    DriverStatus.SUSPENDED,
    DriverStatus.ON_LEAVE,
    DriverStatus.UNAVAILABLE,
    DriverStatus.BLOCKED,
    DriverStatus.VACATION,
  ].includes(status);
}
