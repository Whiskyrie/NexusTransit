import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { AddressFormatterUtil } from '../utils';
import { isValidBrazilianState } from '../enums';

/**
 * Interface para dados de endereço a serem validados
 */
interface AddressData {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Validador customizado para endereço completo
 *
 * Valida se um endereço possui todos os campos necessários
 * e se os dados são válidos
 */
@ValidatorConstraint({ name: 'isValidAddress', async: false })
export class IsValidAddressConstraint implements ValidatorConstraintInterface {
  validate(address: AddressData, _args: ValidationArguments): boolean {
    if (!address || typeof address !== 'object') {
      return false;
    }

    // Campos obrigatórios
    if (!address.street || address.street.trim() === '') {
      return false;
    }

    if (!address.neighborhood || address.neighborhood.trim() === '') {
      return false;
    }

    if (!address.city || address.city.trim() === '') {
      return false;
    }

    if (!address.state || address.state.trim() === '') {
      return false;
    }

    // Validar estado brasileiro
    const normalizedState = address.state.trim().toUpperCase();
    if (!isValidBrazilianState(normalizedState)) {
      return false;
    }

    // Validar CEP se fornecido
    if (address.cep) {
      const normalizedCep = AddressFormatterUtil.normalizeCep(address.cep);
      if (!/^\d{8}$/.test(normalizedCep)) {
        return false;
      }
    }

    // Validar coordenadas se fornecidas
    if (address.latitude !== undefined || address.longitude !== undefined) {
      if (address.latitude === undefined || address.longitude === undefined) {
        return false; // Ambas devem ser fornecidas
      }

      if (!AddressFormatterUtil.validateCoordinates(address.latitude, address.longitude)) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const address = args.value as AddressData;

    if (!address || typeof address !== 'object') {
      return 'Endereço deve ser um objeto válido';
    }

    if (!address.street || address.street.trim() === '') {
      return 'Logradouro é obrigatório';
    }

    if (!address.neighborhood || address.neighborhood.trim() === '') {
      return 'Bairro é obrigatório';
    }

    if (!address.city || address.city.trim() === '') {
      return 'Cidade é obrigatória';
    }

    if (!address.state || address.state.trim() === '') {
      return 'Estado é obrigatório';
    }

    const normalizedState = address.state.trim().toUpperCase();
    if (!isValidBrazilianState(normalizedState)) {
      return 'Estado deve ser uma sigla válida de UF brasileira';
    }

    if (address.cep) {
      const normalizedCep = AddressFormatterUtil.normalizeCep(address.cep);
      if (!/^\d{8}$/.test(normalizedCep)) {
        return 'CEP deve conter exatamente 8 dígitos numéricos';
      }
    }

    if (address.latitude !== undefined || address.longitude !== undefined) {
      if (address.latitude === undefined || address.longitude === undefined) {
        return 'Latitude e longitude devem ser fornecidas juntas';
      }

      if (!AddressFormatterUtil.validateCoordinates(address.latitude, address.longitude)) {
        return 'Coordenadas geográficas inválidas';
      }
    }

    return 'Endereço inválido';
  }
}

/**
 * Decorator para validação de endereço completo
 *
 * Valida se um objeto possui todos os campos necessários para um endereço válido
 *
 * @example
 * ```typescript
 * class CreateDeliveryDto {
 *   @ValidateNested()
 *   @Type(() => AddressDto)
 *   @ValidAddress()
 *   address: AddressDto;
 * }
 *
 * class AddressDto {
 *   @IsString()
 *   street: string;
 *
 *   @IsString()
 *   @IsOptional()
 *   number?: string;
 *
 *   @IsString()
 *   neighborhood: string;
 *
 *   @IsString()
 *   city: string;
 *
 *   @IsString()
 *   state: string;
 *
 *   @IsString()
 *   @IsOptional()
 *   cep?: string;
 * }
 * ```
 */
export function ValidAddress(validationOptions?: ValidationOptions) {
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
 * Decorator para validação de endereço com coordenadas obrigatórias
 *
 * Similar ao ValidAddress, mas exige que latitude e longitude sejam fornecidas
 *
 * @example
 * ```typescript
 * class CreateLocationDto {
 *   @ValidateNested()
 *   @Type(() => AddressWithCoordinatesDto)
 *   @ValidAddressWithCoordinates()
 *   address: AddressWithCoordinatesDto;
 * }
 * ```
 */
@ValidatorConstraint({ name: 'isValidAddressWithCoordinates', async: false })
export class IsValidAddressWithCoordinatesConstraint implements ValidatorConstraintInterface {
  validate(address: AddressData): boolean {
    // Primeiro valida como endereço normal
    const baseValidator = new IsValidAddressConstraint();
    if (!baseValidator.validate(address, {} as ValidationArguments)) {
      return false;
    }

    // Exige coordenadas
    if (!address.latitude || !address.longitude) {
      return false;
    }

    return AddressFormatterUtil.validateCoordinates(address.latitude, address.longitude);
  }

  defaultMessage(): string {
    return 'Endereço deve incluir coordenadas geográficas válidas (latitude e longitude)';
  }
}

export function ValidAddressWithCoordinates(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsValidAddressWithCoordinatesConstraint,
    });
  };
}
