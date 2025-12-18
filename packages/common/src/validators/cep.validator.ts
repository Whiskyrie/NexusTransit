import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

/**
 * Lista de CEPs conhecidos como inválidos (sequências repetidas)
 */
const INVALID_CEPS = [
  "00000000",
  "11111111",
  "22222222",
  "33333333",
  "44444444",
  "55555555",
  "66666666",
  "77777777",
  "88888888",
  "99999999",
];

/**
 * Validador customizado para CEP brasileiro
 *
 * Valida formato e padrões conhecidos de CEPs inválidos
 * Baseado nos padrões dos Correios
 */
@ValidatorConstraint({ name: "isCEP", async: false })
export class IsCEPConstraint implements ValidatorConstraintInterface {
  validate(cep: string): boolean {
    if (!cep || typeof cep !== "string") {
      return false;
    }

    // Remove formatação
    const cleanCEP = cep.replace(/[^\d]/g, "");

    // Verifica se tem 8 dígitos
    if (cleanCEP.length !== 8) {
      return false;
    }

    // Verifica se não são todos iguais
    if (INVALID_CEPS.includes(cleanCEP)) {
      return false;
    }

    // Valida o range (CEPs válidos começam a partir de 01000-000)
    return this.validateRange(cleanCEP);
  }

  private validateRange(cep: string): boolean {
    const cepNumber = parseInt(cep, 10);

    // CEPs válidos vão de 01000-000 até 99999-999
    return cepNumber >= 1000000 && cepNumber <= 99999999;
  }

  defaultMessage(): string {
    return "CEP deve estar em formato válido";
  }
}

/**
 * Decorator para validação de CEP brasileiro
 *
 * @example
 * ```typescript
 * class CreateAddressDto {
 *   @IsCEP()
 *   zipCode: string;
 * }
 * ```
 */
export function IsCEP(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsCEPConstraint,
    });
  };
}

/**
 * Função auxiliar para normalizar CEP
 * Remove formatação e mantém apenas números
 */
export function normalizeCEP(cep: string): string {
  if (!cep) {
    return "";
  }
  return cep.replace(/[^\d]/g, "");
}

/**
 * Função auxiliar para formatar CEP
 * Adiciona o hífen no formato XXXXX-XXX
 */
export function formatCEP(cep: string): string {
  if (!cep) {
    return "";
  }

  const cleanCEP = normalizeCEP(cep);

  if (cleanCEP.length === 8) {
    return `${cleanCEP.substring(0, 5)}-${cleanCEP.substring(5)}`;
  }

  return cleanCEP;
}
