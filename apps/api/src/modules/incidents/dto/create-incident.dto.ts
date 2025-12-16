import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsLatitude,
  IsLongitude,
  Length,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Severidade do incidente
 */
export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Status do incidente
 */
export enum IncidentStatus {
  REPORTED = 'REPORTED',
  INVESTIGATING = 'INVESTIGATING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

/**
 * Tipo de incidente
 */
export enum IncidentType {
  ACCIDENT = 'ACCIDENT',
  BREAKDOWN = 'BREAKDOWN',
  DELAY = 'DELAY',
  THEFT = 'THEFT',
  DAMAGE = 'DAMAGE',
  TRAFFIC = 'TRAFFIC',
  WEATHER = 'WEATHER',
  OTHER = 'OTHER',
}

/**
 * DTO para criação de incidente
 */
export class CreateIncidentDto {
  @ApiProperty({
    description: 'Tipo do incidente',
    enum: IncidentType,
    example: IncidentType.DELAY,
  })
  @IsEnum(IncidentType)
  @IsNotEmpty()
  type!: IncidentType;

  @ApiProperty({
    description: 'Severidade do incidente',
    enum: IncidentSeverity,
    example: IncidentSeverity.MEDIUM,
  })
  @IsEnum(IncidentSeverity)
  @IsNotEmpty()
  severity!: IncidentSeverity;

  @ApiProperty({
    description: 'Título breve do incidente',
    example: 'Atraso devido a acidente na rodovia',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 200)
  title!: string;

  @ApiProperty({
    description: 'Descrição detalhada do incidente',
    example: 'Acidente na altura do km 45 causando congestionamento de 3km',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 2000)
  description!: string;

  @ApiPropertyOptional({
    description: 'ID da entrega relacionada ao incidente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  delivery_id?: string;

  @ApiPropertyOptional({
    description: 'ID do veículo envolvido no incidente',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiPropertyOptional({
    description: 'ID do motorista envolvido no incidente',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiPropertyOptional({
    description: 'ID da rota afetada pelo incidente',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsOptional()
  @IsUUID()
  route_id?: string;

  @ApiPropertyOptional({
    description: 'Localização do incidente',
    example: 'Rodovia SP-348, Km 45',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional({
    description: 'Latitude do incidente',
    example: -23.5505,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude do incidente',
    example: -46.6333,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Data e hora do incidente',
    example: '2024-12-16T14:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  incident_date?: string;

  @ApiPropertyOptional({
    description: 'Usuário que reportou o incidente',
    example: 'motorista@nexustransit.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reported_by?: string;

  @ApiPropertyOptional({
    description: 'Metadados adicionais do incidente',
    example: { weather: 'chuva forte', traffic_jam: '3km', estimated_delay: '45min' },
  })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
