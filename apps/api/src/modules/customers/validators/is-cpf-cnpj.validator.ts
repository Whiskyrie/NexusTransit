import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'isCpfCnpj', async: false })
export class IsCpfCnpjConstraint implements ValidatorConstraintInterface {
  validate(document: string): boolean {
    if (!document) {
      return false;
    }

    const cleanDoc = document.replace(/\D/g, '');

    if (cleanDoc.length === 11) {
      return this.validateCPF(cleanDoc);
    } else if (cleanDoc.length === 14) {
      return this.validateCNPJ(cleanDoc);
    }

    return false;
  }

  private validateCPF(cpf: string): boolean {
    if (cpf.length !== 11) {
      return false;
    }

    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    // Validate first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i] ?? '0') * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cpf[9] ?? '0')) {
      return false;
    }

    // Validate second digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i] ?? '0') * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cpf[10] ?? '0')) {
      return false;
    }

    return true;
  }

  private validateCNPJ(cnpj: string): boolean {
    if (cnpj.length !== 14) {
      return false;
    }

    // Check if all digits are the same
    if (/^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    // Validate first digit
    let sum = 0;
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj[i] ?? '0') * (weights1[i] ?? 0);
    }
    let remainder = sum % 11;
    if (remainder < 2) {
      remainder = 0;
    } else {
      remainder = 11 - remainder;
    }
    if (remainder !== parseInt(cnpj[12] ?? '0')) {
      return false;
    }

    // Validate second digit
    sum = 0;
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj[i] ?? '0') * (weights2[i] ?? 0);
    }
    remainder = sum % 11;
    if (remainder < 2) {
      remainder = 0;
    } else {
      remainder = 11 - remainder;
    }
    if (remainder !== parseInt(cnpj[13] ?? '0')) {
      return false;
    }

    return true;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'CPF/CNPJ inválido. Formato esperado: CPF (XXX.XXX.XXX-XX) ou CNPJ (XX.XXX.XXX/XXXX-XX)';
  }
}

export function IsCpfCnpj() {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      constraints: [],
      validator: IsCpfCnpjConstraint,
    });
  };
}
