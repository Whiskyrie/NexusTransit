import { IsOptional, IsEnum, IsDateString, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../enums/event-type.enum';
import { EventStatus } from '../enums/event-status.enum';

/**
 * DTO base para filtros com paginação
 */
export class BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Termo de busca',
    example: 'São Paulo',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * DTO para filtros de eventos de rastreamento
 */
export class TrackingEventFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID da entrega',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  delivery_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID da rota',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  route_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de evento',
    enum: EventType,
    example: EventType.IN_TRANSIT,
  })
  @IsOptional()
  @IsEnum(EventType)
  event_type?: EventType;

  @ApiPropertyOptional({
    description: 'Filtrar por status do evento',
    enum: EventStatus,
    example: EventStatus.SUCCESS,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  event_status?: EventStatus;

  @ApiPropertyOptional({
    description: 'Data de início (timestamp)',
    example: '2025-12-01T00:00:00Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Data de fim (timestamp)',
    example: '2025-12-31T23:59:59Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Filtrar apenas eventos automáticos',
    example: true,
  })
  @IsOptional()
  is_automatic?: boolean;
}
