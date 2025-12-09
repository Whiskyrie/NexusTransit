import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsObject,
  IsArray,
  Length,
  Min,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../enums/service_order-status';
import { OrderPriority } from '../enums/service_order-priority';

/**
 * DTO para criação de ordem de serviço
 */
export class CreateServiceOrderDto {
  @ApiProperty({
    description: 'Tipo de serviço',
    example: 'MAINTENANCE',
    maxLength: 50,
  })
  @IsString()
  @Length(2, 50)
  service_type!: string;

  @ApiProperty({
    description: 'Título da ordem de serviço',
    example: 'Manutenção preventiva do veículo ABC-1234',
    maxLength: 200,
  })
  @IsString()
  @Length(5, 200)
  title!: string;

  @ApiProperty({
    description: 'Descrição detalhada do serviço',
    example: 'Realizar troca de óleo, filtros e revisão geral do motor',
  })
  @IsString()
  @Length(10, 5000)
  description!: string;

  @ApiPropertyOptional({
    description: 'Status inicial da ordem',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Prioridade da ordem',
    enum: OrderPriority,
    default: OrderPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @ApiPropertyOptional({
    description: 'ID do veículo associado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiPropertyOptional({
    description: 'ID do motorista responsável',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiPropertyOptional({
    description: 'Data e hora agendada para execução',
    example: '2024-12-10T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduled_date?: string;

  @ApiPropertyOptional({
    description: 'Custo estimado do serviço',
    example: 350.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimated_cost?: number;

  @ApiPropertyOptional({
    description: 'Tempo estimado em minutos',
    example: 120,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimated_duration_minutes?: number;

  @ApiPropertyOptional({
    description: 'Endereço onde o serviço será executado',
    example: 'Rua das Flores, 123 - Centro - São Paulo/SP',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  service_location?: string;

  @ApiPropertyOptional({
    description: 'Latitude do local do serviço',
    example: -23.5505,
  })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude do local do serviço',
    example: -46.6333,
  })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Observações gerais',
    example: 'Contato com responsável necessário antes de iniciar',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Usuário que está criando a ordem',
    example: 'joao.silva@empresa.com',
  })
  @IsOptional()
  @IsString()
  created_by?: string;

  @ApiPropertyOptional({
    description: 'Dados adicionais em formato JSON',
    example: { departamento: 'logistica', centro_custo: '1001' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Lista de itens do checklist',
    example: [
      { id: '1', description: 'Verificar nível de óleo', completed: false },
      { id: '2', description: 'Trocar filtro de ar', completed: false },
    ],
  })
  @IsOptional()
  @IsArray()
  checklist?: {
    id: string;
    description: string;
    completed: boolean;
  }[];
}
