import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { TrackingStatus, TrackingEventType } from '../enums';

/**
 * DTO de resposta para tracking
 */
export class TrackingResponseDto {
  @ApiProperty({
    description: 'ID único do registro de rastreamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'ID da entrega rastreada',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  delivery_id!: string;

  @ApiProperty({
    description: 'Status do rastreamento',
    enum: TrackingStatus,
    example: TrackingStatus.IN_TRANSIT,
  })
  status!: TrackingStatus;

  @ApiProperty({
    description: 'Tipo de evento',
    enum: TrackingEventType,
    example: TrackingEventType.LOCATION_UPDATE,
  })
  event_type!: TrackingEventType;

  @ApiPropertyOptional({
    description: 'Latitude da localização',
    example: -23.55052,
  })
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude da localização',
    example: -46.633308,
  })
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Endereço legível',
    example: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
  })
  location_address?: string;

  @ApiPropertyOptional({
    description: 'Cidade',
    example: 'São Paulo',
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'Estado (UF)',
    example: 'SP',
  })
  state?: string;

  @ApiPropertyOptional({
    description: 'Descrição do evento',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Nome do motorista',
    example: 'João Silva',
  })
  driver_name?: string;

  @ApiPropertyOptional({
    description: 'Placa do veículo',
    example: 'ABC-1D23',
  })
  vehicle_plate?: string;

  @ApiProperty({
    description: 'Data e hora do evento',
    example: '2024-12-09T14:30:00Z',
  })
  event_timestamp!: Date;

  @ApiPropertyOptional({
    description: 'Metadados adicionais',
  })
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'Indica se é entrega crítica',
    example: false,
  })
  is_critical!: boolean;

  @ApiPropertyOptional({
    description: 'Nome do hub',
    example: 'CD São Paulo - Zona Leste',
  })
  hub_name?: string;

  @ApiPropertyOptional({
    description: 'Número da tentativa de entrega',
    example: 1,
  })
  delivery_attempt?: number;

  @ApiPropertyOptional({
    description: 'Motivo de falha',
  })
  failure_reason?: string;

  @ApiPropertyOptional({
    description: 'Previsão de entrega',
    example: '2024-12-10T16:00:00Z',
  })
  estimated_delivery?: Date;

  @ApiPropertyOptional({
    description: 'Nome de quem recebeu',
    example: 'Maria Santos',
  })
  received_by?: string;

  @ApiPropertyOptional({
    description: 'URL da comprovação',
    example: 'https://storage.example.com/proof/abc123.jpg',
  })
  proof_url?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-12-09T10:00:00Z',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-12-09T10:00:00Z',
  })
  updated_at!: Date;

  @Exclude()
  deleted_at?: Date;
}
