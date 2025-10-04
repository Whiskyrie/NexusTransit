import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validador customizado para placas brasileiras
 *
 * Suporta os formatos:
 * - Formato antigo: AAA-0000 ou AAA0000
 * - Formato Mercosul: AAA0A00
 *
 * Baseado na Resolução 780/2019 do CONTRAN
 */
@ValidatorConstraint({ name: 'isLicensePlate', async: false })
export class IsLicensePlateConstraint implements ValidatorConstraintInterface {
  validate(plate: string): boolean {
    if (!plate) {
      return false;
    }

    // Remove espaços, hífens e converte para maiúsculas
    const cleanPlate = plate.replace(/[\s-]/g, '').toUpperCase();

    // Deve ter exatamente 7 caracteres
    if (cleanPlate.length !== 7) {
      return false;
    }

    // Padrão unificado brasileiro (Resolução 780/2019 CONTRAN)
    // Suporta tanto formato antigo (AAA0000) quanto Mercosul (AAA0A00)
    // Pattern: [A-Z]{3}[0-9][0-9A-Z][0-9]{2}
    const brazilianPlatePattern = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/;

    return brazilianPlatePattern.test(cleanPlate);
  }

  defaultMessage(): string {
    return 'Placa deve estar no formato brasileiro válido (AAA-0000 ou AAA0A00)';
  }
}

/**
 * Decorator para validação de placas brasileiras
 *
 * @example
 * ```typescript
 * class CreateVehicleDto {
 *   @IsLicensePlate()
 *   license_plate: string;
 * }
 * ```
 */
export function IsLicensePlate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsLicensePlateConstraint,
    });
  };
}

/**
 * Utilitário para normalizar placas brasileiras
 * Remove espaços, hífens e converte para maiúsculas
 *
 * @param plate - Placa a ser normalizada
 * @returns Placa normalizada
 */
export function normalizeLicensePlate(plate: string): string {
  if (!plate) {
    return '';
  }
  return plate.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Utilitário para formatar placa brasileira
 * Adiciona hífen no formato AAA-0000
 *
 * @param plate - Placa a ser formatada
 * @returns Placa formatada com hífen
 */
export function formatLicensePlate(plate: string): string {
  const normalized = normalizeLicensePlate(plate);
  if (normalized.length !== 7) {
    return plate;
  }

  return `${normalized.substring(0, 3)}-${normalized.substring(3)}`;
}

/**
 * Verifica se a placa está no formato Mercosul
 *
 * @param plate - Placa a ser verificada
 * @returns true se for formato Mercosul
 */
export function isMercosulPlate(plate: string): boolean {
  const normalized = normalizeLicensePlate(plate);

  // Formato Mercosul: AAA0A00 (quarto caractere é número, quinto é letra)
  const mercosulPattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  return mercosulPattern.test(normalized);
}

/**
 * Verifica se a placa está no formato antigo
 *
 * @param plate - Placa a ser verificada
 * @returns true se for formato antigo
 */
export function isOldFormatPlate(plate: string): boolean {
  const normalized = normalizeLicensePlate(plate);

  // Formato antigo: AAA0000 (todos os 4 últimos caracteres são números)
  const oldFormatPattern = /^[A-Z]{3}[0-9]{4}$/;
  return oldFormatPattern.test(normalized);
}
