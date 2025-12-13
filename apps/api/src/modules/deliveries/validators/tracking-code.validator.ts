import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validador customizado para códigos de rastreamento
 *
 * Formato esperado: NXT-YYYYMMDD-XXXXX
 * - NXT: Prefixo fixo da empresa
 * - YYYYMMDD: Data de criação
 * - XXXXX: Código sequencial de 5 dígitos
 *
 * @example
 * NXT-20251005-00001
 * NXT-20251231-99999
 */
@ValidatorConstraint({ name: 'isTrackingCode', async: false })
export class IsTrackingCodeConstraint implements ValidatorConstraintInterface {
  public static readonly TRACKING_CODE_REGEX = /^NXT-\d{8}-\d{5}$/;

  validate(code: string): boolean {
    if (!code) {
      return false;
    }

    // Remove espaços e converte para maiúsculas
    const cleanCode = code.trim().toUpperCase();

    // Valida formato básico
    if (!IsTrackingCodeConstraint.TRACKING_CODE_REGEX.test(cleanCode)) {
      return false;
    }

    // Extrai e valida a data
    const datePart = cleanCode.substring(4, 12); // YYYYMMDD
    const year = parseInt(datePart.substring(0, 4), 10);
    const month = parseInt(datePart.substring(4, 6), 10);
    const day = parseInt(datePart.substring(6, 8), 10);

    // Valida ano (entre 2020 e ano atual + 1)
    const currentYear = new Date().getFullYear();
    if (year < 2020 || year > currentYear + 1) {
      return false;
    }

    // Valida mês
    if (month < 1 || month > 12) {
      return false;
    }

    // Valida dia
    if (day < 1 || day > 31) {
      return false;
    }

    // Validação mais rigorosa de data (considera dias por mês)
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Código de rastreamento deve estar no formato NXT-YYYYMMDD-XXXXX (ex: NXT-20251005-00001)';
  }
}

/**
 * Decorator para validação de códigos de rastreamento
 *
 * @example
 * ```typescript
 * class CreateDeliveryDto {
 *   @IsTrackingCode()
 *   tracking_code: string;
 * }
 * ```
 */
export function IsTrackingCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsTrackingCodeConstraint,
    });
  };
}

/**
 * Utilitário para normalizar códigos de rastreamento
 * Remove espaços e converte para maiúsculas
 *
 * @param code - Código a ser normalizado
 * @returns Código normalizado
 */
export function normalizeTrackingCode(code: string): string {
  if (!code) {
    return '';
  }
  return code.trim().toUpperCase();
}

/**
 * Utilitário para formatar código de rastreamento
 * Garante o formato NXT-YYYYMMDD-XXXXX
 *
 * @param code - Código a ser formatado
 * @returns Código formatado
 */
export function formatTrackingCode(code: string): string {
  const normalized = normalizeTrackingCode(code);

  // Se já está no formato correto, retorna
  if (IsTrackingCodeConstraint.TRACKING_CODE_REGEX.test(normalized)) {
    return normalized;
  }

  // Se o código tem apenas números, tenta formatar
  const numbersOnly = normalized.replace(/\D/g, '');
  if (numbersOnly.length === 13) {
    return `NXT-${numbersOnly.substring(0, 8)}-${numbersOnly.substring(8, 13)}`;
  }

  return code;
}

/**
 * Extrai informações do código de rastreamento
 *
 * @param code - Código de rastreamento
 * @returns Objeto com informações extraídas
 */
export function parseTrackingCode(code: string): {
  prefix: string;
  date: string;
  sequence: string;
  isValid: boolean;
} {
  const normalized = normalizeTrackingCode(code);

  if (!IsTrackingCodeConstraint.TRACKING_CODE_REGEX.test(normalized)) {
    return {
      prefix: '',
      date: '',
      sequence: '',
      isValid: false,
    };
  }

  const parts = normalized.split('-');
  return {
    prefix: parts[0] ?? '',
    date: parts[1] ?? '',
    sequence: parts[2] ?? '',
    isValid: true,
  };
}
