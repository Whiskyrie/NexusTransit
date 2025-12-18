/**
 * Interfaces para dados de rastreamento público
 */

/**
 * Interface para endereço simplificado
 */
export interface PublicAddress {
  /**
   * Endereço completo
   */
  address: string;

  /**
   * Cidade
   */
  city: string;

  /**
   * Estado (UF)
   */
  state: string;

  /**
   * CEP
   */
  postal_code: string;
}

/**
 * Interface para localização atual
 */
export interface CurrentLocation {
  /**
   * Latitude
   */
  latitude: number;

  /**
   * Longitude
   */
  longitude: number;

  /**
   * Endereço (opcional)
   */
  address?: string;

  /**
   * Data/hora do registro
   */
  timestamp: Date;
}

/**
 * Interface para ponto de localização
 */
export interface LocationPoint {
  /**
   * Latitude
   */
  latitude: number;

  /**
   * Longitude
   */
  longitude: number;

  /**
   * Endereço (opcional)
   */
  address?: string;
}

/**
 * Interface para ponto de rota
 */
export interface RoutePoint {
  /**
   * Latitude
   */
  latitude: number;

  /**
   * Longitude
   */
  longitude: number;

  /**
   * Data/hora do ponto
   */
  timestamp: Date;
}
