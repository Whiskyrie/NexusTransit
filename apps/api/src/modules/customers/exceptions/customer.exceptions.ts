import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomerNotFoundException extends HttpException {
  constructor(identifier: string) {
    super(
      {
        message: `Customer not found`,
        details: `Customer with ${identifier} does not exist`,
        code: 'CUSTOMER_NOT_FOUND',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class CustomerAlreadyExistsException extends HttpException {
  constructor(field: string, value: string) {
    super(
      {
        message: 'Customer already exists',
        details: `Customer with ${field} "${value}" already exists`,
        code: 'CUSTOMER_ALREADY_EXISTS',
        field,
        value,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidTaxIdException extends HttpException {
  constructor(taxId: string) {
    super(
      {
        message: 'Invalid tax ID',
        details: `Tax ID "${taxId}" is not a valid CPF or CNPJ`,
        code: 'INVALID_TAX_ID',
        taxId,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidCepException extends HttpException {
  constructor(cep: string) {
    super(
      {
        message: 'Invalid CEP',
        details: `CEP "${cep}" is not a valid Brazilian postal code`,
        code: 'INVALID_CEP',
        cep,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidPhoneException extends HttpException {
  constructor(phone: string) {
    super(
      {
        message: 'Invalid phone number',
        details: `Phone "${phone}" is not a valid Brazilian phone number`,
        code: 'INVALID_PHONE',
        phone,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class AddressNotFoundException extends HttpException {
  constructor(addressId: string, customerId?: string) {
    const details = customerId
      ? `Address with ID "${addressId}" not found for customer "${customerId}"`
      : `Address with ID "${addressId}" not found`;

    super(
      {
        message: 'Address not found',
        details,
        code: 'ADDRESS_NOT_FOUND',
        addressId,
        customerId,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class PrimaryAddressException extends HttpException {
  constructor(action: 'delete' | 'update') {
    const message =
      action === 'delete'
        ? 'Cannot delete primary address'
        : 'Cannot modify primary address status';

    const details =
      action === 'delete'
        ? 'Set another address as primary before deleting this one'
        : 'Use set-primary endpoint to change primary address';

    super(
      {
        message,
        details,
        code: 'PRIMARY_ADDRESS_ERROR',
        action,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class CustomerInactiveException extends HttpException {
  constructor(customerId: string) {
    super(
      {
        message: 'Customer is inactive',
        details: `Customer "${customerId}" is inactive and cannot perform this action`,
        code: 'CUSTOMER_INACTIVE',
        customerId,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class GeocodingException extends HttpException {
  constructor(address: string) {
    super(
      {
        message: 'Geocoding failed',
        details: `Unable to geocode address: ${address}`,
        code: 'GEOCODING_FAILED',
        address,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ViaCepException extends HttpException {
  constructor(cep: string) {
    super(
      {
        message: 'CEP validation failed',
        details: `Unable to validate CEP "${cep}" via ViaCEP service`,
        code: 'VIACEP_FAILED',
        cep,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class CustomerValidationException extends HttpException {
  constructor(errors: { field: string; message: string }[]) {
    super(
      {
        message: 'Customer validation failed',
        details: 'One or more fields are invalid',
        code: 'CUSTOMER_VALIDATION_FAILED',
        errors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class AddressLimitExceededException extends HttpException {
  constructor(current: number, max: number) {
    super(
      {
        message: 'Address limit exceeded',
        details: `Customer has ${current} addresses, maximum allowed is ${max}`,
        code: 'ADDRESS_LIMIT_EXCEEDED',
        current,
        max,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
