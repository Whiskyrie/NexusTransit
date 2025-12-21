import type { ViaCepAddress } from "./viacep.interface";

/**
 * Resposta da API BrasilAPI v2
 * @see https://brasilapi.com.br/docs#tag/CEP
 */
export interface BrasilApiResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
  location?: {
    type: string;
    coordinates: {
      longitude: string;
      latitude: string;
    };
  };
}

/**
 * Interface do serviço BrasilAPI
 */
export interface BrasilApiServiceInterface {
  getAddressByZipCode(zipCode: string): Promise<ViaCepAddress>;
  validateZipCode(zipCode: string): boolean;
}
