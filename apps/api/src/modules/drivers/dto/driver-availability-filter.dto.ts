import { IsOptional, IsEnum, IsDateString, IsUUID, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityType } from '../enums/availability-type.enum';
import { BaseFilterDto } from '@nexus/common';

/**
 * DTO para filtrar registros de disponibilidade de motoristas
 */
export class DriverAvailabilityFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de disponibilidade',
    enum: AvailabilityType,
    example: AvailabilityType.VACATION,
  })
  @IsOptional()
  @IsEnum(AvailabilityType)
  availability_type?: AvailabilityType;

  @ApiPropertyOptional({
    description: 'Filtrar por data de início (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por data de término (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Filtrar apenas registros ativos',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar apenas registros aprovados',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_approved?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar registros que estão ativos em uma data específica (YYYY-MM-DD)',
    example: '2024-01-10',
  })
  @IsOptional()
  @IsDateString()
  active_on_date?: string;
}
