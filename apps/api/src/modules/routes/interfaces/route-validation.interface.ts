/**
 * Route Validation Interfaces
 *
 * Interfaces relacionadas à validação de rotas.
 *
 * @module Routes/Interfaces
 */

/**
 * Interface para dados de rota recebidos no body da requisição
 *
 * Utilizada para type-safe access aos campos de validação
 */
export interface RouteRequestBody {
  /**
   * Distância total da rota em quilômetros
   */
  total_distance?: unknown;

  /**
   * Carga total em quilogramas
   */
  total_load_kg?: unknown;

  /**
   * Volume total em metros cúbicos
   */
  total_volume_m3?: unknown;

  /**
   * Data planejada para execução da rota
   */
  planned_date?: unknown;

  /**
   * Campos adicionais da requisição
   */
  [key: string]: unknown;
}
