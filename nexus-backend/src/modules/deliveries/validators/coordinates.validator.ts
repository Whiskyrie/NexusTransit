import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Interface para coordenadas geográficas
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Validador customizado para coordenadas geográficas
 *
 * Valida:
 * - Latitude: -90 a 90
 * - Longitude: -180 a 180
 * - Precisão adequada para geolocalização
 *
 * @example
 * { latitude: -23.5505, longitude: -46.6333 } // São Paulo
 * { latitude: -22.9068, longitude: -43.1729 } // Rio de Janeiro
 */
@ValidatorConstraint({ name: 'isValidCoordinates', async: false })
export class IsValidCoordinatesConstraint implements ValidatorConstraintInterface {
  private static readonly MIN_LATITUDE = -90;
  private static readonly MAX_LATITUDE = 90;
  private static readonly MIN_LONGITUDE = -180;
  private static readonly MAX_LONGITUDE = 180;

  validate(coords: unknown): boolean {
    if (!coords || typeof coords !== 'object') {
      return false;
    }

    const coordinates = coords as Partial<Coordinates>;

    // Verifica se tem as propriedades necessárias
    if (typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
      return false;
    }

    // Valida latitude
    if (
      coordinates.latitude < IsValidCoordinatesConstraint.MIN_LATITUDE ||
      coordinates.latitude > IsValidCoordinatesConstraint.MAX_LATITUDE
    ) {
      return false;
    }

    // Valida longitude
    if (
      coordinates.longitude < IsValidCoordinatesConstraint.MIN_LONGITUDE ||
      coordinates.longitude > IsValidCoordinatesConstraint.MAX_LONGITUDE
    ) {
      return false;
    }

    // Valida que não sejam exatamente 0,0 (null island)
    if (coordinates.latitude === 0 && coordinates.longitude === 0) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Coordenadas inválidas. Latitude deve estar entre -90 e 90, longitude entre -180 e 180';
  }
}

/**
 * Decorator para validação de coordenadas geográficas
 *
 * @example
 * ```typescript
 * class LocationDto {
 *   @IsValidCoordinates()
 *   coordinates: Coordinates;
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
 * Valida apenas latitude
 *
 * @param latitude - Latitude a ser validada
 * @returns true se válida
 */
export function isValidLatitude(latitude: number): boolean {
  return latitude >= -90 && latitude <= 90;
}

/**
 * Valida apenas longitude
 *
 * @param longitude - Longitude a ser validada
 * @returns true se válida
 */
export function isValidLongitude(longitude: number): boolean {
  return longitude >= -180 && longitude <= 180;
}

/**
 * Normaliza coordenadas para precisão adequada (6 casas decimais ~0.1m)
 *
 * @param coords - Coordenadas a serem normalizadas
 * @returns Coordenadas com precisão normalizada
 */
export function normalizeCoordinates(coords: Coordinates): Coordinates {
  return {
    latitude: Number(coords.latitude.toFixed(6)),
    longitude: Number(coords.longitude.toFixed(6)),
  };
}

/**
 * Valida se coordenadas estão dentro do Brasil
 * Brasil aproximadamente: lat -33.75 a 5.27, lon -73.99 a -28.84
 *
 * @param coords - Coordenadas a serem verificadas
 * @returns true se estão dentro do Brasil (aproximadamente)
 */
export function isWithinBrazil(coords: Coordinates): boolean {
  const BRAZIL_BOUNDS = {
    minLat: -33.75,
    maxLat: 5.27,
    minLon: -73.99,
    maxLon: -28.84,
  };

  return (
    coords.latitude >= BRAZIL_BOUNDS.minLat &&
    coords.latitude <= BRAZIL_BOUNDS.maxLat &&
    coords.longitude >= BRAZIL_BOUNDS.minLon &&
    coords.longitude <= BRAZIL_BOUNDS.maxLon
  );
}

/**
 * Formata coordenadas para exibição
 *
 * @param coords - Coordenadas a serem formatadas
 * @returns String formatada (ex: "-23.5505, -46.6333")
 */
export function formatCoordinates(coords: Coordinates): string {
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}
