import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { OrderStatus } from '../enums/service_order-status';
import { OrderPriority } from '../enums/service_order-priority';

/**
 * DTO de resposta para ordem de serviço
 */
export class ServiceOrderResponseDto {
  @ApiProperty({
    description: 'ID único da ordem de serviço',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Número da ordem de serviço',
    example: 'OS-2024-00001',
  })
  order_number!: string;

  @ApiProperty({
    description: 'Status da ordem',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @ApiProperty({
    description: 'Prioridade da ordem',
    enum: OrderPriority,
    example: OrderPriority.NORMAL,
  })
  priority!: OrderPriority;

  @ApiProperty({
    description: 'Tipo de serviço',
    example: 'MAINTENANCE',
  })
  service_type!: string;

  @ApiProperty({
    description: 'Título da ordem',
    example: 'Manutenção preventiva do veículo ABC-1234',
  })
  title!: string;

  @ApiProperty({
    description: 'Descrição do serviço',
    example: 'Realizar troca de óleo, filtros e revisão geral',
  })
  description!: string;

  @ApiPropertyOptional({
    description: 'ID do veículo associado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  vehicle_id?: string;

  @ApiPropertyOptional({
    description: 'ID do motorista responsável',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  driver_id?: string;

  @ApiPropertyOptional({
    description: 'Data agendada',
    example: '2024-12-10T10:00:00Z',
  })
  scheduled_date?: Date;

  @ApiPropertyOptional({
    description: 'Data de início',
    example: '2024-12-10T10:30:00Z',
  })
  started_at?: Date;

  @ApiPropertyOptional({
    description: 'Data de conclusão',
    example: '2024-12-10T12:30:00Z',
  })
  completed_at?: Date;

  @ApiPropertyOptional({
    description: 'Data de cancelamento',
    example: '2024-12-10T11:00:00Z',
  })
  cancelled_at?: Date;

  @ApiProperty({
    description: 'Custo estimado',
    example: 350.5,
  })
  estimated_cost!: number;

  @ApiPropertyOptional({
    description: 'Custo real',
    example: 385.75,
  })
  actual_cost?: number;

  @ApiPropertyOptional({
    description: 'Duração estimada em minutos',
    example: 120,
  })
  estimated_duration_minutes?: number;

  @ApiPropertyOptional({
    description: 'Duração real em minutos',
    example: 135,
  })
  actual_duration_minutes?: number;

  @ApiPropertyOptional({
    description: 'Localização do serviço',
    example: 'Rua das Flores, 123 - Centro - São Paulo/SP',
  })
  service_location?: string;

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
    description: 'Observações',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Motivo do cancelamento',
  })
  cancellation_reason?: string;

  @ApiPropertyOptional({
    description: 'Relatório de conclusão',
  })
  completion_report?: string;

  @ApiPropertyOptional({
    description: 'Usuário criador',
  })
  created_by?: string;

  @ApiPropertyOptional({
    description: 'Usuário atualizador',
  })
  updated_by?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-12-09T08:00:00Z',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-12-09T12:00:00Z',
  })
  updated_at!: Date;

  @ApiPropertyOptional({
    description: 'Checklist de itens',
  })
  checklist?: {
    id: string;
    description: string;
    completed: boolean;
    completed_at?: Date;
    completed_by?: string;
  }[];

  @ApiPropertyOptional({
    description: 'Anexos',
  })
  attachments?: {
    id: string;
    filename: string;
    url: string;
    type: string;
    uploaded_at: Date;
    uploaded_by: string;
  }[];

  @Exclude()
  deleted_at?: Date;
}
