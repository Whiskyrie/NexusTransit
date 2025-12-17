import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityType } from '../enums/availability-type.enum';

/**
 * DTO para criação de registro de disponibilidade/ausência de motorista
 */
export class CreateDriverAvailabilityDto {
  @ApiProperty({
    description: 'ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  driver_id!: string;

  @ApiProperty({
    description: 'Tipo de disponibilidade/ausência',
    enum: AvailabilityType,
    example: AvailabilityType.VACATION,
    enumName: 'AvailabilityType',
  })
  @IsEnum(AvailabilityType, {
    message: 'Tipo de disponibilidade inválido',
  })
  availability_type!: AvailabilityType;

  @ApiProperty({
    description: 'Data de início do período (YYYY-MM-DD)',
    example: '2024-01-01',
    type: 'string',
    format: 'date',
  })
  @IsDateString(
    {},
    {
      message: 'Data de início deve estar no formato YYYY-MM-DD',
    },
  )
  start_date!: string;

  @ApiProperty({
    description: 'Data de término do período (YYYY-MM-DD)',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString(
    {},
    {
      message: 'Data de término deve estar no formato YYYY-MM-DD',
    },
  )
  end_date!: string;

  @ApiPropertyOptional({
    description: 'Motivo da indisponibilidade',
    example: 'Férias anuais programadas',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'Motivo não pode ter mais de 500 caracteres',
  })
  @ValidateIf(
    (o: CreateDriverAvailabilityDto) => o.availability_type !== AvailabilityType.AVAILABLE,
  )
  reason?: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    example: 'Motorista solicitou período com antecedência',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
