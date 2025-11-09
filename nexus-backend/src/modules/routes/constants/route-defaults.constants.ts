/**
 * Route Default Values Constants
 *
 * Constantes para valores padrão usados em todo o módulo Routes
 *
 * @module Routes/Constants
 */

/**
 * Valores padrão para paginação
 *
 * @constant
 */
export const ROUTE_PAGINATION_DEFAULTS = {
  /** Página padrão para consultas paginadas */
  DEFAULT_PAGE: 1,

  /** Limite padrão de itens por página */
  DEFAULT_LIMIT: 10,

  /** Limite máximo de itens por página */
  MAX_LIMIT: 100,
} as const;

/**
 * Valores padrão para datas
 *
 * @constant
 */
export const ROUTE_DATE_DEFAULTS = {
  /** Data mínima para filtros (início do século XX) */
  MIN_DATE: '1900-01-01',

  /** Data máxima para filtros (fim do século XXI) */
  MAX_DATE: '2100-12-31',
} as const;

/**
 * Valores padrão para validação
 *
 * @constant
 */
export const ROUTE_VALIDATION_DEFAULTS = {
  /** Número mínimo de paradas em uma rota */
  MIN_STOPS: 1,

  /** Número máximo de alterações permitidas por edição */
  MAX_CHANGES_PER_UPDATE: 10,

  /** Tempo mínimo entre atualizações (minutos) */
  MIN_UPDATE_INTERVAL_MINUTES: 5,
} as const;

/**
 * Tipo derivado dos padrões de paginação
 */
export type RoutePaginationDefaultsType = typeof ROUTE_PAGINATION_DEFAULTS;

/**
 * Tipo derivado dos padrões de data
 */
export type RouteDateDefaultsType = typeof ROUTE_DATE_DEFAULTS;

/**
 * Tipo derivado dos padrões de validação
 */
export type RouteValidationDefaultsType = typeof ROUTE_VALIDATION_DEFAULTS;
