/**
 * Tipos relacionados a endereços e CEP
 */

export interface AddressResponse {
  id: string;
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
  ibge_code?: string;
  ddd?: string;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  country: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SearchCepRequest {
  cep: string;
}

export interface CepValidationResult {
  isValid: boolean;
  formatted: string;
  error?: string;
}
