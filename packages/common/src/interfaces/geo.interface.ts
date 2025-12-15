/**
 * Geo Interfaces
 *
 * Interfaces relacionadas a geolocalização e coordenadas.
 *
 * @module Common/Interfaces
 */

/**
 * Interface para ponto geográfico com coordenadas
 */
export interface GeoPoint {
  /** Latitude (entre -90 e 90) */
  latitude: number;
  /** Longitude (entre -180 e 180) */
  longitude: number;
  /** Sequência/ordem do ponto (opcional) */
  sequence?: number;
  /** ID da entidade associada ao ponto (opcional) */
  entity_id?: string;
  /** Horário de início da janela de tempo (opcional) */
  time_window_start?: string;
  /** Horário de fim da janela de tempo (opcional) */
  time_window_end?: string;
  /** Prioridade do ponto (opcional) */
  priority?: number;
}

/**
 * Interface para coordenadas simples
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Interface para bounds/limites geográficos
 */
export interface GeoBounds {
  /** Coordenada do canto sudoeste */
  southwest: Coordinates;
  /** Coordenada do canto nordeste */
  northeast: Coordinates;
}

/**
 * Interface para área circular
 */
export interface GeoCircle {
  /** Centro do círculo */
  center: Coordinates;
  /** Raio em metros */
  radius: number;
}

/**
 * Interface para polígono geográfico
 */
export interface GeoPolygon {
  /** Lista de coordenadas que formam o polígono */
  coordinates: Coordinates[];
}
