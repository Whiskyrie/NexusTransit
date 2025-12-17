import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validador customizado para número de certificado MOPP
 *
 * Implementa validação do formato do certificado MOPP
 * Formato aceito: MOPP-XXXX-YYYY ou apenas números
 *
 * @example
 * ```typescript
 * class CreateDriverDto {
 *   @IsMOPPNumber()
 *   mopp_certificate_number: string;
 * }
 * ```
 */
@ValidatorConstraint({ name: 'isMOPPNumber', async: false })
export class IsMOPPNumberConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    const normalized = this.normalize(value);
    return this.isValid(normalized);
  }

  /**
   * Normaliza o número removendo espaços e convertendo para maiúsculas
   */
  private normalize(value: string): string {
    return value.trim().toUpperCase().replace(/\s+/g, '');
  }

  /**
   * Valida o formato do número do certificado
   * Aceita: MOPP-1234-5678 ou 12345678
   */
  private isValid(value: string): boolean {
    // Formato completo: MOPP-XXXX-YYYY
    const fullPattern = /^MOPP-\d{4}-\d{4}$/;

    // Formato simplificado: apenas números (8 dígitos)
    const simplePattern = /^\d{8,15}$/;

    return fullPattern.test(value) || simplePattern.test(value);
  }

  defaultMessage(): string {
    return 'Número de certificado MOPP inválido. Formato esperado: MOPP-1234-5678 ou 12345678';
  }
}

/**
 * Decorator para validação de número de certificado MOPP
 *
 * @param validationOptions - Opções de validação do class-validator
 */
export function IsMOPPNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsMOPPNumberConstraint,
    });
  };
}

/**
 * Normaliza o número do certificado MOPP para formato padronizado
 *
 * @param value - Número do certificado
 * @returns Número normalizado
 */
export function normalizeMOPPNumber(value: string): string {
  if (!value) {
    return '';
  }

  const cleaned = value.trim().toUpperCase().replace(/\s+/g, '');

  // Se já está no formato MOPP-XXXX-YYYY, retorna
  if (/^MOPP-\d{4}-\d{4}$/.test(cleaned)) {
    return cleaned;
  }

  // Se são apenas números, tenta formatar
  const numbersOnly = cleaned.replace(/\D/g, '');
  if (numbersOnly.length === 8) {
    return `MOPP-${numbersOnly.substring(0, 4)}-${numbersOnly.substring(4, 8)}`;
  }

  return cleaned;
}

/**
 * Formata o número do certificado MOPP para exibição
 *
 * @param value - Número do certificado
 * @returns Número formatado para exibição
 */
export function formatMOPPNumber(value: string): string {
  return normalizeMOPPNumber(value);
}
