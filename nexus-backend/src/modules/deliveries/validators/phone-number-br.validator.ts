import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validador customizado para telefones brasileiros
 *
 * Formatos suportados:
 * - Celular: (XX) XXXXX-XXXX ou (XX) 9XXXX-XXXX
 * - Fixo: (XX) XXXX-XXXX
 * - Com ou sem formatação
 *
 * @example
 * "(11) 98765-4321" - Celular SP
 * "(21) 3456-7890" - Fixo RJ
 * "11987654321" - Celular sem formatação
 */
@ValidatorConstraint({ name: 'isPhoneNumberBR', async: false })
export class IsPhoneNumberBRConstraint implements ValidatorConstraintInterface {
  // Celular: (XX) 9XXXX-XXXX
  private static readonly MOBILE_REGEX = /^\(?([1-9]{2})\)?[\s-]?9[\s-]?\d{4}[\s-]?\d{4}$/;

  // Fixo: (XX) XXXX-XXXX
  private static readonly LANDLINE_REGEX = /^\(?([1-9]{2})\)?[\s-]?[2-5]\d{3}[\s-]?\d{4}$/;

  validate(phone: string): boolean {
    if (!phone) {
      return false;
    }

    // Remove espaços extras
    const cleanPhone = phone.trim();

    // Testa padrões de celular e fixo
    return (
      IsPhoneNumberBRConstraint.MOBILE_REGEX.test(cleanPhone) ||
      IsPhoneNumberBRConstraint.LANDLINE_REGEX.test(cleanPhone)
    );
  }

  defaultMessage(): string {
    return 'Telefone brasileiro inválido. Use formato: (XX) XXXXX-XXXX para celular ou (XX) XXXX-XXXX para fixo';
  }
}

/**
 * Decorator para validação de telefones brasileiros
 *
 * @example
 * ```typescript
 * class ContactDto {
 *   @IsPhoneNumberBR()
 *   phone: string;
 * }
 * ```
 */
export function IsPhoneNumberBR(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsPhoneNumberBRConstraint,
    });
  };
}

/**
 * Normaliza telefone brasileiro removendo caracteres especiais
 *
 * @param phone - Telefone a ser normalizado
 * @returns Apenas números do telefone
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) {
    return '';
  }
  return phone.replace(/\D/g, '');
}

/**
 * Formata telefone brasileiro
 *
 * @param phone - Telefone a ser formatado
 * @returns Telefone formatado com (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);

  if (normalized.length < 10 || normalized.length > 11) {
    return phone;
  }

  const ddd = normalized.substring(0, 2);

  // Celular (11 dígitos)
  if (normalized.length === 11) {
    const firstPart = normalized.substring(2, 7);
    const secondPart = normalized.substring(7, 11);
    return `(${ddd}) ${firstPart}-${secondPart}`;
  }

  // Fixo (10 dígitos)
  const firstPart = normalized.substring(2, 6);
  const secondPart = normalized.substring(6, 10);
  return `(${ddd}) ${firstPart}-${secondPart}`;
}

/**
 * Verifica se é celular (tem 11 dígitos e começa com 9)
 *
 * @param phone - Telefone a ser verificado
 * @returns true se for celular
 */
export function isMobilePhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return normalized.length === 11 && normalized.charAt(2) === '9';
}

/**
 * Verifica se é telefone fixo (tem 10 dígitos)
 *
 * @param phone - Telefone a ser verificado
 * @returns true se for fixo
 */
export function isLandlinePhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return normalized.length === 10;
}

/**
 * Extrai DDD do telefone
 *
 * @param phone - Telefone
 * @returns DDD (código de área) ou null
 */
export function extractDDD(phone: string): string | null {
  const normalized = normalizePhoneNumber(phone);

  if (normalized.length < 10) {
    return null;
  }

  return normalized.substring(0, 2);
}
