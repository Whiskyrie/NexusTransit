/**
 * Tipo de incidente
 */
export enum IncidentType {
  /** Acidente de trânsito */
  TRAFFIC_ACCIDENT = 'TRAFFIC_ACCIDENT',
  /** Quebra/panne do veículo */
  VEHICLE_BREAKDOWN = 'VEHICLE_BREAKDOWN',
  /** Atraso no trânsito */
  DELAYED_TRAFFIC = 'DELAYED_TRAFFIC',
  /** Cliente não encontrado */
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  /** Endereço incorreto */
  WRONG_ADDRESS = 'WRONG_ADDRESS',
  /** Entrega recusada */
  REFUSED_DELIVERY = 'REFUSED_DELIVERY',
  /** Furto/roubo */
  THEFT = 'THEFT',
  /** Dano à carga */
  DAMAGE = 'DAMAGE',
  /** Condições climáticas adversas */
  WEATHER = 'WEATHER',
  /** Outros tipos */
  OTHER = 'OTHER',
}

/**
 * Severidade do incidente
 */
export enum IncidentSeverity {
  /** Baixa severidade */
  LOW = 'LOW',
  /** Média severidade */
  MEDIUM = 'MEDIUM',
  /** Alta severidade */
  HIGH = 'HIGH',
  /** Severidade crítica */
  CRITICAL = 'CRITICAL',
}

/**
 * Status do incidente
 */
export enum IncidentStatus {
  /** Reportado */
  REPORTED = 'REPORTED',
  /** Em investigação */
  INVESTIGATING = 'INVESTIGATING',
  /** Em progresso */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Resolvido */
  RESOLVED = 'RESOLVED',
  /** Fechado */
  CLOSED = 'CLOSED',
  /** Escalado */
  ESCALATED = 'ESCALATED',
}

/**
 * Utilitários para enums de incidentes
 */
export function isValidIncidentType(type: string): type is IncidentType {
  return Object.values(IncidentType).includes(type as IncidentType);
}

export function isValidIncidentSeverity(severity: string): severity is IncidentSeverity {
  return Object.values(IncidentSeverity).includes(severity as IncidentSeverity);
}

export function isValidIncidentStatus(status: string): status is IncidentStatus {
  return Object.values(IncidentStatus).includes(status as IncidentStatus);
}

export function translateIncidentType(type: IncidentType): string {
  const translations: Record<IncidentType, string> = {
    [IncidentType.TRAFFIC_ACCIDENT]: 'Acidente de trânsito',
    [IncidentType.VEHICLE_BREAKDOWN]: 'Quebra do veículo',
    [IncidentType.DELAYED_TRAFFIC]: 'Atraso no trânsito',
    [IncidentType.CUSTOMER_NOT_FOUND]: 'Cliente não encontrado',
    [IncidentType.WRONG_ADDRESS]: 'Endereço incorreto',
    [IncidentType.REFUSED_DELIVERY]: 'Entrega recusada',
    [IncidentType.THEFT]: 'Furto/roubo',
    [IncidentType.DAMAGE]: 'Dano à carga',
    [IncidentType.WEATHER]: 'Condições climáticas',
    [IncidentType.OTHER]: 'Outro',
  };
  return translations[type] || type;
}

export function translateIncidentSeverity(severity: IncidentSeverity): string {
  const translations: Record<IncidentSeverity, string> = {
    [IncidentSeverity.LOW]: 'Baixa',
    [IncidentSeverity.MEDIUM]: 'Média',
    [IncidentSeverity.HIGH]: 'Alta',
    [IncidentSeverity.CRITICAL]: 'Crítica',
  };
  return translations[severity] || severity;
}

export function translateIncidentStatus(status: IncidentStatus): string {
  const translations: Record<IncidentStatus, string> = {
    [IncidentStatus.REPORTED]: 'Reportado',
    [IncidentStatus.INVESTIGATING]: 'Em investigação',
    [IncidentStatus.IN_PROGRESS]: 'Em progresso',
    [IncidentStatus.RESOLVED]: 'Resolvido',
    [IncidentStatus.CLOSED]: 'Fechado',
    [IncidentStatus.ESCALATED]: 'Escalado',
  };
  return translations[status] || status;
}
