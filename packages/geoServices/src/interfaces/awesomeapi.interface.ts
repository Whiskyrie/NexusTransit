import type { ViaCepAddress } from "./viacep.interface";

/**
 * Resposta da API AwesomeAPI
 * @see https://docs.awesomeapi.com.br/api-cep
 */
export interface AwesomeApiResponse {
  cep: string;
  address_type: string;
  address_name: string;
  address: string;
  state: string;
  district: string;
  lat: string;
  lng: string;
  city: string;
  city_ibge: string;
  ddd: string;
}

/**
 * Interface do serviço AwesomeAPI
 */
export interface AwesomeApiServiceInterface {
  getAddressByZipCode(zipCode: string): Promise<ViaCepAddress>;
  validateZipCode(zipCode: string): boolean;
}
