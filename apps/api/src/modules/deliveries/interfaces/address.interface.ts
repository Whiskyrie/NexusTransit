/**
 * Interface para endereço brasileiro completo
 */
/**
 * Interface para endereço brasileiro completo
 */
export interface BrazilianAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Interface para coordenadas geográficas
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}
