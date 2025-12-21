import { IsOptional, IsEnum, IsDateString, IsUUID, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseFilterDto } from '@nexus/common';
import { IncidentType, IncidentSeverity, IncidentStatus } from '../enums/incident.enums';

export class IncidentFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de incidente',
    enum: IncidentType,
  })
  @IsOptional()
  @IsEnum(IncidentType)
  incident_type?: IncidentType;

  @ApiPropertyOptional({
    description: 'Filtrar por severidade',
    enum: IncidentSeverity,
  })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: IncidentStatus,
  })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por ID da entrega',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  delivery_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do veículo',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID da rota',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsOptional()
  @IsUUID()
  route_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por usuário que reportou',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  @IsOptional()
  @IsUUID()
  reported_by_user_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por usuário responsável',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @IsOptional()
  @IsUUID()
  assigned_to_user_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por data de início',
    example: '2024-12-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por data de fim',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por impacto em entregas',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  impact_on_delivery?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por necessidade de seguro',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  requires_insurance?: boolean;
}
