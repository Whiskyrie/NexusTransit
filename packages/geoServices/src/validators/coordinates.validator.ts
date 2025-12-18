import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

@ValidatorConstraint({ name: "isValidCoordinates", async: false })
export class IsValidCoordinatesConstraint implements ValidatorConstraintInterface {
  validate(coordinates: unknown): boolean {
    if (!coordinates || typeof coordinates !== "object") {
      return false;
    }

    const coords = coordinates as Record<string, unknown>;

    // Verifica se lat e lng existem
    if (!("lat" in coords) || !("lng" in coords)) {
      return false;
    }

    const { lat, lng } = coords;

    // Verifica se são números
    if (typeof lat !== "number" || typeof lng !== "number") {
      return false;
    }

    // Verifica se são números válidos (não NaN ou Infinity)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return false;
    }

    // Verifica se estão dentro dos limites válidos
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  defaultMessage(_args: ValidationArguments): string {
    return "Coordenadas inválidas. Deve ser um objeto com lat e lng dentro dos limites válidos.";
  }
}

export function IsValidCoordinates(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCoordinatesConstraint,
    });
  };
}

export function validateCoordinates(lat: number, lng: number): boolean {
  // Verifica se são números válidos (não NaN ou Infinity)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
