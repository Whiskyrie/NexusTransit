import { type AddressType, type CountryCode, type BrazilianState } from '../enums';

/**
 * Interface base para endereço
 */
export interface IAddress {
  id: string;
  cep?: string;
  street: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  ibge_code?: string;
  gia_code?: string;
  ddd?: string;
  siafi_code?: string;
  is_active: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

/**
 * Interface para criação de endereço
 */
export interface ICreateAddress {
  cep?: string;
  street: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
  notes?: string;
}

/**
 * Interface para atualização de endereço
 */
export interface IUpdateAddress {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
  notes?: string;
}

/**
 * Interface para filtros de endereço
 */
export interface IAddressFilters {
  cep?: string;
  city?: string;
  state?: string;
  country?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Interface para endereço com coordenadas
 */
export interface IAddressWithCoordinates extends IAddress {
  latitude: number;
  longitude: number;
}

/**
 * Interface para dados de CEP
 */
export interface ICepData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: BrazilianState;
  ibge_code?: string;
  gia_code?: string;
  ddd?: string;
  siafi_code?: string;
}

/**
 * Interface para validação de endereço
 */
export interface IAddressValidation {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  normalizedAddress?: IAddress;
}

/**
 * Interface para endereço completo
 */
export interface IFullAddress extends IAddress {
  type?: AddressType;
  country_code?: CountryCode;
  is_validated?: boolean;
  validated_at?: Date;
  geocoded_at?: Date;
}
