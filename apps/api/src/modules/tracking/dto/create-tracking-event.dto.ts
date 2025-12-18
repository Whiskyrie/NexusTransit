import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsDateString,
  ValidateNested,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EventType } from '../enums/event-type.enum';
import { EventStatus } from '../enums/event-status.enum';

/**
 * DTO para coordenadas geográficas
 */
export class LocationDto {
  @ApiProperty({
    description: 'Latitude',
    example: -23.5505,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({
    description: 'Longitude',
    example: -46.6333,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

/**
 * DTO para criação de evento de rastreamento
 */
export class CreateTrackingEventDto {
  @ApiProperty({
    description: 'ID da entrega',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  delivery_id!: string;

  @ApiPropertyOptional({
    description: 'ID da rota',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  route_id?: string;

  @ApiProperty({
    description: 'ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  driver_id!: string;

  @ApiProperty({
    description: 'Tipo do evento',
    enum: EventType,
    example: EventType.IN_TRANSIT,
  })
  @IsEnum(EventType)
  @IsNotEmpty()
  event_type!: EventType;

  @ApiProperty({
    description: 'Status do evento',
    enum: EventStatus,
    example: EventStatus.SUCCESS,
  })
  @IsEnum(EventStatus)
  @IsNotEmpty()
  event_status!: EventStatus;

  @ApiProperty({
    description: 'Data/hora do evento',
    example: '2025-12-17T10:30:00Z',
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  timestamp!: string;

  @ApiPropertyOptional({
    description: 'Coordenadas geográficas',
    type: LocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({
    description: 'Endereço formatado',
    example: 'Rua Exemplo, 123, São Paulo, SP',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  location_address?: string;

  @ApiPropertyOptional({
    description: 'Precisão do GPS em metros',
    example: 15.5,
    minimum: 0,
    maximum: 10000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  accuracy?: number;

  @ApiPropertyOptional({
    description: 'Velocidade em km/h',
    example: 60.5,
    minimum: 0,
    maximum: 300,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  speed?: number;

  @ApiPropertyOptional({
    description: 'Nível de bateria do dispositivo (0-100)',
    example: 85.0,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  battery_level?: number;

  @ApiPropertyOptional({
    description: 'Observações do evento',
    example: 'Trânsito intenso na região',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Metadados adicionais',
    example: { temperature: 25, humidity: 60 },
  })
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'Evento automático vs manual',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  is_automatic!: boolean;

  @ApiPropertyOptional({
    description: 'ID do usuário que criou evento manual',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  created_by_user_id?: string;
}
