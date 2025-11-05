/**
 * Route Validation Constants
 *
 * Constantes para validação de regras de negócio de rotas.
 *
 * @module Routes/Constants
 */

/**
 * Limites de validação para rotas
 *
 * Define valores máximos e mínimos para diferentes aspectos de uma rota:
 * - Paradas: Quantidade máxima de paradas em uma rota
 * - Distância: Limites mínimo e máximo em quilômetros
 * - Carga: Peso máximo em quilogramas
 * - Volume: Volume máximo em metros cúbicos
 *
 * @constant
 */
export const ROUTE_VALIDATION_LIMITS = {
  /**
   * Número máximo de paradas permitidas em uma rota
   * @default 50
   */
  MAX_STOPS: 50,

  /**
   * Distância máxima permitida em quilômetros
   * @default 1000
   */
  MAX_DISTANCE_KM: 1000,

  /**
   * Distância mínima permitida em quilômetros
   * @default 0.1
   */
  MIN_DISTANCE_KM: 0.1,

  /**
   * Peso máximo de carga em quilogramas
   * @default 30000
   */
  MAX_LOAD_KG: 30000,

  /**
   * Volume máximo em metros cúbicos
   * @default 100
   */
  MAX_VOLUME_M3: 100,
} as const;

/**
 * Tipo derivado dos limites de validação para uso em funções
 */
export type RouteValidationLimitsType = typeof ROUTE_VALIDATION_LIMITS;
