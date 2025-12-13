import {
  IsEnum,
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsUUID,
  IsBoolean,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryStatus } from '../enums/delivery-status.enum';

// DTO para validar a localização
export class LocationDto {
  @ApiProperty({ description: 'Latitude', example: -25.4284 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ description: 'Longitude', example: -49.2733 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiProperty({ description: 'Precisão em metros', example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  accuracy?: number;

  @ApiProperty({ description: 'Endereço', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}

export class ChangeStatusDto {
  @ApiProperty({
    description: 'Novo status da entrega',
    example: 'IN_TRANSIT',
    enum: DeliveryStatus,
  })
  @IsEnum(DeliveryStatus)
  new_status!: DeliveryStatus;

  @ApiProperty({
    description: 'Motivo da mudança de status',
    example: 'Produto coletado no remetente',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(5, 500)
  reason?: string;

  @ApiProperty({
    description: 'Observações internas',
    example: 'Motorista confirmou coleta',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  internal_notes?: string;

  @ApiProperty({
    description: 'Localização da mudança',
    required: false,
    type: LocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiProperty({
    description: 'Prioridade da entrega (1-10)',
    example: 5,
    minimum: 1,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiProperty({
    description: 'Tempo estimado de entrega em horas',
    example: 24,
    minimum: 0,
    maximum: 720,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(720) // máximo 30 dias
  estimated_delivery_hours?: number;

  @ApiProperty({
    description: 'Peso do pacote em kg',
    example: 2.5,
    minimum: 0.1,
    maximum: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1000)
  weight_kg?: number;

  @ApiProperty({
    description: 'Data/hora do evento (se diferente de agora)',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  event_timestamp?: string;

  @ApiProperty({
    description: 'ID do motorista (se aplicável)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiProperty({
    description: 'ID do veículo (se aplicável)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiProperty({
    description: 'Dados específicos do status',
    required: false,
  })
  @IsOptional()
  @IsObject()
  status_data?: {
    pickup_data?: {
      pickup_location?: string;
      package_condition?: 'GOOD' | 'DAMAGED' | 'SEALED';
      photos_taken?: number;
      documents_verified?: string[];
      odometer_reading?: number;
    };
    transit_data?: {
      route_id?: string;
      estimated_arrival?: Date;
      current_location?: string;
      checkpoints_passed?: string[];
    };
    delivery_data?: {
      recipient_name?: string;
      recipient_document?: string;
      recipient_relationship?: string;
      proof_types?: string[];
      photos_count?: number;
      signature_obtained?: boolean;
    };
    failure_data?: {
      failure_reason?: string;
      retry_attempt?: number;
      next_retry_date?: string;
      customer_notified?: boolean;
      additional_info?: string;
    };
    cancellation_data?: {
      cancellation_reason?: string;
      refund_requested?: boolean;
      refund_amount?: number;
      customer_notified?: boolean;
      penalty_applied?: boolean;
    };
  };

  @ApiProperty({
    description: 'Informações de contato',
    required: false,
  })
  @IsOptional()
  @IsObject()
  contact_info?: {
    contacted_person?: string;
    phone?: string;
    email?: string;
    relationship?: 'RECIPIENT' | 'FAMILY' | 'NEIGHBOR' | 'OTHER';
    contact_time?: string;
  };

  @ApiProperty({
    description: 'Evidências coletadas',
    required: false,
  })
  @IsOptional()
  @IsObject()
  evidence?: {
    photos?: string[];
    videos?: string[];
    audio_notes?: string[];
    documents?: string[];
    gps_coordinates?: {
      latitude: number;
      longitude: number;
      timestamp: string;
    }[];
  };

  @ApiProperty({
    description: 'Forçar mudança (ignorar validações)',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  force_change?: boolean;

  @ApiProperty({
    description: 'Notificar cliente',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  notify_customer?: boolean;

  @ApiProperty({
    description: 'Notificar motorista',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  notify_driver?: boolean;

  @ApiProperty({
    description: 'Método de notificação do cliente',
    example: 'SMS',
    enum: ['SMS', 'EMAIL', 'WHATSAPP', 'PUSH'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['SMS', 'EMAIL', 'WHATSAPP', 'PUSH'])
  customer_notification_method?: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH';
}
