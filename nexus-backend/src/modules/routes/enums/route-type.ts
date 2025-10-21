/**
 * Tipo da rota
 * 
 * Classifica a natureza geográfica e operacional da rota
 */
export enum RouteType {
  /** Rota urbana - dentro de áreas metropolitanas */
  URBAN = 'URBAN',

  /** Rota interestadual - entre estados */
  INTERSTATE = 'INTERSTATE',

  /** Rota rural - áreas rurais e remotas */
  RURAL = 'RURAL',

  /** Rota expressa - prioridade e velocidade */
  EXPRESS = 'EXPRESS',

  /** Rota local - pequenas distâncias */
  LOCAL = 'LOCAL',
}

/**
 * Descrições dos tipos
 */
export const RouteTypeDescriptions: Record<RouteType, string> = {
  [RouteType.URBAN]: 'Urbana',
  [RouteType.INTERSTATE]: 'Interestadual',
  [RouteType.RURAL]: 'Rural',
  [RouteType.EXPRESS]: 'Expressa',
  [RouteType.LOCAL]: 'Local',
};

/**
 * Características operacionais por tipo
 */
export const RouteTypeCharacteristics: Record<RouteType, {
  maxSpeed: number;
  requiresSpecialVehicle: boolean;
  estimatedDelayFactor: number;
}> = {
  [RouteType.URBAN]: {
    maxSpeed: 60,
    requiresSpecialVehicle: false,
    estimatedDelayFactor: 1.3, // 30% de delay esperado
  },
  [RouteType.INTERSTATE]: {
    maxSpeed: 110,
    requiresSpecialVehicle: false,
    estimatedDelayFactor: 1.1,
  },
  [RouteType.RURAL]: {
    maxSpeed: 80,
    requiresSpecialVehicle: true,
    estimatedDelayFactor: 1.4,
  },
  [RouteType.EXPRESS]: {
    maxSpeed: 120,
    requiresSpecialVehicle: false,
    estimatedDelayFactor: 1.0,
  },
  [RouteType.LOCAL]: {
    maxSpeed: 50,
    requiresSpecialVehicle: false,
    estimatedDelayFactor: 1.2,
  },
};