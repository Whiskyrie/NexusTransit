/**
 * Validation Decorators for Routes Module
 *
 * Decorators de validação customizados para entidades e DTOs do módulo Routes
 *
 * @module Routes/Decorators
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ROUTE_CODE_CONSTANTS } from '../constants/route-code.constants';

/**
 * Validador para código de rota
 *
 * Verifica se o código da rota segue o padrão estabelecido:
 * - Formato: RT-YYYYMMDD-NNN
 * - Exemplo: RT-20241106-001
 */
@ValidatorConstraint({ name: 'isValidRouteCode', async: false })
export class IsValidRouteCodeConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    const pattern = new RegExp(
      `^${ROUTE_CODE_CONSTANTS.ROUTE_CODE_PREFIX}-\\d{8}-\\d{${ROUTE_CODE_CONSTANTS.ROUTE_CODE_SEQUENTIAL_MIN_DIGITS}}$`,
    );

    return pattern.test(value);
  }

  defaultMessage(): string {
    return `Código da rota deve seguir o formato ${ROUTE_CODE_CONSTANTS.ROUTE_CODE_FORMAT}`;
  }
}

/**
 * Decorator para validação de código de rota
 *
 * @example
 * ```typescript
 * class CreateRouteDto {
 *   @IsValidRouteCode()
 *   route_code: string;
 * }
 * ```
 */
export function IsValidRouteCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsValidRouteCodeConstraint,
    });
  };
}

/**
 * Validador para coordenadas geográficas
 *
 * Verifica se as coordenadas estão em formato válido e dentro de limites aceitáveis
 */
@ValidatorConstraint({ name: 'isValidCoordinates', async: false })
export class IsValidCoordinatesConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    // Formato esperado: "latitude,longitude" ou objeto JSON
    const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;

    if (coordPattern.test(value)) {
      const [lat, lng] = value.split(',').map(Number);
      if (lat === undefined || lng === undefined) {
        return false;
      }
      return this.isValidLatitude(lat) && this.isValidLongitude(lng);
    }

    // Tentar parse como JSON
    try {
      const coords = JSON.parse(value) as { lat: number; lng: number };
      if (coords.lat && coords.lng) {
        return this.isValidLatitude(coords.lat) && this.isValidLongitude(coords.lng);
      }
    } catch {
      return false;
    }

    return false;
  }

  private isValidLatitude(lat: number): boolean {
    return lat >= -90 && lat <= 90;
  }

  private isValidLongitude(lng: number): boolean {
    return lng >= -180 && lng <= 180;
  }

  defaultMessage(): string {
    return 'Coordenadas devem estar no formato "latitude,longitude" ou {"lat": number, "lng": number}';
  }
}

/**
 * Decorator para validação de coordenadas geográficas
 *
 * @example
 * ```typescript
 * class CreateRouteDto {
 *   @IsValidCoordinates()
 *   origin_coordinates: string;
 * }
 * ```
 */
export function IsValidCoordinates(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsValidCoordinatesConstraint,
    });
  };
}

/**
 * Validador para intervalo de tempo
 *
 * Verifica se um intervalo de tempo (início-fim) é válido
 */
@ValidatorConstraint({ name: 'isValidTimeRange', async: false })
export class IsValidTimeRangeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!value) {
      return true;
    }

    const timeRange = value as { startTime: string; endTime: string };
    const { startTime, endTime } = timeRange;
    if (!startTime || !endTime) {
      return false;
    }

    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    if (start === null || end === null) {
      return false;
    }

    return end > start;
  }

  private parseTime(time: string): number | null {
    const pattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    const match = pattern.exec(time);
    if (!match) {
      return null;
    }
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return hours * 60 + minutes;
  }

  defaultMessage(): string {
    return 'Horário de término deve ser posterior ao horário de início';
  }
}

/**
 * Decorator para validação de intervalo de tempo
 *
 * @example
 * ```typescript
 * class CreateRouteDto {
 *   @IsValidTimeRange()
 *   time_range: { startTime: string; endTime: string };
 * }
 * ```
 */
export function IsValidTimeRange(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsValidTimeRangeConstraint,
    });
  };
}

/**
 * Validador para ordem de sequência
 *
 * Verifica se a ordem de sequência é um número positivo
 */
@ValidatorConstraint({ name: 'isValidSequenceOrder', async: false })
export class IsValidSequenceOrderConstraint implements ValidatorConstraintInterface {
  validate(value: number): boolean {
    return Number.isInteger(value) && value > 0;
  }

  defaultMessage(): string {
    return 'Ordem de sequência deve ser um número inteiro positivo';
  }
}

/**
 * Decorator para validação de ordem de sequência
 *
 * @example
 * ```typescript
 * class CreateRouteStopDto {
 *   @IsValidSequenceOrder()
 *   sequence_order: number;
 * }
 * ```
 */
export function IsValidSequenceOrder(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsValidSequenceOrderConstraint,
    });
  };
}

/**
 * Validador para data planejada futura
 *
 * Verifica se a data planejada não é anterior à data atual
 */
@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) {
      return true;
    }

    const plannedDate = new Date(value);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Início do dia atual
    plannedDate.setHours(0, 0, 0, 0);

    return plannedDate >= now;
  }

  defaultMessage(): string {
    return 'Data planejada deve ser igual ou posterior à data atual';
  }
}

/**
 * Decorator para validação de data futura
 *
 * @example
 * ```typescript
 * class CreateRouteDto {
 *   @IsFutureDate()
 *   planned_date: string;
 * }
 * ```
 */
export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsFutureDateConstraint,
    });
  };
}
