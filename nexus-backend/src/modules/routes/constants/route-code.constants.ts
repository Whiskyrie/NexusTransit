/**
 * Route Code Constants
 *
 * Constantes relacionadas a códigos e identificadores de rotas.
 *
 * @module Routes/Constants
 */

import { RouteType } from '../enums/route.type';
import { RouteStatus } from '../enums/route-status';

/**
 * Constantes de código e prefixos
 *
 * Define padrões para geração e validação de códigos de rota
 *
 * @constant
 */
export const ROUTE_CODE_CONSTANTS = {
  /** Prefixo padrão para códigos de rota */
  ROUTE_CODE_PREFIX: 'RT',

  /** Formato do código de rota: PREFIXO-YYYYMMDD-NNN */
  ROUTE_CODE_FORMAT: 'RT-YYYYMMDD-NNN',

  /** Separador usado no código de rota */
  ROUTE_CODE_SEPARATOR: '-',

  /** Número mínimo de dígitos para o sequencial */
  ROUTE_CODE_SEQUENTIAL_MIN_DIGITS: 3,

  /** Tamanho máximo do código de rota */
  ROUTE_CODE_MAX_LENGTH: 20,
} as const;

/**
 * Constantes de valores padrão
 *
 * Define valores padrão para criação e configuração de rotas
 *
 * @constant
 */
export const ROUTE_DEFAULT_VALUES = {
  /** Tipo de rota padrão */
  DEFAULT_ROUTE_TYPE: RouteType.URBAN,

  /** Status inicial padrão para novas rotas */
  DEFAULT_ROUTE_STATUS: RouteStatus.PLANNED,

  /** Nível de dificuldade padrão (1-5) */
  DEFAULT_DIFFICULTY_LEVEL: 2,

  /** Fator de eficiência padrão para otimização */
  DEFAULT_EFFICIENCY_FACTOR: 0.9,

  /** Porcentagem padrão de tolerância de atraso */
  DEFAULT_DELAY_TOLERANCE_PERCENT: 15,

  /** Número padrão de paradas para estimativas */
  DEFAULT_STOP_COUNT: 5,
} as const;

/**
 * Constantes de sequenciamento
 *
 * Define regras para ordenação e sequenciamento de paradas
 *
 * @constant
 */
export const ROUTE_SEQUENCING_CONSTANTS = {
  /** Número mínimo de paradas em uma rota */
  MIN_STOPS: 1,

  /** Número máximo de paradas em uma rota */
  MAX_STOPS: 50,

  /** Intervalo mínimo entre paradas sequenciais */
  MIN_STOP_INTERVAL_MINUTES: 5,

  /** Intervalo máximo entre paradas sequenciais */
  MAX_STOP_INTERVAL_MINUTES: 480,

  /** Ordem inicial para primeira parada */
  INITIAL_SEQUENCE_ORDER: 1,

  /** Incremento padrão para próxima parada */
  SEQUENCE_ORDER_INCREMENT: 1,
} as const;

/**
 * Constantes de formatação e exibição
 *
 * Define padrões para exibição e formatação de dados de rota
 *
 * @constant
 */
export const ROUTE_FORMATTING_CONSTANTS = {
  /** Precisão de casas decimais para coordenadas */
  COORDINATE_PRECISION: 6,

  /** Precisão de casas decimais para distância */
  DISTANCE_PRECISION: 2,

  /** Precisão de casas decimais para duração */
  DURATION_PRECISION: 0,

  /** Formato de data padrão para exibição */
  DEFAULT_DATE_FORMAT: 'YYYY-MM-DD',

  /** Formato de hora padrão para exibição */
  DEFAULT_TIME_FORMAT: 'HH:mm',

  /** Formato de data e hora completo */
  DEFAULT_DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',

  /** Unidade de distância padrão */
  DEFAULT_DISTANCE_UNIT: 'km',

  /** Unidade de peso padrão */
  DEFAULT_WEIGHT_UNIT: 'kg',

  /** Unidade de volume padrão */
  DEFAULT_VOLUME_UNIT: 'm³',
} as const;

/**
 * Constantes de integração e APIs
 *
 * Define configurações para integrações externas e APIs
 *
 * @constant
 */
export const ROUTE_INTEGRATION_CONSTANTS = {
  /** Timeout padrão para requisições de geocoding (ms) */
  GEOCODING_TIMEOUT_MS: 5000,

  /** Número máximo de tentativas para geocoding */
  GEOCODING_MAX_RETRIES: 3,

  /** Timeout padrão para cálculo de rota (ms) */
  ROUTE_CALCULATION_TIMEOUT_MS: 10000,

  /** Número máximo de waypoints por requisição */
  MAX_WAYPOINTS_PER_REQUEST: 25,

  /** Intervalo de cache para coordenadas (minutos) */
  COORDINATES_CACHE_MINUTES: 1440, // 24 horas

  /** Intervalo de cache para cálculos de rota (minutos) */
  ROUTE_CACHE_MINUTES: 60,
} as const;

/**
 * Tipo derivado das constantes de código
 */
export type RouteCodeConstantsType = typeof ROUTE_CODE_CONSTANTS;

/**
 * Tipo derivado dos valores padrão
 */
export type RouteDefaultValuesType = typeof ROUTE_DEFAULT_VALUES;

/**
 * Tipo derivado das constantes de sequenciamento
 */
export type RouteSequencingConstantsType = typeof ROUTE_SEQUENCING_CONSTANTS;

/**
 * Tipo derivado das constantes de formatação
 */
export type RouteFormattingConstantsType = typeof ROUTE_FORMATTING_CONSTANTS;

/**
 * Tipo derivado das constantes de integração
 */

export type RouteIntegrationConstantsType = typeof ROUTE_INTEGRATION_CONSTANTS;
