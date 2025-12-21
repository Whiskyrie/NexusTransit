import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDriverAvailabilityDto } from './create-driver-availability.dto';

/**
 * DTO para atualização de registro de disponibilidade/ausência de motorista
 *
 * Todos os campos são opcionais, exceto driver_id que não pode ser alterado
 */
export class UpdateDriverAvailabilityDto extends PartialType(
  OmitType(CreateDriverAvailabilityDto, ['driver_id'] as const),
) {}
