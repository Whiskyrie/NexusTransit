import { normalizeCEP } from '../validators/address.validator';
import type { BrazilianAddress, Coordinates } from '../interfaces/address.interface';

/**
 * Utilitários para manipulação e validação de endereços
 *
 * Fornece métodos para:
 * - Normalização de endereços
 * - Cálculo de distância entre pontos
 * - Formatação de endereços
 * - Validação de CEP
 *
 * @class AddressUtils
 */
export class AddressUtils {
  /**
   * Raio da Terra em quilômetros (usado no cálculo Haversine)
   */
  private static readonly EARTH_RADIUS_KM = 6371;

  /**
   * Normaliza um endereço brasileiro
   *
   * - Remove espaços extras
   * - Converte UF para maiúsculas
   * - Formata CEP
   * - Capitaliza cidade
   *
   * @param address - Endereço a ser normalizado
   * @returns Endereço normalizado
   *
   * @example
   * ```typescript
   * const normalized = AddressUtils.normalizeAddress({
   *   street: "  rua das flores  ",
   *   number: "123",
   *   city: "são paulo",
   *   state: "sp",
   *   postal_code: "01310100"
   * });
   * // Retorna endereço com formatação correta
   * ```
   */
  static normalizeAddress(address: BrazilianAddress): BrazilianAddress {
    const normalized: BrazilianAddress = {
      street: address.street.trim(),
      number: address.number.trim(),
      neighborhood: address.neighborhood.trim(),
      city: this.capitalizeCity(address.city.trim()),
      state: address.state.toUpperCase().trim(),
      postal_code: normalizeCEP(address.postal_code),
    };

    if (address.complement) {
      normalized.complement = address.complement.trim();
    }

    return normalized;
  }

  /**
   * Calcula a distância entre dois pontos usando a fórmula de Haversine
   *
   * A fórmula de Haversine calcula a distância de grande círculo entre
   * dois pontos na superfície de uma esfera usando suas latitudes e longitudes
   *
   * @param from - Coordenadas de origem
   * @param to - Coordenadas de destino
   * @returns Distância em quilômetros
   *
   * @example
   * ```typescript
   * const distance = AddressUtils.calculateDistance(
   *   { latitude: -23.5505, longitude: -46.6333 }, // São Paulo
   *   { latitude: -22.9068, longitude: -43.1729 }  // Rio de Janeiro
   * );
   * // Retorna aproximadamente 358 km
   * ```
   */
  static calculateDistance(from: Coordinates, to: Coordinates): number {
    const lat1Rad = this.toRadians(from.latitude);
    const lat2Rad = this.toRadians(to.latitude);
    const deltaLatRad = this.toRadians(to.latitude - from.latitude);
    const deltaLonRad = this.toRadians(to.longitude - from.longitude);

    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = this.EARTH_RADIUS_KM * c;

    return Math.round(distance * 100) / 100; // Arredonda para 2 casas decimais
  }

  /**
   * Formata um endereço para exibição
   *
   * @param address - Endereço a ser formatado
   * @returns String formatada do endereço
   *
   * @example
   * ```typescript
   * const formatted = AddressUtils.formatAddress(address);
   * // Retorna: "Rua das Flores, 123 - Centro, São Paulo - SP, 01310-100"
   * ```
   */
  static formatAddress(address: BrazilianAddress): string {
    const parts: string[] = [];

    // Rua e número
    parts.push(`${address.street}, ${address.number}`);

    // Complemento (se existir)
    if (address.complement) {
      parts[0] += ` ${address.complement}`;
    }

    // Bairro
    if (address.neighborhood) {
      parts.push(address.neighborhood);
    }

    // Cidade e estado
    parts.push(`${address.city} - ${address.state}`);

    // CEP
    parts.push(address.postal_code);

    return parts.join(', ');
  }

  /**
   * Valida CEP brasileiro
   *
   * @param postalCode - CEP a ser validado
   * @returns true se válido
   */
  static validatePostalCode(cep: string): boolean {
    const cepRegex = /^\d{5}-?\d{3}$/;
    return cepRegex.test(cep);
  }

  /**
   * Extrai apenas os números do CEP
   *
   * @param cep - CEP a ser processado
   * @returns Apenas números do CEP
   */
  static extractPostalCodeNumbers(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  /**
   * Compara dois endereços
   *
   * @param address1 - Primeiro endereço
   * @param address2 - Segundo endereço
   * @returns true se os endereços são iguais
   */
  static compareAddresses(address1: BrazilianAddress, address2: BrazilianAddress): boolean {
    const norm1 = this.normalizeAddress(address1);
    const norm2 = this.normalizeAddress(address2);

    return (
      norm1.postal_code === norm2.postal_code &&
      norm1.number === norm2.number &&
      norm1.street.toLowerCase() === norm2.street.toLowerCase()
    );
  }

  /**
   * Verifica se um endereço está completo
   *
   * @param address - Endereço a ser verificado
   * @returns true se todos os campos obrigatórios estão preenchidos
   */
  static isAddressComplete(address: Partial<BrazilianAddress>): boolean {
    return !!(
      address.street &&
      address.number &&
      address.neighborhood &&
      address.city &&
      address.state &&
      address.postal_code
    );
  }

  /**
   * Converte graus para radianos
   *
   * @param degrees - Graus
   * @returns Radianos
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Capitaliza nome de cidade (primeira letra maiúscula)
   *
   * @param city - Nome da cidade
   * @returns Nome capitalizado
   */
  private static capitalizeCity(city: string): string {
    return city
      .split(' ')
      .map(word => {
        if (word.length <= 2) {
          // Mantém preposições em minúsculo (de, da, do)
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
}
