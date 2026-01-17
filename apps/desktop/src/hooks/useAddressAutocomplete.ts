import { useQuery } from "@tanstack/react-query";
import { addressService } from "../services/address.service";
import { validateCepFormat, cleanCep } from "../utils/cep.utils";
import type { AddressResponse } from "../types/address.types";

interface UseAddressAutocompleteOptions {
  /**
   * Se false, desabilita a query mesmo com CEP válido
   * Útil para modo de edição onde não queremos buscar automaticamente
   */
  enabled?: boolean;

  /**
   * Callback executado quando a busca é bem-sucedida
   */
  onSuccess?: (data: AddressResponse) => void;

  /**
   * Callback executado quando ocorre erro
   */
  onError?: (error: Error) => void;
}

/**
 * Hook para autocomplete de endereço baseado em CEP
 *
 * Características:
 * - Valida formato do CEP antes de fazer requisição
 * - Debounce automático para evitar requisições desnecessárias
 * - Cache automático via TanStack Query
 * - Estados de loading e error
 *
 * @param cep - CEP para buscar (pode estar formatado ou não)
 * @param options - Opções de configuração
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, isValidCep } = useAddressAutocomplete(cep, {
 *   enabled: true,
 *   onSuccess: (address) => {
 *     setFormData(prev => ({
 *       ...prev,
 *       street: address.street,
 *       city: address.city,
 *       state: address.state
 *     }))
 *   }
 * });
 * ```
 */
export function useAddressAutocomplete(cep: string, options: UseAddressAutocompleteOptions = {}) {
  const { enabled = true, onSuccess, onError } = options;

  const cleanedCep = cleanCep(cep);
  const isValidCep = validateCepFormat(cep);

  const query = useQuery({
    queryKey: ["address", "cep", cleanedCep],
    queryFn: () => addressService.searchByCep(cleanedCep),
    enabled: enabled && isValidCep,
    staleTime: 1000 * 60 * 60, // 1 hora - CEPs não mudam com frequência
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
    retry: 1, // Tentar apenas 1 vez em caso de erro
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Executar callbacks quando apropriado
  if (query.data && onSuccess) {
    onSuccess(query.data);
  }

  if (query.error && onError) {
    onError(query.error as Error);
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    isValidCep,
    isFetching: query.isFetching,
  };
}
