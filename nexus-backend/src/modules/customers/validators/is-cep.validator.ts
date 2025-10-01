import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsCep', async: false })
export class IsCepConstraint implements ValidatorConstraintInterface {
  validate(cep: string): boolean {
    if (!cep) {
      return false;
    }

    const cleanCep = cep.replace(/\D/g, '');

    // Brazilian CEP has exactly 8 digits
    if (cleanCep.length !== 8) {
      return false;
    }

    // Check if it's not all the same digit
    if (/^(\d)\1{7}$/.test(cleanCep)) {
      return false;
    }

    // Basic validation - CEPs starting with certain digits are invalid
    const firstDigit = parseInt(cleanCep[0] ?? '0');
    if (firstDigit === 0 || firstDigit > 9) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'CEP brasileiro inválido. Formato esperado: XXXXX-XXX';
  }
}
export function IsCep(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      ...(validationOptions && { options: validationOptions }),
      constraints: [],
      validator: IsCepConstraint,
    });
  };
}
