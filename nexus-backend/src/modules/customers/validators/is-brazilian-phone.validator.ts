import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isBrazilianPhone', async: false })
export class IsBrazilianPhoneConstraint implements ValidatorConstraintInterface {
  validate(phone: string): boolean {
    if (!phone) {
      return false;
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Landline: 10 digits (XX XXXX-XXXX)
    // Mobile: 11 digits (XX 9XXXX-XXXX)
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      // Check if starts with valid DDD (11-99, except some invalid ones)
      const ddd = parseInt(cleanPhone.substring(0, 2));
      if (ddd < 11 || ddd > 99) {
        return false;
      }

      // Invalid DDDs
      const invalidDDDs = [
        20, 23, 25, 26, 29, 30, 31, 36, 39, 40, 50, 52, 56, 57, 58, 59, 60, 70, 72, 76, 78, 80,
      ];
      if (invalidDDDs.includes(ddd)) {
        return false;
      }

      // For mobile numbers, check if the third digit is 9
      if (cleanPhone.length === 11 && cleanPhone[2] !== '9') {
        return false;
      }

      // Check if it's not all the same digit
      if (/^(\d)\1+$/.test(cleanPhone)) {
        return false;
      }

      return true;
    }

    return false;
  }

  defaultMessage(): string {
    return 'Telefone brasileiro inválido. Formatos aceitos: (XX) XXXX-XXXX ou (XX) 9XXXX-XXXX';
  }
}

export function IsBrazilianPhone() {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      constraints: [],
      validator: IsBrazilianPhoneConstraint,
    });
  };
}
