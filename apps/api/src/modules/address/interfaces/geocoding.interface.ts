/**
 * Interface para requisição de geocoding
 */
export interface IGeocodingRequest {
  street: string;
  number?: string;
  neighborhood: string;
  city: string;
  state: string;
  country?: string;
  postal_code?: string;
}

/**
 * Interface para resposta de geocoding
 */
export interface IGeocodingResponse {
  latitude: number;
  longitude: number;
  formatted_address: string;
  accuracy?: string;
  provider?: string;
  cached?: boolean;
}

/**
 * Interface para requisição de reverse geocoding
 */
export interface IReverseGeocodingRequest {
  latitude: number;
  longitude: number;
}

/**
 * Interface para resposta de reverse geocoding
 */
export interface IReverseGeocodingResponse {
  street?: string;
  number?: string;
  neighborhood?: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  formatted_address: string;
  provider?: string;
  cached?: boolean;
}

/**
 * Interface para resultado de geocoding com detalhes
 */
export interface IGeocodingResult extends IGeocodingResponse {
  place_id?: string;
  types?: string[];
  viewport?: {
    northeast: {
      lat: number;
      lng: number;
    };
    southwest: {
      lat: number;
      lng: number;
    };
  };
}

/**
 * Interface para coordenadas geográficas
 */
export interface ICoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Interface para bounds geográficos
 */
export interface IGeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Interface para serviço de geocoding
 */
export interface IGeocodingService {
  geocode(address: IGeocodingRequest): Promise<IGeocodingResponse>;
  reverseGeocode(coordinates: IReverseGeocodingRequest): Promise<IReverseGeocodingResponse>;
  validateCoordinates(latitude: number, longitude: number): boolean;
}
