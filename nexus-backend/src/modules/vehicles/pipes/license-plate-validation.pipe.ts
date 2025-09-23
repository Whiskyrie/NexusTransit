import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import {
  IsLicensePlateConstraint,
  normalizeLicensePlate,
} from '../validators/license-plate.validator';

/**
 * Pipe para validação e normalização de placa de veículo brasileira
 *
 * Suporta:
 * - Formato antigo: AAA-9999
 * - Formato Mercosul: AAA9A99
 *
 * Exemplo de uso:
 * ```typescript
 * @Post('vehicles')
 * createVehicle(@Body('license_plate', LicensePlateValidationPipe) licensePlate: string) {
 *   // licensePlate já validado e normalizado
 * }
 * ```
 */
@Injectable()
export class LicensePlateValidationPipe implements PipeTransform<string, string> {
  private readonly validator = new IsLicensePlateConstraint();

  transform(value: string): string {
    if (!value) {
      throw new BadRequestException('Placa do veículo é obrigatória');
    }

    // Normalizar a placa (remover espaços, hífens extras, etc.)
    const normalizedPlate = normalizeLicensePlate(value);

    // Validar formato
    if (!this.validator.validate(normalizedPlate)) {
      throw new BadRequestException(
        'Placa de veículo deve estar no formato brasileiro (AAA-9999 ou AAA9A99)',
      );
    }

    return normalizedPlate;
  }
}
