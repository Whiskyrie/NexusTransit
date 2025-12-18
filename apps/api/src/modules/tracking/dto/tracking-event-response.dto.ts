import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { EventType } from '../enums/event-type.enum';
import { EventStatus } from '../enums/event-status.enum';

/**
 * DTO de resposta para evento de rastreamento
 */
export class TrackingEventResponseDto {
  @ApiProperty({
    description: 'ID do evento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'ID único do evento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  event_id!: string;

  @ApiProperty({
    description: 'ID da entrega',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  delivery_id!: string;

  @ApiPropertyOptional({
    description: 'ID da rota',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  route_id?: string;

  @ApiProperty({
    description: 'ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  driver_id!: string;

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
    example: '2025-12-17T10:30:00Z',
  })
  timestamp!: Date;

  @ApiPropertyOptional({
    description: 'Latitude',
    example: -23.5505,
  })
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude',
    example: -46.6333,
  })
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Endereço formatado',
    example: 'Rua Exemplo, 123, São Paulo, SP',
  })
  location_address?: string;

  @ApiPropertyOptional({
    description: 'Precisão do GPS em metros',
    example: 15.5,
  })
  accuracy?: number;

  @ApiPropertyOptional({
    description: 'Velocidade em km/h',
    example: 60.5,
  })
  speed?: number;

  @ApiPropertyOptional({
    description: 'Nível de bateria do dispositivo',
    example: 85.0,
  })
  battery_level?: number;

  @ApiPropertyOptional({
    description: 'Observações do evento',
    example: 'Trânsito intenso na região',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Metadados adicionais',
    example: { temperature: 25, humidity: 60 },
  })
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'Evento automático vs manual',
    example: false,
  })
  is_automatic!: boolean;

  @ApiPropertyOptional({
    description: 'ID do usuário que criou evento manual',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  created_by_user_id?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-12-17T10:30:00Z',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-12-17T10:30:00Z',
  })
  updated_at!: Date;

  @Exclude()
  location?: string;
}

/**
 * DTO de resposta paginada
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Lista de resultados',
    isArray: true,
  })
  data!: T[];

  @ApiProperty({
    description: 'Metadados de paginação',
    example: {
      page: 1,
      limit: 10,
      total: 100,
      total_pages: 10,
      has_previous: false,
      has_next: true,
    },
  })
  meta!: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_previous: boolean;
    has_next: boolean;
  };
}
