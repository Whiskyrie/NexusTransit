import { PartialType } from '@nestjs/swagger';
import { CreateDriverAvailabilityDto } from './create-driver-availability.dto';
import { OmitType } from '@nestjs/swagger';

/**
 * DTO para atualização de registro de disponibilidade/ausência de motorista
 *
 * Todos os campos são opcionais, exceto driver_id que não pode ser alterado
 */
export class UpdateDriverAvailabilityDto extends PartialType(
  OmitType(CreateDriverAvailabilityDto, ['driver_id'] as const),
) {}
