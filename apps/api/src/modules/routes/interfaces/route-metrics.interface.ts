/**
 * Route Metrics Interface
 *
 * Interface para métricas calculadas de rotas.
 *
 * @module Routes/Interfaces
 */

/**
 * Métricas calculadas de uma rota
 *
 * Contém todos os valores computados relacionados a
 * distância, tempo, custo e eficiência da rota.
 */
export interface RouteMetrics {
  /**
   * Distância total em quilômetros
   */
  distance: number;

  /**
   * Duração estimada em minutos
   */
  duration: number;

  /**
   * Custo estimado em reais
   */
  estimatedCost: number;

  /**
   * Data/hora do cálculo
   */
  calculatedAt: Date;

  /**
   * Velocidade média em km/h
   */
  avgSpeed?: number;

  /**
   * Fator de atraso aplicado
   */
  delayFactor?: number;
}

/**
 * Coordenadas geográficas
 *
 * Representa um ponto no mapa com latitude e longitude
 */
export interface Coordinates {
  /**
   * Latitude (graus decimais)
   * Range: -90 a 90
   */
  latitude: number;

  /**
   * Longitude (graus decimais)
   * Range: -180 a 180
   */
  longitude: number;
}

/**
 * Características operacionais de um tipo de rota
 */
export interface RouteTypeCharacteristics {
  /**
   * Velocidade média em km/h
   */
  avgSpeed: number;

  /**
   * Fator de atraso (multiplicador)
   * Ex: 1.3 = 30% a mais de tempo
   */
  delayFactor: number;

  /**
   * Custo por quilômetro em reais
   */
  costPerKm: number;
}
