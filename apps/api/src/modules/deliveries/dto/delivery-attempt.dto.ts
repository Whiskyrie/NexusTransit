import {
  IsEnum,
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsUUID,
  Length,
  Min,
  Max,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FailureReason } from '../enums/failure-reason.enum';

// DTOs aninhados para validação
class LocationDto {
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

  @ApiProperty({ description: 'Timestamp', example: '2024-01-15T14:00:00Z' })
  @IsDateString()
  timestamp!: string;
}

class GpsTrackDto {
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

  @ApiProperty({ description: 'Timestamp', example: '2024-01-15T14:00:00Z' })
  @IsDateString()
  timestamp!: string;

  @ApiProperty({ description: 'Velocidade em km/h', example: 60, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  speed?: number;
}

class EvidenceDto {
  @ApiProperty({
    description: 'URLs das fotos',
    example: ['https://example.com/photo1.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  photos?: string[];

  @ApiProperty({
    description: 'URLs dos vídeos',
    example: ['https://example.com/video1.mp4'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  videos?: string[];

  @ApiProperty({
    description: 'URLs das notas de áudio',
    example: ['https://example.com/audio1.mp3'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  audio_notes?: string[];

  @ApiProperty({
    description: 'URLs dos documentos',
    example: ['https://example.com/doc1.pdf'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @IsString({ each: true })
  documents?: string[];

  @ApiProperty({
    description: 'Rastros GPS',
    type: [GpsTrackDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => GpsTrackDto)
  gps_tracks?: GpsTrackDto[];
}

class NotesDto {
  @ApiProperty({
    description: 'Notas internas',
    example: 'Motorista relatou trânsito intenso',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  internal_notes?: string;

  @ApiProperty({
    description: 'Notas do cliente',
    example: 'Cliente pediu para deixar na portaria',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  customer_notes?: string;

  @ApiProperty({
    description: 'Notas do motorista',
    example: 'Difícil acesso ao local',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  driver_notes?: string;

  @ApiProperty({
    description: 'Condições climáticas',
    example: 'Chuva forte',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  weather_conditions?: string;

  @ApiProperty({
    description: 'Condições de trânsito',
    example: 'Trânsito intenso',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  traffic_conditions?: string;

  @ApiProperty({
    description: 'Problemas de acesso',
    example: ['Portão trancado', 'Cachorro solto'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  access_issues?: string[];
}

class DriverDataDto {
  @ApiProperty({ description: 'ID do motorista' })
  @IsUUID()
  driver_id!: string;

  @ApiProperty({ description: 'ID do veículo', required: false })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiProperty({
    description: 'Odômetro do veículo em km',
    example: 15000,
    minimum: 0,
    maximum: 999999,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  vehicle_odometer?: number;

  @ApiProperty({
    description: 'Nível de combustível em %',
    example: 75,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fuel_level?: number;
}

export class CreateDeliveryAttemptDto {
  @ApiProperty({
    description: 'Número da tentativa',
    example: 1,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  attempt_number!: number;

  @ApiProperty({
    description: 'ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  driver_id!: string;

  @ApiProperty({
    description: 'ID do veículo',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiProperty({
    description: 'Status da tentativa',
    example: 'IN_PROGRESS',
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'])
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

  @ApiProperty({
    description: 'Data/hora de início',
    example: '2024-01-15T14:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  started_at?: string;

  @ApiProperty({
    description: 'Data/hora de conclusão',
    example: '2024-01-15T14:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  completed_at?: string;

  @ApiProperty({
    description: 'Tempo estimado em minutos',
    example: 30,
    minimum: 1,
    maximum: 480,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(480)
  estimated_time_minutes?: number;

  @ApiProperty({
    description: 'Distância percorrida em km',
    example: 15.5,
    minimum: 0,
    maximum: 500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  distance_km?: number;

  @ApiProperty({
    description: 'Motivo da falha',
    example: 'CUSTOMER_UNAVAILABLE',
    enum: FailureReason,
    required: false,
  })
  @IsOptional()
  @IsEnum(FailureReason)
  failure_reason?: FailureReason;

  @ApiProperty({
    description: 'Descrição da falha',
    example: 'Cliente não estava no endereço',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(5, 500)
  failure_description?: string;

  @ApiProperty({
    description: 'Localização da tentativa',
    type: LocationDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

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
  };

  @ApiProperty({
    description: 'Observações',
    type: NotesDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotesDto)
  notes?: NotesDto;

  @ApiProperty({
    description: 'Evidências coletadas',
    type: EvidenceDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EvidenceDto)
  evidence?: EvidenceDto;

  @ApiProperty({
    description: 'Tags da tentativa',
    example: ['urgent', 'retry', 'difficult_access'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Cliente foi contatado',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  customer_contacted?: boolean;

  @ApiProperty({
    description: 'Data/hora do contato',
    example: '2024-01-15T14:15:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  customer_contacted_at?: string;

  @ApiProperty({
    description: 'Método de contato',
    example: 'PHONE',
    enum: ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP', 'IN_PERSON'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['PHONE', 'SMS', 'EMAIL', 'WHATSAPP', 'IN_PERSON'])
  contact_method?: 'PHONE' | 'SMS' | 'EMAIL' | 'WHATSAPP' | 'IN_PERSON';

  @ApiProperty({
    description: 'Próxima ação',
    required: false,
  })
  @IsOptional()
  @IsObject()
  next_action?: {
    type: 'RETRY' | 'RESCHEDULE' | 'CANCEL' | 'ESCALATE';
    scheduled_at?: string;
    reason?: string;
    assigned_to?: string;
  };

  @ApiProperty({
    description: 'Dados do motorista',
    type: DriverDataDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DriverDataDto)
  driver_data?: DriverDataDto;
}

export class UpdateDeliveryAttemptDto {
  @ApiProperty({
    description: 'Status da tentativa',
    example: 'COMPLETED',
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'])
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

  @ApiProperty({
    description: 'Data/hora de conclusão',
    example: '2024-01-15T14:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  completed_at?: string;

  @ApiProperty({
    description: 'Tempo estimado em minutos',
    example: 30,
    minimum: 1,
    maximum: 480,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(480)
  estimated_time_minutes?: number;

  @ApiProperty({
    description: 'Distância percorrida em km',
    example: 15.5,
    minimum: 0,
    maximum: 500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  distance_km?: number;

  @ApiProperty({
    description: 'Motivo da falha',
    example: 'CUSTOMER_UNAVAILABLE',
    enum: FailureReason,
    required: false,
  })
  @IsOptional()
  @IsEnum(FailureReason)
  failure_reason?: FailureReason;

  @ApiProperty({
    description: 'Descrição da falha',
    example: 'Cliente não estava no endereço',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(5, 500)
  failure_description?: string;

  @ApiProperty({
    description: 'Localização da tentativa',
    type: LocationDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

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
  };

  @ApiProperty({
    description: 'Observações',
    type: NotesDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotesDto)
  notes?: NotesDto;

  @ApiProperty({
    description: 'Evidências coletadas',
    type: EvidenceDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EvidenceDto)
  evidence?: EvidenceDto;

  @ApiProperty({
    description: 'Tags da tentativa',
    example: ['urgent', 'retry', 'difficult_access'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Cliente foi contatado',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  customer_contacted?: boolean;

  @ApiProperty({
    description: 'Data/hora do contato',
    example: '2024-01-15T14:15:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  customer_contacted_at?: string;

  @ApiProperty({
    description: 'Método de contato',
    example: 'PHONE',
    enum: ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP', 'IN_PERSON'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['PHONE', 'SMS', 'EMAIL', 'WHATSAPP', 'IN_PERSON'])
  contact_method?: 'PHONE' | 'SMS' | 'EMAIL' | 'WHATSAPP' | 'IN_PERSON';

  @ApiProperty({
    description: 'Próxima ação',
    required: false,
  })
  @IsOptional()
  @IsObject()
  next_action?: {
    type: 'RETRY' | 'RESCHEDULE' | 'CANCEL' | 'ESCALATE';
    scheduled_at?: string;
    reason?: string;
    assigned_to?: string;
  };
}
