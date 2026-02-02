import { IsOptional, IsEnum, IsDateString, IsUUID, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseFilterDto } from '@nexus/common';
import { TrackingStatus, TrackingEventType } from '../enums';

/**
 * DTO para filtros de rastreamento
 */
export class TrackingFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID da entrega',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  delivery_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: TrackingStatus,
  })
  @IsOptional()
  @IsEnum(TrackingStatus)
  status?: TrackingStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de evento',
    enum: TrackingEventType,
  })
  @IsOptional()
  @IsEnum(TrackingEventType)
  event_type?: TrackingEventType;

  @ApiPropertyOptional({
    description: 'Filtrar por cidade',
    example: 'São Paulo',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado (UF)',
    example: 'SP',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;

  @ApiPropertyOptional({
    description: 'Data inicial do evento',
    example: '2024-12-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  event_from?: string;

  @ApiPropertyOptional({
    description: 'Data final do evento',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  event_to?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por nome do hub',
    example: 'CD São Paulo',
  })
  @IsOptional()
  @IsString()
  hub_name?: string;

  @ApiPropertyOptional({
    description: 'Filtrar apenas entregas críticas',
    example: true,
  })
  @IsOptional()
  is_critical?: boolean;
}
