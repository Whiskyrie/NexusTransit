import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsBoolean,
  IsObject,
  IsInt,
  Min,
  Length,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrackingStatus, TrackingEventType } from '../enums';

/**
 * DTO para criação de registro de rastreamento
 */
export class CreateTrackingDto {
  @ApiProperty({
    description: 'ID da entrega sendo rastreada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  delivery_id!: string;

  @ApiProperty({
    description: 'Status do rastreamento',
    enum: TrackingStatus,
    example: TrackingStatus.IN_TRANSIT,
  })
  @IsEnum(TrackingStatus)
  status!: TrackingStatus;

  @ApiProperty({
    description: 'Tipo de evento',
    enum: TrackingEventType,
    example: TrackingEventType.LOCATION_UPDATE,
  })
  @IsEnum(TrackingEventType)
  event_type!: TrackingEventType;

  @ApiPropertyOptional({
    description: 'Latitude da localização',
    example: -23.55052,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude da localização',
    example: -46.633308,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Endereço legível da localização',
    example: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(5, 500)
  location_address?: string;

  @ApiPropertyOptional({
    description: 'Cidade',
    example: 'São Paulo',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
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
  state?: string;

  @ApiPropertyOptional({
    description: 'Descrição ou observações do evento',
    example: 'Pacote em trânsito para o centro de distribuição',
  })
  @IsOptional()
  @IsString()
  @Length(5, 1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Nome do motorista responsável',
    example: 'João Silva',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(3, 200)
  driver_name?: string;

  @ApiPropertyOptional({
    description: 'Placa do veículo',
    example: 'ABC-1D23',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(7, 100)
  vehicle_plate?: string;

  @ApiPropertyOptional({
    description: 'Data e hora do evento',
    example: '2024-12-09T14:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  event_timestamp?: string;

  @ApiPropertyOptional({
    description: 'Metadados adicionais do evento',
    example: { temperature: 22, humidity: 65 },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Indica se é uma entrega crítica',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_critical?: boolean;

  @ApiPropertyOptional({
    description: 'Nome do hub ou centro de distribuição',
    example: 'CD São Paulo - Zona Leste',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(3, 200)
  hub_name?: string;

  @ApiPropertyOptional({
    description: 'Número da tentativa de entrega',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  delivery_attempt?: number;

  @ApiPropertyOptional({
    description: 'Motivo de falha ou atraso',
    example: 'Destinatário ausente',
  })
  @IsOptional()
  @IsString()
  @Length(5, 500)
  failure_reason?: string;

  @ApiPropertyOptional({
    description: 'Nova previsão de entrega',
    example: '2024-12-10T16:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  estimated_delivery?: string;

  @ApiPropertyOptional({
    description: 'Nome de quem recebeu a entrega',
    example: 'Maria Santos',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  received_by?: string;

  @ApiPropertyOptional({
    description: 'URL da foto/assinatura de comprovação',
    example: 'https://storage.example.com/proof/abc123.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(10, 500)
  proof_url?: string;
}
