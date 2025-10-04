import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  Length,
  Min,
  Max,
  IsEmail,
  IsObject,
  ValidateNested,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProofType } from '../enums/proof-type.enum';

// DTOs aninhados para validação
class DeviceMetadataDto {
  @ApiProperty({
    description: 'Tipo do dispositivo',
    example: 'MOBILE',
    enum: ['MOBILE', 'TABLET', 'CAMERA', 'SCANNER'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['MOBILE', 'TABLET', 'CAMERA', 'SCANNER'])
  device_type?: 'MOBILE' | 'TABLET' | 'CAMERA' | 'SCANNER';

  @ApiProperty({ description: 'Sistema operacional', example: 'Android 13', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  os?: string;

  @ApiProperty({ description: 'Versão do app', example: '1.2.3', required: false })
  @IsOptional()
  @IsString()
  @Length(3, 20)
  app_version?: string;

  @ApiProperty({ description: 'ID do dispositivo (UUID)', required: false })
  @IsOptional()
  @IsUUID()
  device_id?: string;

  @ApiProperty({ description: 'Endereço IP', example: '192.168.1.1', required: false })
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiProperty({ description: 'User agent', required: false })
  @IsOptional()
  @IsString()
  @Length(10, 500)
  user_agent?: string;
}

class SignatureDataDto {
  @ApiProperty({ description: 'Número de traços', example: 25, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  stroke_count?: number;

  @ApiProperty({ description: 'Duração em ms', example: 3500, required: false })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(60000)
  duration_ms?: number;

  @ApiProperty({ description: 'Pontos de pressão', example: 150, required: false })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(10000)
  pressure_points?: number;

  @ApiProperty({ description: 'Velocidade média', example: 1.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(100)
  velocity_avg?: number;
}

class CameraSettingsDto {
  @ApiProperty({ description: 'ISO', example: 400, required: false })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(102400)
  iso?: number;

  @ApiProperty({ description: 'Abertura', example: 'f/2.8', required: false })
  @IsOptional()
  @IsString()
  aperture?: string;

  @ApiProperty({ description: 'Velocidade do obturador', example: '1/125', required: false })
  @IsOptional()
  @IsString()
  shutter_speed?: string;

  @ApiProperty({ description: 'Distância focal', example: '35mm', required: false })
  @IsOptional()
  @IsString()
  focal_length?: string;
}

class PhotoDataDto {
  @ApiProperty({ description: 'Resolução', example: '1920x1080', required: false })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiProperty({ description: 'Configurações da câmera', type: CameraSettingsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CameraSettingsDto)
  camera_settings?: CameraSettingsDto;

  @ApiProperty({ description: 'Dados EXIF', required: false })
  @IsOptional()
  @IsObject()
  exif_data?: Record<string, unknown>;
}

class AudioDataDto {
  @ApiProperty({ description: 'Duração em segundos', example: 45, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(600)
  duration_seconds?: number;

  @ApiProperty({ description: 'Taxa de amostragem', example: 44100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(8000)
  @Max(192000)
  sample_rate?: number;

  @ApiProperty({ description: 'Taxa de bits', example: 128, required: false })
  @IsOptional()
  @IsNumber()
  @Min(32)
  @Max(320)
  bit_rate?: number;

  @ApiProperty({ description: 'Formato', example: 'mp3', required: false })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiProperty({ description: 'Transcrição', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 5000)
  transcription?: string;

  @ApiProperty({ description: 'Idioma', example: 'pt-BR', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 10)
  language?: string;
}

class CodeDataDto {
  @ApiProperty({ description: 'Código', example: 'ABC123', required: false })
  @IsOptional()
  @IsString()
  @Length(4, 20)
  code?: string;

  @ApiProperty({ description: 'Gerado em', example: '2024-01-15T15:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  generated_at?: string;

  @ApiProperty({ description: 'Expira em', example: '2024-01-15T16:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  expires_at?: string;

  @ApiProperty({ description: 'Tentativas', example: 3, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  attempts?: number;

  @ApiProperty({ description: 'Endereço IP', example: '192.168.1.1', required: false })
  @IsOptional()
  @IsString()
  ip_address?: string;
}

class BiometricDataDto {
  @ApiProperty({ description: 'ID do template (UUID)', required: false })
  @IsOptional()
  @IsUUID()
  template_id?: string;

  @ApiProperty({ description: 'Score de confiança', example: 0.95, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence_score?: number;

  @ApiProperty({ description: 'Vivacidade detectada', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  liveness_detected?: boolean;

  @ApiProperty({ description: 'Anti-spoofing passou', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  anti_spoofing_passed?: boolean;
}

class TypeSpecificDataDto {
  @ApiProperty({ description: 'Dados da assinatura', type: SignatureDataDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => SignatureDataDto)
  signature_data?: SignatureDataDto;

  @ApiProperty({ description: 'Dados da foto', type: PhotoDataDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => PhotoDataDto)
  photo_data?: PhotoDataDto;

  @ApiProperty({ description: 'Dados do áudio', type: AudioDataDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => AudioDataDto)
  audio_data?: AudioDataDto;

  @ApiProperty({ description: 'Dados do código', type: CodeDataDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CodeDataDto)
  code_data?: CodeDataDto;

  @ApiProperty({ description: 'Dados biométricos', type: BiometricDataDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => BiometricDataDto)
  biometric_data?: BiometricDataDto;
}

export class CreateDeliveryProofDto {
  @ApiProperty({
    description: 'ID da entrega (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  delivery_id!: string;

  @ApiProperty({
    description: 'ID do motorista (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  driver_id!: string;

  @ApiProperty({
    description: 'ID da tentativa de entrega (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  delivery_attempt_id?: string;

  @ApiProperty({
    description: 'ID do usuário que criou (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  created_by?: string;

  @ApiProperty({
    description: 'Tipo do comprovante',
    example: 'SIGNATURE',
    enum: ProofType,
  })
  @IsEnum(ProofType)
  type!: ProofType;

  @ApiProperty({
    description: 'Nome do recebedor',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  recipient_name?: string;

  @ApiProperty({
    description: 'Documento do recebedor',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(11, 14)
  recipient_document?: string;

  @ApiProperty({
    description: 'Telefone do recebedor',
    example: '11987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(10, 20)
  recipient_phone?: string;

  @ApiProperty({
    description: 'Email do recebedor',
    example: 'joao@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  recipient_email?: string;

  @ApiProperty({
    description: 'Relação com o destinatário',
    example: 'SELF',
    enum: ['SELF', 'FAMILY', 'FRIEND', 'NEIGHBOR', 'OTHER'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['SELF', 'FAMILY', 'FRIEND', 'NEIGHBOR', 'OTHER'])
  recipient_relationship?: 'SELF' | 'FAMILY' | 'FRIEND' | 'NEIGHBOR' | 'OTHER';

  @ApiProperty({
    description: 'Latitude da captura',
    example: -23.5505,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  capture_latitude?: number;

  @ApiProperty({
    description: 'Longitude da captura',
    example: -46.6333,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  capture_longitude?: number;

  @ApiProperty({
    description: 'Precisão do GPS em metros',
    example: 10,
    minimum: 0,
    maximum: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  gps_accuracy?: number;

  @ApiProperty({
    description: 'Data/hora da captura',
    example: '2024-01-15T15:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  capture_timestamp?: string;

  @ApiProperty({
    description: 'Metadados do dispositivo',
    type: DeviceMetadataDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceMetadataDto)
  device_metadata?: DeviceMetadataDto;

  @ApiProperty({
    description: 'Dados específicos por tipo',
    type: TypeSpecificDataDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TypeSpecificDataDto)
  type_specific_data?: TypeSpecificDataDto;

  @ApiProperty({
    description: 'Observações',
    example: 'Assinatura coletada presencialmente',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @ApiProperty({
    description: 'Verificado automaticamente',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  auto_verified?: boolean;

  @ApiProperty({
    description: 'Score de qualidade (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  quality_score?: number;
}

export class UploadDeliveryProofDto {
  @ApiProperty({
    description: 'ID da entrega (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  delivery_id!: string;

  @ApiProperty({
    description: 'ID do motorista (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  driver_id!: string;

  @ApiProperty({
    description: 'Tipo do comprovante',
    example: 'SIGNATURE',
    enum: ProofType,
  })
  @IsEnum(ProofType)
  type!: ProofType;

  @ApiProperty({
    description: 'Nome do recebedor',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  recipient_name?: string;

  @ApiProperty({
    description: 'Documento do recebedor',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(11, 14)
  recipient_document?: string;

  @ApiProperty({
    description: 'Telefone do recebedor',
    example: '11987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(10, 20)
  recipient_phone?: string;

  @ApiProperty({
    description: 'Email do recebedor',
    example: 'joao@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  recipient_email?: string;

  @ApiProperty({
    description: 'Relação com o destinatário',
    example: 'SELF',
    enum: ['SELF', 'FAMILY', 'FRIEND', 'NEIGHBOR', 'OTHER'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['SELF', 'FAMILY', 'FRIEND', 'NEIGHBOR', 'OTHER'])
  recipient_relationship?: 'SELF' | 'FAMILY' | 'FRIEND' | 'NEIGHBOR' | 'OTHER';

  @ApiProperty({
    description: 'Latitude da captura',
    example: -23.5505,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  capture_latitude?: number;

  @ApiProperty({
    description: 'Longitude da captura',
    example: -46.6333,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  capture_longitude?: number;

  @ApiProperty({
    description: 'Precisão do GPS em metros',
    example: 10,
    minimum: 0,
    maximum: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  gps_accuracy?: number;

  @ApiProperty({
    description: 'Data/hora da captura',
    example: '2024-01-15T15:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  capture_timestamp?: string;

  @ApiProperty({
    description: 'Observações',
    example: 'Assinatura coletada presencialmente',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}

export class DeliveryProofResponseDto {
  @ApiProperty({
    description: 'ID do comprovante (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'ID da entrega (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  delivery_id!: string;

  @ApiProperty({
    description: 'Tipo do comprovante',
    example: 'SIGNATURE',
    enum: ProofType,
  })
  type!: ProofType;

  @ApiProperty({
    description: 'URL do arquivo',
    example: 'https://storage.example.com/proofs/123.jpg',
  })
  @IsUrl()
  file_url!: string;

  @ApiProperty({
    description: 'Nome original do arquivo',
    example: 'signature_123.jpg',
  })
  original_filename!: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 1572864,
  })
  @IsNumber()
  @Min(0)
  @Max(100000000)
  file_size!: number;

  @ApiProperty({
    description: 'MIME type',
    example: 'image/jpeg',
  })
  mime_type!: string;

  @ApiProperty({
    description: 'Hash do arquivo',
    example: 'sha256:abc123...',
  })
  file_hash!: string;

  @ApiProperty({
    description: 'Nome do recebedor',
    example: 'João Silva',
    required: false,
  })
  recipient_name?: string;

  @ApiProperty({
    description: 'Documento do recebedor',
    example: '12345678901',
    required: false,
  })
  recipient_document?: string;

  @ApiProperty({
    description: 'Telefone do recebedor',
    example: '11987654321',
    required: false,
  })
  recipient_phone?: string;

  @ApiProperty({
    description: 'Email do recebedor',
    example: 'joao@example.com',
    required: false,
  })
  recipient_email?: string;

  @ApiProperty({
    description: 'Relação com o destinatário',
    example: 'SELF',
    required: false,
  })
  recipient_relationship?: string;

  @ApiProperty({
    description: 'Latitude da captura',
    example: -23.5505,
    required: false,
  })
  capture_latitude?: number;

  @ApiProperty({
    description: 'Longitude da captura',
    example: -46.6333,
    required: false,
  })
  capture_longitude?: number;

  @ApiProperty({
    description: 'Precisão do GPS',
    example: 10,
    required: false,
  })
  gps_accuracy?: number;

  @ApiProperty({
    description: 'Data/hora da captura',
    example: '2024-01-15T15:30:00Z',
  })
  captured_at!: Date;

  @ApiProperty({
    description: 'Verificado',
    example: true,
  })
  verified!: boolean;

  @ApiProperty({
    description: 'Data/hora da verificação',
    example: '2024-01-15T15:31:00Z',
    required: false,
  })
  verified_at?: Date;

  @ApiProperty({
    description: 'ID do usuário que verificou (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  verified_by?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T15:30:00Z',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T15:31:00Z',
  })
  updated_at!: Date;
}
