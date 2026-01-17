/**
 * Utilitários de formatação para exibição de dados
 */

/**
 * Formata um CPF para exibição
 * @param cpf - CPF apenas com números
 * @returns CPF formatado (000.000.000-00)
 */
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Formata um telefone para exibição
 * @param phone - Telefone apenas com números
 * @returns Telefone formatado ((00) 00000-0000 ou (00) 0000-0000)
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11) {
    // Celular: (00) 00000-0000
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (digits.length === 10) {
    // Fixo: (00) 0000-0000
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return phone;
}

/**
 * Formata uma CNH para exibição
 * @param cnh - CNH apenas com números
 * @returns CNH formatada (000 000 000 00)
 */
export function formatCNH(cnh: string): string {
  const digits = cnh.replace(/\D/g, "");
  if (digits.length !== 11) return cnh;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1 $2 $3 $4");
}

/**
 * Formata uma placa de veículo para exibição
 * @param plate - Placa do veículo
 * @returns Placa formatada (ABC-1234 ou ABC1D23)
 */
export function formatLicensePlate(plate: string): string {
  const cleaned = plate.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  if (cleaned.length === 7) {
    // Verifica se é placa Mercosul (ABC1D23) ou antiga (ABC1234)
    if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(cleaned)) {
      // Mercosul - não adiciona hífen
      return cleaned;
    } else {
      // Antiga - adiciona hífen
      return cleaned.replace(/([A-Z]{3})(\d{4})/, "$1-$2");
    }
  }

  return plate.toUpperCase();
}

/**
 * Aplica máscara de CPF enquanto digita
 * @param value - Valor digitado
 * @returns Valor com máscara parcial
 */
export function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, "$1.$2");
  if (digits.length <= 9) return digits.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4");
}

/**
 * Aplica máscara de telefone enquanto digita
 * @param value - Valor digitado
 * @returns Valor com máscara parcial
 */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : "";
  if (digits.length <= 6) return digits.replace(/(\d{2})(\d+)/, "($1) $2");
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
}

/**
 * Remove formatação e retorna apenas dígitos
 * @param value - Valor formatado
 * @returns Apenas dígitos
 */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}
