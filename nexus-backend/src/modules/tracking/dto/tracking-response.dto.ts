import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

/**
 * DTO de resposta simplificado para entrega
 */
class DeliveryInfoDto {
  @ApiProperty({
    description: 'ID da entrega',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Código de rastreamento',
    example: 'NTR-20240115-001',
  })
  @Expose()
  tracking_code!: string;

  @ApiProperty({
    description: 'Status da entrega',
    example: 'IN_TRANSIT',
  })
  @Expose()
  status!: string;
}

/**
 * DTO de resposta simplificado para veículo
 */
class VehicleInfoDto {
  @ApiProperty({
    description: 'ID do veículo',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Placa do veículo',
    example: 'ABC1234',
  })
  @Expose()
  license_plate!: string;

  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'Toyota Corolla',
  })
  @Expose()
  model!: string;
}

/**
 * DTO de resposta simplificado para motorista
 */
class DriverInfoDto {
  @ApiProperty({
    description: 'ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Nome do motorista',
    example: 'João Silva',
  })
  @Expose()
  full_name!: string;
}

/**
 * DTO de resposta para metadados de rastreamento
 */
class TrackingMetadataResponseDto {
  @ApiPropertyOptional({
    description: 'Informações climáticas',
    example: { temperature: 25, conditions: 'Ensolarado' },
  })
  @Expose()
  weather?: {
    temperature?: number;
    conditions?: string;
  };

  @ApiPropertyOptional({
    description: 'Informações de tráfego',
    example: { level: 'moderate', incidents: [] },
  })
  @Expose()
  traffic?: {
    level?: string;
    incidents?: string[];
  };

  @ApiPropertyOptional({
    description: 'Informações de geofencing',
  })
  @Expose()
  geofence?: {
    zone_id?: string;
    zone_name?: string;
    entry_exit?: 'entry' | 'exit';
  };

  @ApiPropertyOptional({
    description: 'Dados de sensores',
  })
  @Expose()
  sensors?: {
    temperature?: number;
    humidity?: number;
    pressure?: number;
  };

  @ApiPropertyOptional({
    description: 'Dados customizados',
  })
  @Expose()
  custom?: Record<string, any>;
}

/**
 * DTO de resposta para registro de rastreamento
 */
export class TrackingResponseDto {
  @ApiProperty({
    description: 'ID único do registro',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiPropertyOptional({
    description: 'Informações da entrega',
    type: DeliveryInfoDto,
  })
  @Expose()
  @Type(() => DeliveryInfoDto)
  delivery?: DeliveryInfoDto;

  @ApiPropertyOptional({
    description: 'Informações do veículo',
    type: VehicleInfoDto,
  })
  @Expose()
  @Type(() => VehicleInfoDto)
  vehicle?: VehicleInfoDto;

  @ApiPropertyOptional({
    description: 'Informações do motorista',
    type: DriverInfoDto,
  })
  @Expose()
  @Type(() => DriverInfoDto)
  driver?: DriverInfoDto;

  @ApiProperty({
    description: 'Latitude da posição',
    example: -23.55052,
  })
  @Expose()
  latitude!: number;

  @ApiProperty({
    description: 'Longitude da posição',
    example: -46.633308,
  })
  @Expose()
  longitude!: number;

  @ApiPropertyOptional({
    description: 'Altitude em metros',
    example: 760.5,
  })
  @Expose()
  altitude?: number;

  @ApiPropertyOptional({
    description: 'Precisão da localização em metros',
    example: 10.5,
  })
  @Expose()
  accuracy?: number;

  @ApiPropertyOptional({
    description: 'Velocidade em km/h',
    example: 60.5,
  })
  @Expose()
  speed?: number;

  @ApiPropertyOptional({
    description: 'Direção em graus',
    example: 180,
  })
  @Expose()
  heading?: number;

  @ApiPropertyOptional({
    description: 'Distância desde o último ponto (em km)',
    example: 1.5,
  })
  @Expose()
  distance_from_previous?: number;

  @ApiPropertyOptional({
    description: 'Tempo desde o último ponto (em segundos)',
    example: 120,
  })
  @Expose()
  time_from_previous?: number;

  @ApiPropertyOptional({
    description: 'ID do dispositivo',
    example: 'GPS-001',
  })
  @Expose()
  device_id?: string;

  @ApiPropertyOptional({
    description: 'Tipo do dispositivo',
    example: 'Mobile',
  })
  @Expose()
  device_type?: string;

  @ApiPropertyOptional({
    description: 'Nível de bateria (0-100)',
    example: 85,
  })
  @Expose()
  battery_level?: number;

  @ApiPropertyOptional({
    description: 'Intensidade do sinal GPS (0-100)',
    example: 90,
  })
  @Expose()
  signal_strength?: number;

  @ApiProperty({
    description: 'Data/hora da captura',
    example: '2024-01-15T14:30:00Z',
  })
  @Expose()
  recorded_at!: Date;

  @ApiPropertyOptional({
    description: 'Tipo de evento',
    example: 'inicio_rota',
  })
  @Expose()
  event_type?: string;

  @ApiPropertyOptional({
    description: 'Notas sobre o ponto',
    example: 'Parada para abastecimento',
  })
  @Expose()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Endereço',
    example: 'Av. Paulista, 1000',
  })
  @Expose()
  address?: string;

  @ApiPropertyOptional({
    description: 'Cidade',
    example: 'São Paulo',
  })
  @Expose()
  city?: string;

  @ApiPropertyOptional({
    description: 'Estado (UF)',
    example: 'SP',
  })
  @Expose()
  state?: string;

  @ApiPropertyOptional({
    description: 'País',
    example: 'Brasil',
  })
  @Expose()
  country?: string;

  @ApiPropertyOptional({
    description: 'CEP',
    example: '01310-100',
  })
  @Expose()
  postal_code?: string;

  @ApiPropertyOptional({
    description: 'Metadados adicionais',
    type: TrackingMetadataResponseDto,
  })
  @Expose()
  @Type(() => TrackingMetadataResponseDto)
  metadata?: TrackingMetadataResponseDto;

  @ApiProperty({
    description: 'Indica se o ponto é válido',
    example: true,
  })
  @Expose()
  is_valid!: boolean;

  @ApiProperty({
    description: 'Indica se é um ponto de parada',
    example: false,
  })
  @Expose()
  is_stop!: boolean;

  @ApiPropertyOptional({
    description: 'Duração da parada em minutos',
    example: 15,
  })
  @Expose()
  stop_duration?: number;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2024-01-15T14:30:00Z',
  })
  @Expose()
  created_at!: Date;

  @ApiProperty({
    description: 'Data de atualização do registro',
    example: '2024-01-15T14:30:00Z',
  })
  @Expose()
  updated_at!: Date;

  @Exclude()
  deleted_at?: Date;
}
