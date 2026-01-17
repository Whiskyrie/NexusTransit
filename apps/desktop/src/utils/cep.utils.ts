/**
 * Utilitários para manipulação e validação de CEP
 */

/**
 * Remove caracteres não numéricos do CEP
 */
export function cleanCep(cep: string): string {
  return cep.replace(/\D/g, "");
}

/**
 * Formata CEP para o padrão 00000-000
 */
export function formatCep(cep: string): string {
  const cleaned = cleanCep(cep);
  if (cleaned.length !== 8) {
    return cleaned;
  }
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
}

/**
 * Valida se o CEP está no formato correto
 */
export function validateCepFormat(cep: string): boolean {
  const cleaned = cleanCep(cep);
  return cleaned.length === 8 && /^\d{8}$/.test(cleaned);
}

/**
 * Valida CEP e retorna resultado com formatação
 */
export function validateCep(cep: string): {
  isValid: boolean;
  formatted: string;
  error?: string;
} {
  if (!cep) {
    return {
      isValid: false,
      formatted: "",
      error: "CEP é obrigatório",
    };
  }

  const cleaned = cleanCep(cep);

  if (cleaned.length === 0) {
    return {
      isValid: false,
      formatted: "",
      error: "CEP inválido",
    };
  }

  if (cleaned.length < 8) {
    return {
      isValid: false,
      formatted: cleaned,
      error: "CEP incompleto (deve ter 8 dígitos)",
    };
  }

  if (cleaned.length > 8) {
    return {
      isValid: false,
      formatted: cleaned,
      error: "CEP muito longo (deve ter 8 dígitos)",
    };
  }

  if (!/^\d{8}$/.test(cleaned)) {
    return {
      isValid: false,
      formatted: cleaned,
      error: "CEP deve conter apenas números",
    };
  }

  return {
    isValid: true,
    formatted: formatCep(cleaned),
    error: undefined,
  };
}
