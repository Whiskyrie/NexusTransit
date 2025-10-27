import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsUUID,
  IsObject,
  Min,
  Max,
  Length,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

/**
 * DTO para criação de metadados de rastreamento
 */
class TrackingMetadataDto {
  @ApiPropertyOptional({
    description: 'Informações climáticas',
    example: { temperature: 25, conditions: 'Ensolarado' },
  })
  @IsOptional()
  @IsObject()
  weather?: {
    temperature?: number;
    conditions?: string;
  };

  @ApiPropertyOptional({
    description: 'Informações de tráfego',
    example: { level: 'moderate', incidents: ['Acidente na via'] },
  })
  @IsOptional()
  @IsObject()
  traffic?: {
    level?: string;
    incidents?: string[];
  };

  @ApiPropertyOptional({
    description: 'Informações de geofencing',
    example: { zone_id: 'zone-01', zone_name: 'Centro', entry_exit: 'entry' },
  })
  @IsOptional()
  @IsObject()
  geofence?: {
    zone_id?: string;
    zone_name?: string;
    entry_exit?: 'entry' | 'exit';
  };

  @ApiPropertyOptional({
    description: 'Dados de sensores',
    example: { temperature: 22, humidity: 60, pressure: 1013 },
  })
  @IsOptional()
  @IsObject()
  sensors?: {
    temperature?: number;
    humidity?: number;
    pressure?: number;
  };

  @ApiPropertyOptional({
    description: 'Dados customizados adicionais',
    example: { custom_field: 'value' },
  })
  @IsOptional()
  @IsObject()
  custom?: Record<string, any>;
}

/**
 * DTO para criação de registro de rastreamento
 */
export class CreateTrackingDto {
  @ApiPropertyOptional({
    description: 'ID da entrega sendo rastreada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  delivery_id?: string;

  @ApiPropertyOptional({
    description: 'ID do veículo sendo rastreado',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiPropertyOptional({
    description: 'ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiProperty({
    description: 'Latitude da posição (-90 a 90)',
    example: -23.55052,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({
    description: 'Longitude da posição (-180 a 180)',
    example: -46.633308,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({
    description: 'Altitude em metros',
    example: 760.5,
    minimum: -500,
    maximum: 9000,
  })
  @IsOptional()
  @IsNumber()
  @Min(-500)
  @Max(9000)
  altitude?: number;

  @ApiPropertyOptional({
    description: 'Precisão da localização em metros',
    example: 10.5,
    minimum: 0,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
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
    description: 'Direção em graus (0-360)',
    example: 180,
    minimum: 0,
    maximum: 360,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({
    description: 'Distância percorrida desde o último ponto (em km)',
    example: 1.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distance_from_previous?: number;

  @ApiPropertyOptional({
    description: 'Tempo decorrido desde o último ponto (em segundos)',
    example: 120,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  time_from_previous?: number;

  @ApiPropertyOptional({
    description: 'Identificador do dispositivo GPS',
    example: 'GPS-001',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  device_id?: string;

  @ApiPropertyOptional({
    description: 'Tipo de dispositivo',
    example: 'Mobile',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  device_type?: string;

  @ApiPropertyOptional({
    description: 'Nível de bateria do dispositivo (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  battery_level?: number;

  @ApiPropertyOptional({
    description: 'Intensidade do sinal GPS (0-100)',
    example: 90,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  signal_strength?: number;

  @ApiProperty({
    description: 'Data/hora exata da captura da localização',
    example: '2024-01-15T14:30:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  recorded_at!: Date;

  @ApiPropertyOptional({
    description: 'Evento que gerou o registro',
    example: 'inicio_rota',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  event_type?: string;

  @ApiPropertyOptional({
    description: 'Notas ou observações sobre o ponto',
    example: 'Parada para abastecimento',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Endereço aproximado da localização',
    example: 'Av. Paulista, 1000',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  address?: string;

  @ApiPropertyOptional({
    description: 'Cidade',
    example: 'São Paulo',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Estado (UF)',
    example: 'SP',
    minLength: 2,
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  state?: string;

  @ApiPropertyOptional({
    description: 'País',
    example: 'Brasil',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  country?: string;

  @ApiPropertyOptional({
    description: 'CEP',
    example: '01310-100',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  postal_code?: string;

  @ApiPropertyOptional({
    description: 'Dados adicionais específicos do contexto',
    type: TrackingMetadataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TrackingMetadataDto)
  metadata?: TrackingMetadataDto;

  @ApiPropertyOptional({
    description: 'Indica se o ponto é válido',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_valid?: boolean = true;

  @ApiPropertyOptional({
    description: 'Indica se houve uma parada neste ponto',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_stop?: boolean = false;

  @ApiPropertyOptional({
    description: 'Duração da parada em minutos',
    example: 15,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  stop_duration?: number;
}
