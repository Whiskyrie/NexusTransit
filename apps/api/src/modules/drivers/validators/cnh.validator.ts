import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validador customizado para CNH brasileira
 *
 * Implementa o algoritmo oficial de validação de CNH
 * Baseado no DENATRAN
 */
@ValidatorConstraint({ name: 'isCNH', async: false })
export class IsCNHConstraint implements ValidatorConstraintInterface {
  validate(cnh: string): boolean {
    if (!cnh || typeof cnh !== 'string') {
      return false;
    }

    // Remove formatação
    const cleanCNH = cnh.replace(/[^\d]/g, '');

    // Verifica se tem 11 dígitos
    if (cleanCNH.length !== 11) {
      return false;
    }

    // Verifica se não são todos iguais
    if (/^(\d)\1{10}$/.test(cleanCNH)) {
      return false;
    }

    // Validação dos dígitos verificadores
    return this.validateCheckDigits(cleanCNH);
  }

  private validateCheckDigits(cnh: string): boolean {
    let sum = 0;
    let digit1 = 0;
    let digit2 = 0;
    let isFirstDigitGreaterThan9 = false;

    // Primeiro dígito verificador
    // Multiplicadores: 9, 8, 7, 6, 5, 4, 3, 2, 1
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cnh.charAt(i)) * (9 - i);
    }

    digit1 = sum % 11;
    if (digit1 > 9) {
      digit1 = 0;
      isFirstDigitGreaterThan9 = true;
    }

    // Segundo dígito verificador
    // Multiplicadores: 1, 2, 3, 4, 5, 6, 7, 8, 9
    sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cnh.charAt(i)) * (i + 1);
    }

    digit2 = sum % 11;

    // Regra especial: se o primeiro dígito foi > 9, ajusta o segundo
    if (isFirstDigitGreaterThan9) {
      if (digit2 - 2 < 0) {
        digit2 += 9;
      } else {
        digit2 -= 2;
      }
    }

    if (digit2 > 9) {
      digit2 = 0;
    }

    // Verifica se os dígitos calculados batem com os informados
    return digit1 === parseInt(cnh.charAt(9)) && digit2 === parseInt(cnh.charAt(10));
  }

  defaultMessage(): string {
    return 'CNH deve estar em formato válido';
  }
}

/**
 * Decorator para validação de CNH brasileira
 *
 * @example
 * ```typescript
 * class CreateDriverDto {
 *   @IsCNH()
 *   cnh_number: string;
 * }
 * ```
 */
export function IsCNH(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsCNHConstraint,
    });
  };
}

/**
 * Função auxiliar para normalizar CNH
 * Remove formatação e mantém apenas números
 */
export function normalizeCNH(cnh: string): string {
  if (!cnh) {
    return '';
  }
  return cnh.replace(/[^\d]/g, '');
}
