import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsLatitude,
  IsLongitude,
  Length,
  MaxLength,
  IsBoolean,
  IsDecimal,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IncidentType, IncidentSeverity } from '../enums/incident.enums';

/**
 * DTO para criação de anexo de incidente
 */
export class CreateIncidentAttachmentDto {
  @ApiProperty({
    description: 'Tipo do anexo',
    enum: ['PHOTO', 'VIDEO', 'DOCUMENT', 'AUDIO'],
    example: 'PHOTO',
  })
  @IsString()
  @IsNotEmpty()
  file_type!: string;

  @ApiProperty({
    description: 'Descrição do anexo',
    example: 'Foto do acidente',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

/**
 * DTO para criação de comentário de incidente
 */
export class CreateIncidentCommentDto {
  @ApiProperty({
    description: 'Texto do comentário',
    example: 'O incidente está sendo investigado',
    minLength: 2,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2000)
  comment_text!: string;

  @ApiProperty({
    description: 'Comentário interno (visível apenas para equipe)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  is_internal?: boolean = false;
}

/**
 * DTO para criação de incidente
 */
export class CreateIncidentDto {
  @ApiProperty({
    description: 'Tipo do incidente',
    enum: IncidentType,
    example: IncidentType.DELAYED_TRAFFIC,
  })
  @IsEnum(IncidentType)
  @IsNotEmpty()
  incident_type!: IncidentType;

  @ApiProperty({
    description: 'Severidade do incidente',
    enum: IncidentSeverity,
    example: IncidentSeverity.MEDIUM,
  })
  @IsEnum(IncidentSeverity)
  @IsNotEmpty()
  severity!: IncidentSeverity;

  @ApiProperty({
    description: 'Título breve do incidente',
    example: 'Atraso devido a acidente na rodovia',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 200)
  title!: string;

  @ApiProperty({
    description: 'Descrição detalhada do incidente',
    example: 'Acidente na altura do km 45 causando congestionamento de 3km',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 2000)
  description!: string;

  @ApiPropertyOptional({
    description: 'ID da entrega relacionada ao incidente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  delivery_id?: string;

  @ApiPropertyOptional({
    description: 'ID do veículo envolvido no incidente',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiPropertyOptional({
    description: 'ID do motorista envolvido no incidente',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiPropertyOptional({
    description: 'ID da rota afetada pelo incidente',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsOptional()
  @IsUUID()
  route_id?: string;

  @ApiPropertyOptional({
    description: 'Endereço formatado do local do incidente',
    example: 'Rodovia SP-348, Km 45',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location_address?: string;

  @ApiPropertyOptional({
    description: 'Latitude do incidente',
    example: -23.5505,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude do incidente',
    example: -46.6333,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiProperty({
    description: 'ID do usuário que reportou o incidente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  reported_by_user_id!: string;

  @ApiPropertyOptional({
    description: 'Data e hora da ocorrência do incidente',
    example: '2024-12-16T14:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  occurred_at?: string;

  @ApiPropertyOptional({
    description: 'Estimativa de prejuízo financeiro',
    example: 1500.5,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  @Type(() => Number)
  estimated_loss?: number;

  @ApiPropertyOptional({
    description: 'Indica se o incidente afetou entregas',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  impact_on_delivery?: boolean = false;

  @ApiPropertyOptional({
    description: 'Indica se é necessário acionar seguro',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  requires_insurance?: boolean = false;

  @ApiPropertyOptional({
    description: 'Observações gerais sobre o incidente',
    example: 'Verificar condições da carga após o incidente',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Anexos do incidente',
    type: [CreateIncidentAttachmentDto],
  })
  @IsOptional()
  @Type(() => CreateIncidentAttachmentDto)
  attachments?: CreateIncidentAttachmentDto[];

  @ApiPropertyOptional({
    description: 'Comentários iniciais do incidente',
    type: [CreateIncidentCommentDto],
  })
  @IsOptional()
  @Type(() => CreateIncidentCommentDto)
  comments?: CreateIncidentCommentDto[];
}
