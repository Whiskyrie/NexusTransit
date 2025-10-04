import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validador customizado para CPF brasileiro
 *
 * Implementa o algoritmo oficial de validação de CPF
 * Baseado na Portaria MF nº 252/2002
 */
@ValidatorConstraint({ name: 'isCPF', async: false })
export class IsCPFConstraint implements ValidatorConstraintInterface {
  validate(cpf: string): boolean {
    if (!cpf || typeof cpf !== 'string') {
      return false;
    }

    // Remove formatação
    const cleanCPF = cpf.replace(/[^\d]/g, '');

    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) {
      return false;
    }

    // Verifica se não são todos iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      return false;
    }

    // Validação dos dígitos verificadores
    return this.validateCheckDigits(cleanCPF);
  }

  private validateCheckDigits(cpf: string): boolean {
    let sum = 0;
    let remainder;

    // Primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cpf.substring(9, 10))) {
      return false;
    }

    // Segundo dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cpf.substring(10, 11))) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'CPF deve estar em formato válido';
  }
}

/**
 * Decorator para validação de CPF brasileiro
 *
 * @example
 * ```typescript
 * class CreateDriverDto {
 *   @IsCPF()
 *   cpf: string;
 * }
 * ```
 */
export function IsCPF(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      ...(validationOptions && { options: validationOptions }),
      constraints: [],
      validator: IsCPFConstraint,
    });
  };
}

/**
 * Função auxiliar para normalizar CPF
 * Remove formatação e mantém apenas números
 */
export function normalizeCPF(cpf: string): string {
  if (!cpf) {
    return '';
  }
  return cpf.replace(/[^\d]/g, '');
}
