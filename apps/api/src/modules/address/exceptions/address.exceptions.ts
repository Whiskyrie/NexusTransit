import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exceção quando endereço não é encontrado
 */
export class AddressNotFoundException extends HttpException {
  constructor(identifier: string) {
    super(
      {
        message: 'Endereço não encontrado',
        details: `Endereço com ID ${identifier} não existe`,
        code: 'ADDRESS_NOT_FOUND',
        identifier,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Exceção quando CEP é inválido
 */
export class InvalidCepException extends HttpException {
  constructor(cep: string, details?: string) {
    super(
      {
        message: 'CEP inválido',
        details: details ?? `CEP "${cep}" não é um CEP brasileiro válido`,
        code: 'INVALID_CEP',
        cep,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exceção quando CEP não é encontrado nas APIs
 */
export class CepNotFoundException extends HttpException {
  constructor(cep: string) {
    super(
      {
        message: 'CEP não encontrado',
        details: `CEP "${cep}" não foi encontrado nas bases de dados`,
        code: 'CEP_NOT_FOUND',
        cep,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Exceção quando o serviço de CEP está indisponível
 */
export class CepApiUnavailableException extends HttpException {
  constructor(message?: string) {
    super(
      {
        message: 'Serviço de CEP indisponível',
        details: message ?? 'Todas as APIs de consulta de CEP estão indisponíveis no momento',
        code: 'CEP_API_UNAVAILABLE',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * Exceção quando geocoding falha
 */
export class GeocodingFailedException extends HttpException {
  constructor(address?: string, details?: string) {
    super(
      {
        message: 'Falha ao obter coordenadas',
        details:
          details ??
          `Não foi possível obter coordenadas${address ? ` para o endereço: ${address}` : ''}`,
        code: 'GEOCODING_FAILED',
        address,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exceção quando reverse geocoding falha
 */
export class ReverseGeocodingFailedException extends HttpException {
  constructor(latitude: number, longitude: number, details?: string) {
    super(
      {
        message: 'Falha ao obter endereço',
        details:
          details ??
          `Não foi possível obter endereço para as coordenadas: ${latitude}, ${longitude}`,
        code: 'REVERSE_GEOCODING_FAILED',
        latitude,
        longitude,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exceção quando coordenadas são inválidas
 */
export class InvalidCoordinatesException extends HttpException {
  constructor(latitude?: number, longitude?: number, details?: string) {
    super(
      {
        message: 'Coordenadas inválidas',
        details:
          details ??
          `Coordenadas inválidas${latitude !== undefined && longitude !== undefined ? `: lat=${latitude}, lng=${longitude}` : ''}`,
        code: 'INVALID_COORDINATES',
        latitude,
        longitude,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exceção quando validação de endereço falha
 */
export class AddressValidationException extends HttpException {
  constructor(message: string, field?: string) {
    super(
      {
        message: 'Validação de endereço falhou',
        details: message,
        code: 'ADDRESS_VALIDATION_FAILED',
        field,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exceção quando estado brasileiro é inválido
 */
export class InvalidBrazilianStateException extends HttpException {
  constructor(state: string) {
    super(
      {
        message: 'Estado brasileiro inválido',
        details: `Estado "${state}" não é uma sigla válida de UF brasileira`,
        code: 'INVALID_BRAZILIAN_STATE',
        state,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
