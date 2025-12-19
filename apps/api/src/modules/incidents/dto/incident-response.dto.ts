import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IncidentType, IncidentSeverity, IncidentStatus } from '../enums/incident.enums';
import { IncidentCommentResponseDto, IncidentAttachmentResponseDto } from '../dto';

export class IncidentResponseDto {
  @ApiProperty({
    description: 'ID único do incidente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Número único do incidente',
    example: 'INC-2024-0001',
  })
  incident_number!: string;

  @ApiProperty({
    description: 'Tipo do incidente',
    enum: IncidentType,
    example: IncidentType.DELAYED_TRAFFIC,
  })
  incident_type!: IncidentType;

  @ApiProperty({
    description: 'Tipo do incidente traduzido',
    example: 'Atraso no trânsito',
  })
  incident_type_translated!: string;

  @ApiProperty({
    description: 'Severidade do incidente',
    enum: IncidentSeverity,
    example: IncidentSeverity.MEDIUM,
  })
  severity!: IncidentSeverity;

  @ApiProperty({
    description: 'Severidade do incidente traduzida',
    example: 'Média',
  })
  severity_translated!: string;

  @ApiProperty({
    description: 'Status do incidente',
    enum: IncidentStatus,
    example: IncidentStatus.REPORTED,
  })
  status!: IncidentStatus;

  @ApiProperty({
    description: 'Status do incidente traduzido',
    example: 'Reportado',
  })
  status_translated!: string;

  @ApiProperty({
    description: 'Título breve do incidente',
    example: 'Atraso devido a acidente na rodovia',
  })
  title!: string;

  @ApiProperty({
    description: 'Descrição detalhada do incidente',
    example: 'Acidente na altura do km 45 causando congestionamento de 3km',
  })
  description!: string;

  @ApiPropertyOptional({
    description: 'ID da entrega relacionada ao incidente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  delivery_id?: string;

  @ApiPropertyOptional({
    description: 'ID do veículo envolvido no incidente',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  vehicle_id?: string;

  @ApiPropertyOptional({
    description: 'ID do motorista envolvido no incidente',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  driver_id?: string;

  @ApiPropertyOptional({
    description: 'ID da rota afetada pelo incidente',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  route_id?: string;

  @ApiPropertyOptional({
    description: 'Endereço formatado do local do incidente',
    example: 'Rodovia SP-348, Km 45',
  })
  location_address?: string;

  @ApiPropertyOptional({
    description: 'Latitude do incidente',
    example: -23.5505,
  })
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude do incidente',
    example: -46.6333,
  })
  longitude?: number;

  @ApiProperty({
    description: 'Data e hora do registro do incidente',
    example: '2024-12-16T14:30:00Z',
  })
  reported_at!: Date;

  @ApiPropertyOptional({
    description: 'Data e hora da ocorrência do incidente',
    example: '2024-12-16T14:30:00Z',
  })
  occurred_at?: Date;

  @ApiPropertyOptional({
    description: 'Data e hora da resolução do incidente',
    example: '2024-12-16T14:30:00Z',
  })
  resolved_at?: Date;

  @ApiProperty({
    description: 'ID do usuário que reportou o incidente',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  reported_by_user_id!: string;

  @ApiPropertyOptional({
    description: 'ID do usuário responsável pela resolução',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  assigned_to_user_id?: string;

  @ApiPropertyOptional({
    description: 'Estimativa de prejuízo financeiro',
    example: 1500.5,
  })
  estimated_loss?: number;

  @ApiProperty({
    description: 'Indica se o incidente afetou entregas',
    example: false,
  })
  impact_on_delivery!: boolean;

  @ApiProperty({
    description: 'Indica se é necessário acionar seguro',
    example: false,
  })
  requires_insurance!: boolean;

  @ApiPropertyOptional({
    description: 'Observações gerais sobre o incidente',
    example: 'Verificar condições da carga após o incidente',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Notas sobre a resolução do incidente',
    example: 'Incidente resolvido com sucesso',
  })
  resolution_notes?: string;

  @ApiPropertyOptional({
    description: 'Metadados adicionais do incidente',
    example: { weather: 'chuva forte', traffic_jam: '3km', estimated_delay: '45min' },
  })
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Anexos do incidente',
    type: [IncidentAttachmentResponseDto],
  })
  @Type(() => IncidentAttachmentResponseDto)
  attachments?: IncidentAttachmentResponseDto[];

  @ApiPropertyOptional({
    description: 'Comentários do incidente',
    type: [IncidentCommentResponseDto],
  })
  @Type(() => IncidentCommentResponseDto)
  comments?: IncidentCommentResponseDto[];

  @ApiProperty({
    description: 'Data e hora da criação',
    example: '2024-12-16T14:30:00Z',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Data e hora da última atualização',
    example: '2024-12-16T14:30:00Z',
  })
  updated_at!: Date;
}
