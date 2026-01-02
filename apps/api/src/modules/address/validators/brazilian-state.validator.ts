import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BrazilianState, isValidBrazilianState } from '../enums';

/**
 * Validador customizado para estados brasileiros
 *
 * Valida se a sigla do estado está entre as 27 UFs brasileiras
 */
@ValidatorConstraint({ name: 'isBrazilianState', async: false })
export class IsBrazilianStateConstraint implements ValidatorConstraintInterface {
  validate(state: string): boolean {
    if (!state || typeof state !== 'string') {
      return false;
    }

    // Normaliza para maiúsculas
    const normalized = state.trim().toUpperCase();

    // Verifica se tem 2 caracteres
    if (normalized.length !== 2) {
      return false;
    }

    // Verifica se é um estado válido
    return isValidBrazilianState(normalized);
  }

  defaultMessage(): string {
    return 'Estado deve ser uma sigla válida de UF brasileira (ex: SP, RJ, MG)';
  }
}

/**
 * Decorator para validação de estado brasileiro
 *
 * @example
 * ```typescript
 * class CreateAddressDto {
 *   @IsBrazilianState()
 *   state: string;
 * }
 * ```
 */
export function IsBrazilianState(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsBrazilianStateConstraint,
    });
  };
}

/**
 * Função auxiliar para normalizar sigla de estado
 */
export function normalizeState(state: string): BrazilianState | null {
  if (!state || typeof state !== 'string') {
    return null;
  }

  const normalized = state.trim().toUpperCase();
  return isValidBrazilianState(normalized) ? (normalized as BrazilianState) : null;
}

/**
 * Função auxiliar para validar estado
 */
export function isValidState(state: string): boolean {
  if (!state || typeof state !== 'string') {
    return false;
  }

  const normalized = state.trim().toUpperCase();
  return isValidBrazilianState(normalized);
}
