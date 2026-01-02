import { type BrazilianState, normalizeBrazilianState } from '../enums';

/**
 * Utilitários para formatação e normalização de endereços
 */
export class AddressFormatterUtil {
  /**
   * Formata um endereço completo em string
   *
   * @example
   * const formatted = AddressFormatterUtil.formatAddress({
   *   street: 'Praça da Sé',
   *   number: '123',
   *   neighborhood: 'Sé',
   *   city: 'São Paulo',
   *   state: 'SP'
   * });
   * ! Retorna: "Praça da Sé, 123, Sé, São Paulo, SP"
   */
  static formatAddress(address: {
    street: string;
    number?: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    country?: string;
  }): string {
    const parts: string[] = [];

    // Logradouro e número
    if (address.street) {
      parts.push(address.street);
    }

    if (address.number) {
      parts.push(address.number);
    }

    // Complemento
    if (address.complement) {
      parts.push(address.complement);
    }

    // Bairro
    if (address.neighborhood) {
      parts.push(address.neighborhood);
    }

    // Cidade e Estado
    if (address.city) {
      parts.push(address.city);
    }

    if (address.state) {
      parts.push(address.state);
    }

    // País (opcional)
    if (address.country && address.country !== 'Brasil' && address.country !== 'BR') {
      parts.push(address.country);
    }

    return parts.filter(Boolean).join(', ');
  }

  /**
   * Formata um endereço em formato curto (sem complemento)
   */
  static formatShortAddress(address: {
    street: string;
    number?: string;
    city: string;
    state: string;
  }): string {
    const parts: string[] = [];

    if (address.street) {
      parts.push(address.street);
    }

    if (address.number) {
      parts.push(address.number);
    }

    if (address.city) {
      parts.push(address.city);
    }

    if (address.state) {
      parts.push(address.state);
    }

    return parts.filter(Boolean).join(', ');
  }

  /**
   * Normaliza CEP removendo caracteres especiais
   *
   * @example
   * normalizeCep('01001-000') // Returns: '01001000'
   * normalizeCep('01001000') // Returns: '01001000'
   */
  static normalizeCep(cep: string): string {
    if (!cep || typeof cep !== 'string') {
      return '';
    }

    return cep.replace(/\D/g, '');
  }

  /**
   * Formata CEP no padrão brasileiro (00000-000)
   *
   * @example
   * formatCep('01001000') // Returns: '01001-000'
   * formatCep('01001-000') // Returns: '01001-000'
   */
  static formatCep(cep: string): string {
    const cleaned = this.normalizeCep(cep);

    if (cleaned.length !== 8) {
      return cep; // Retorna original se não tiver 8 dígitos
    }

    return `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
  }

  /**
   * Normaliza sigla de estado (converte para maiúsculas)
   *
   * @example
   * normalizeState('sp') // Returns: 'SP'
   * normalizeState('SP') // Returns: 'SP'
   */
  static normalizeState(state: string): BrazilianState | null {
    return normalizeBrazilianState(state);
  }

  /**
   * Formata coordenadas geográficas
   *
   * @example
   * formatCoordinates(-23.55052, -46.633308)
   * ! Returns: "-23.55052, -46.633308"
   */
  static formatCoordinates(latitude: number, longitude: number, precision = 6): string {
    return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
  }

  /**
   * Parse string de coordenadas para objeto
   *
   * @example
   * parseCoordinates("-23.55052, -46.633308")
   * ! Returns: { latitude: -23.55052, longitude: -46.633308 }
   */
  static parseCoordinates(coordinates: string): { latitude: number; longitude: number } | null {
    if (!coordinates || typeof coordinates !== 'string') {
      return null;
    }

    const parts = coordinates.split(',').map(p => p.trim());

    if (parts.length !== 2) {
      return null;
    }

    const latitude = parseFloat(parts[0] || '');
    const longitude = parseFloat(parts[1] || '');

    if (isNaN(latitude) || isNaN(longitude)) {
      return null;
    }

    return { latitude, longitude };
  }

  /**
   * Valida se coordenadas estão dentro dos limites válidos
   */
  static validateCoordinates(latitude: number, longitude: number): boolean {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return false;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return false;
    }

    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }

  /**
   * Sanitiza string de endereço removendo caracteres especiais
   */
  static sanitizeAddressField(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    return value.trim().replace(/\s+/g, ' ');
  }

  /**
   * Capitaliza primeira letra de cada palavra
   */
  static capitalizeWords(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    return value
      .toLowerCase()
      .split(' ')
      .map(word => {
        if (word.length === 0) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  /**
   * Normaliza nome de cidade (capitaliza palavras, exceto preposições)
   */
  static normalizeCityName(city: string): string {
    if (!city || typeof city !== 'string') {
      return '';
    }

    const prepositions = ['de', 'da', 'do', 'das', 'dos'];

    return city
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        if (index > 0 && prepositions.includes(word)) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }
}
