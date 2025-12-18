import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

@ValidatorConstraint({ name: "isValidCEP", async: false })
export class IsValidCEPConstraint implements ValidatorConstraintInterface {
  validate(cep: string | undefined | null): boolean {
    if (!cep || typeof cep !== "string") {
      return false;
    }

    // Remove qualquer formatação (pontos, hífens, espaços)
    const cleanedCep = cep.replace(/\D/g, "");

    // Verifica se tem exatamente 8 dígitos
    if (cleanedCep.length !== 8) {
      return false;
    }

    // Verifica se todos os caracteres são números
    if (!/^\d{8}$/.test(cleanedCep)) {
      return false;
    }

    // Verifica se não é uma sequência repetida (00000000, 11111111, etc)
    if (/^(\d)\1{7}$/.test(cleanedCep)) {
      return false;
    }

    return true;
  }

  defaultMessage(_args: ValidationArguments): string {
    return "CEP inválido. Deve conter exatamente 8 dígitos numéricos.";
  }
}

export function IsValidCEP(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCEPConstraint,
    });
  };
}

export function formatCEP(cep: string | undefined | null): string {
  if (!cep || typeof cep !== "string") {
    return "";
  }

  const cleanedCep = cep.replace(/\D/g, "");

  if (cleanedCep.length === 8) {
    return `${cleanedCep.substring(0, 5)}-${cleanedCep.substring(5)}`;
  }

  return cleanedCep;
}

export function cleanCEP(cep: string | undefined | null): string {
  if (!cep || typeof cep !== "string") {
    return "";
  }
  return cep.replace(/\D/g, "");
}
