/**
 * Código de país
 *
 * Representa os países suportados pelo sistema
 * Atualmente focado no Brasil, mas expansível para outros países
 */
export enum CountryCode {
  /**
   * Brasil
   */
  BR = 'BR',
}

/**
 * Utilitário para validar código de país
 */
export function isValidCountryCode(code: string): code is CountryCode {
  return Object.values(CountryCode).includes(code as CountryCode);
}

/**
 * Utilitário para obter países disponíveis
 */
export function getAvailableCountries(): CountryCode[] {
  return Object.values(CountryCode);
}

/**
 * Utilitário para traduzir código de país
 */
export function translateCountryCode(code: CountryCode): string {
  const translations: Record<CountryCode, string> = {
    [CountryCode.BR]: 'Brasil',
  };
  return translations[code] || code;
}

/**
 * Utilitário para obter nome completo do país
 */
export function getCountryName(code: CountryCode): string {
  return translateCountryCode(code);
}
