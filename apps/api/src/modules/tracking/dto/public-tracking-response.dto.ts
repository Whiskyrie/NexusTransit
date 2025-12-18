import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../enums/event-type.enum';
import { EventStatus } from '../enums/event-status.enum';
import {
  PublicAddress,
  CurrentLocation,
  LocationPoint,
  RoutePoint,
} from '../interfaces/public-tracking.interface';

/**
 * DTO de resposta pública para rastreamento (sem autenticação)
 *
 * Contém apenas informações públicas sobre o rastreamento
 */
export class PublicTrackingResponseDto {
  @ApiProperty({
    description: 'Código de rastreamento',
    example: 'NXS202412180001',
  })
  tracking_code!: string;

  @ApiProperty({
    description: 'Status atual da entrega',
    example: 'IN_TRANSIT',
  })
  current_status!: string;

  @ApiProperty({
    description: 'Descrição da entrega',
    example: 'Pacote eletrônicos',
  })
  description!: string;

  @ApiProperty({
    description: 'Data de criação da entrega',
    example: '2025-12-18T10:00:00Z',
  })
  created_at!: Date;

  @ApiPropertyOptional({
    description: 'Previsão de entrega',
    example: '2025-12-20T18:00:00Z',
  })
  estimated_delivery_at?: Date;

  @ApiPropertyOptional({
    description: 'Data da última atualização',
    example: '2025-12-18T14:30:00Z',
  })
  last_update?: Date;

  @ApiProperty({
    description: 'Endereço de origem',
    example: {
      address: 'Rua A, 123',
      city: 'São Paulo',
      state: 'SP',
      postal_code: '01234-567',
    },
  })
  origin!: PublicAddress;

  @ApiProperty({
    description: 'Endereço de destino',
    example: {
      address: 'Rua B, 456',
      city: 'São Paulo',
      state: 'SP',
      postal_code: '01234-567',
    },
  })
  destination!: PublicAddress;

  @ApiProperty({
    description: 'Timeline de eventos',
    type: 'array',
  })
  timeline!: PublicTrackingEventDto[];
}

/**
 * DTO para evento de rastreamento público
 */
export class PublicTrackingEventDto {
  @ApiProperty({
    description: 'Tipo do evento',
    enum: EventType,
    example: EventType.IN_TRANSIT,
  })
  event_type!: EventType;

  @ApiProperty({
    description: 'Status do evento',
    enum: EventStatus,
    example: EventStatus.SUCCESS,
  })
  event_status!: EventStatus;

  @ApiProperty({
    description: 'Data/hora do evento',
    example: '2025-12-18T10:30:00Z',
  })
  timestamp!: Date;

  @ApiPropertyOptional({
    description: 'Localização do evento',
    example: 'São Paulo, SP',
  })
  location?: string;

  @ApiPropertyOptional({
    description: 'Observações do evento',
    example: 'Pacote saiu para entrega',
  })
  notes?: string;
}

/**
 * DTO para resposta de timeline visual
 */
export class PublicTrackingTimelineDto {
  @ApiProperty({
    description: 'Código de rastreamento',
    example: 'NXS202412180001',
  })
  tracking_code!: string;

  @ApiProperty({
    description: 'Status atual',
    example: 'IN_TRANSIT',
  })
  current_status!: string;

  @ApiProperty({
    description: 'Eventos da timeline',
    type: [PublicTrackingEventDto],
  })
  events!: PublicTrackingEventDto[];

  @ApiProperty({
    description: 'Total de eventos',
    example: 5,
  })
  total_events!: number;

  @ApiProperty({
    description: 'Progresso estimado (0-100)',
    example: 65,
  })
  progress_percentage!: number;
}

/**
 * DTO para resposta de dados do mapa
 */
export class PublicTrackingMapDto {
  @ApiProperty({
    description: 'Código de rastreamento',
    example: 'NXS202412180001',
  })
  tracking_code!: string;

  @ApiProperty({
    description: 'Status atual',
    example: 'IN_TRANSIT',
  })
  current_status!: string;

  @ApiPropertyOptional({
    description: 'Localização atual',
    example: {
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'Av. Paulista, 1000',
      timestamp: '2025-12-18T11:00:00Z',
    },
  })
  current_location?: CurrentLocation;

  @ApiProperty({
    description: 'Origem',
    example: {
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'Rua A, 123 - São Paulo, SP',
    },
  })
  origin!: LocationPoint;

  @ApiProperty({
    description: 'Destino',
    example: {
      latitude: -23.5515,
      longitude: -46.6343,
      address: 'Rua B, 456 - São Paulo, SP',
    },
  })
  destination!: LocationPoint;

  @ApiProperty({
    description: 'Rota percorrida (coordenadas)',
    type: 'array',
    example: [
      { latitude: -23.5505, longitude: -46.6333, timestamp: '2025-12-18T10:00:00Z' },
      { latitude: -23.5515, longitude: -46.6343, timestamp: '2025-12-18T10:15:00Z' },
    ],
  })
  route!: RoutePoint[];

  @ApiPropertyOptional({
    description: 'Distância total percorrida em km',
    example: 12.5,
  })
  total_distance_km?: number;

  @ApiPropertyOptional({
    description: 'Distância restante estimada em km',
    example: 3.8,
  })
  remaining_distance_km?: number;
}
