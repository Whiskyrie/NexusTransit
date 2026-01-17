import { api } from "./api";
import type { AddressResponse, SearchCepRequest } from "../types/address.types";

/**
 * Serviço para operações relacionadas a endereços e CEP
 */
class AddressService {
  /**
   * Busca endereço por CEP usando a API interna
   *
   * Utiliza sistema de fallback automático:
   * - ViaCEP (prioridade 1)
   * - BrasilAPI (fallback 1)
   * - AwesomeAPI (fallback 2)
   *
   * @param cep - CEP para buscar (pode estar formatado ou não)
   * @returns Dados do endereço encontrado
   * @throws Error se CEP não for encontrado ou API estiver indisponível
   */
  async searchByCep(cep: string): Promise<AddressResponse> {
    const payload: SearchCepRequest = { cep };
    const response = await api.post<AddressResponse>("/addresses/search-cep", payload);
    return response.data;
  }
}

export const addressService = new AddressService();
