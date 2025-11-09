/**
 * Route Calculation Constants
 *
 * Constantes para cálculos de métricas de rotas baseadas no tipo.
 *
 * @module Routes/Constants
 */

import { RouteType } from '../enums/route.type';

/**
 * Características dos tipos de rota para cálculos
 *
 * Define parâmetros específicos para cada tipo de rota:
 * - Velocidade média em km/h
 * - Fator de atraso (percentual adicional sobre o tempo estimado)
 * - Custo por quilômetro rodado
 *
 * @constant
 */
export const ROUTE_TYPE_CHARACTERISTICS: Record<
  RouteType,
  {
    /** Velocidade média em km/h para este tipo de rota */
    avgSpeed: number;

    /** Fator de atraso multiplicativo (1.0 = sem atraso, 1.15 = 15% de atraso) */
    delayFactor: number;

    /** Custo base por quilômetro rodado */
    costPerKm: number;

    /** Tempo médio de parada em minutos */
    avgStopDurationMinutes: number;

    /** Consumo médio de combustível (km/l) */
    avgFuelConsumption: number;
  }
> = {
  [RouteType.URBAN]: {
    avgSpeed: 40,
    delayFactor: 0.3,
    costPerKm: 2.5,
    avgStopDurationMinutes: 15,
    avgFuelConsumption: 8,
  },
  [RouteType.INTERSTATE]: {
    avgSpeed: 90,
    delayFactor: 0.1,
    costPerKm: 1.8,
    avgStopDurationMinutes: 10,
    avgFuelConsumption: 12,
  },
  [RouteType.RURAL]: {
    avgSpeed: 60,
    delayFactor: 0.4,
    costPerKm: 2.2,
    avgStopDurationMinutes: 20,
    avgFuelConsumption: 9,
  },
  [RouteType.EXPRESS]: {
    avgSpeed: 100,
    delayFactor: 0.05,
    costPerKm: 1.6,
    avgStopDurationMinutes: 8,
    avgFuelConsumption: 14,
  },
  [RouteType.LOCAL]: {
    avgSpeed: 35,
    delayFactor: 0.2,
    costPerKm: 2.8,
    avgStopDurationMinutes: 12,
    avgFuelConsumption: 7,
  },
} as const;

/**
 * Constantes de cálculo padrão
 *
 * Valores padrão usados quando não há tipo específico definido
 * ou para cálculos genéricos de rotas
 *
 * @constant
 */
export const ROUTE_CALCULATION_DEFAULTS = {
  /** Velocidade média padrão em km/h */
  DEFAULT_AVG_SPEED_KM_H: 60,

  /** Fator de atraso padrão (15% de tempo adicional) */
  DEFAULT_DELAY_FACTOR: 0.15,

  /** Custo padrão por quilômetro */
  DEFAULT_COST_PER_KM: 2.0,

  /** Duração padrão de parada em minutos */
  DEFAULT_STOP_DURATION_MINUTES: 12,

  /** Consumo padrão de combustível (km/l) */
  DEFAULT_FUEL_CONSUMPTION: 10,

  /** Tempo mínimo de descanso entre paradas (minutos) */
  MIN_REST_TIME_MINUTES: 15,

  /** Tempo máximo de condução contínua (minutos) */
  MAX_DRIVING_TIME_MINUTES: 240,

  /** Fator de eficiência de rota (otimização) */
  ROUTE_EFFICIENCY_FACTOR: 0.9,
} as const;

/**
 * Limites de tolerância para cálculos
 *
 * Define margens de erro aceitáveis e limites máximos
 * para validação de resultados de cálculos
 *
 * @constant
 */
export const ROUTE_CALCULATION_TOLERANCES = {
  /** Margem de erro aceitável para cálculo de distância (%) */
  DISTANCE_TOLERANCE_PERCENT: 5,

  /** Margem de erro aceitável para cálculo de tempo (%) */
  TIME_TOLERANCE_PERCENT: 10,

  /** Distância máxima permitida em uma rota (km) */
  MAX_CALCULATED_DISTANCE_KM: 2000,

  /** Duração máxima permitida em uma rota (horas) */
  MAX_CALCULATED_DURATION_HOURS: 24,

  /** Velocidade máxima considerada para cálculos (km/h) */
  MAX_CALCULATION_SPEED_KM_H: 120,

  /** Velocidade mínima considerada para cálculos (km/h) */
  MIN_CALCULATION_SPEED_KM_H: 10,
} as const;

/**
 * Tipo derivado das características de tipo de rota
 */
export type RouteTypeCharacteristicsType = typeof ROUTE_TYPE_CHARACTERISTICS;

/**
 * Tipo derivado dos padrões de cálculo
 */
export type RouteCalculationDefaultsType = typeof ROUTE_CALCULATION_DEFAULTS;

/**
 * Tipo derivado das tolerâncias de cálculo
 */
export type RouteCalculationTolerancesType = typeof ROUTE_CALCULATION_TOLERANCES;
