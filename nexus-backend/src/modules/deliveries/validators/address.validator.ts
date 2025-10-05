import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Interface para endereço brasileiro completo
 */
export interface BrazilianAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
}

/**
 * Validador customizado para endereços brasileiros completos
 *
 * Valida:
 * - CEP no formato 00000-000
 * - Estado (UF) com 2 letras
 * - Cidade não vazia
 * - Rua e bairro não vazios
 *
 * @example
 * {
 *   street: "Rua das Flores",
 *   number: "123",
 *   neighborhood: "Centro",
 *   city: "São Paulo",
 *   state: "SP",
 *   postal_code: "01310-100"
 * }
 */
@ValidatorConstraint({ name: 'isValidAddress', async: false })
export class IsValidAddressConstraint implements ValidatorConstraintInterface {
  private static readonly CEP_REGEX = /^\d{5}-?\d{3}$/;
  private static readonly UF_LIST = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  ];

  validate(address: unknown): boolean {
    if (!address || typeof address !== 'object') {
      return false;
    }

    const addr = address as Partial<BrazilianAddress>;

    // Valida campos obrigatórios
    if (
      !addr.street ||
      !addr.number ||
      !addr.neighborhood ||
      !addr.city ||
      !addr.state ||
      !addr.postal_code
    ) {
      return false;
    }

    // Valida CEP
    if (!IsValidAddressConstraint.CEP_REGEX.test(addr.postal_code)) {
      return false;
    }

    // Valida UF
    const uf = addr.state.toUpperCase();
    if (!IsValidAddressConstraint.UF_LIST.includes(uf)) {
      return false;
    }

    // Valida campos não vazios
    if (
      addr.street.trim().length === 0 ||
      addr.number.trim().length === 0 ||
      addr.neighborhood.trim().length === 0 ||
      addr.city.trim().length === 0
    ) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Endereço brasileiro inválido. Deve conter rua, número, bairro, cidade, estado (UF) e CEP válido';
  }
}

/**
 * Decorator para validação de endereços brasileiros
 *
 * @example
 * ```typescript
 * class CreateDeliveryDto {
 *   @IsValidAddress()
 *   origin_address: BrazilianAddress;
 * }
 * ```
 */
export function IsValidAddress(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsValidAddressConstraint,
    });
  };
}

/**
 * Valida apenas o CEP
 *
 * @param postalCode - CEP a ser validado
 * @returns true se válido
 */
export function isValidCEP(postalCode: string): boolean {
  if (!postalCode) {
    return false;
  }
  return /^\d{5}-?\d{3}$/.test(postalCode);
}

/**
 * Normaliza CEP para o formato 00000-000
 *
 * @param postalCode - CEP a ser normalizado
 * @returns CEP formatado
 */
export function normalizeCEP(postalCode: string): string {
  if (!postalCode) {
    return '';
  }

  const numbersOnly = postalCode.replace(/\D/g, '');

  if (numbersOnly.length !== 8) {
    return postalCode;
  }

  return `${numbersOnly.substring(0, 5)}-${numbersOnly.substring(5, 8)}`;
}

/**
 * Valida UF (Unidade Federativa)
 *
 * @param uf - Sigla do estado
 * @returns true se válido
 */
export function isValidUF(uf: string): boolean {
  if (!uf) {
    return false;
  }

  const states = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  ];

  return states.includes(uf.toUpperCase());
}
