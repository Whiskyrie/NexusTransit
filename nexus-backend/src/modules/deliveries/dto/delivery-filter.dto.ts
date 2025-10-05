import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
  IsBoolean,
  Min,
  Max,
  Length,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { DeliveryPriority } from '../enums/delivery-priority.enum';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';

export class DeliveryFilterDto extends BaseFilterDto {
  @ApiProperty({
    description: 'Número da página',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Itens por página',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Campo de ordenação',
    example: 'created_at',
    required: false,
    enum: [
      'created_at',
      'updated_at',
      'scheduled_delivery_at',
      'priority',
      'status',
      'tracking_code',
    ],
  })
  @IsOptional()
  @IsString()
  @IsEnum([
    'created_at',
    'updated_at',
    'scheduled_delivery_at',
    'priority',
    'status',
    'tracking_code',
  ])
  sort_by?: string = 'created_at';

  @ApiProperty({
    description: 'Direção da ordenação',
    example: 'DESC',
    required: false,
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({
    description: 'Buscar por código de rastreamento',
    example: 'NEX123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 20)
  tracking_code?: string;

  @ApiProperty({
    description: 'Filtrar por status',
    example: 'IN_TRANSIT',
    enum: DeliveryStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @ApiProperty({
    description: 'Filtrar por múltiplos status',
    example: ['PENDING', 'ASSIGNED'],
    enum: DeliveryStatus,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(DeliveryStatus, { each: true })
  statuses?: DeliveryStatus[];

  @ApiProperty({
    description: 'Filtrar por prioridade',
    example: 'HIGH',
    enum: DeliveryPriority,
    required: false,
  })
  @IsOptional()
  @IsEnum(DeliveryPriority)
  priority?: DeliveryPriority;

  @ApiProperty({
    description: 'Filtrar por múltiplas prioridades',
    example: ['HIGH', 'CRITICAL'],
    enum: DeliveryPriority,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(DeliveryPriority, { each: true })
  priorities?: DeliveryPriority[];

  @ApiProperty({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @ApiProperty({
    description: 'ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiProperty({
    description: 'ID do veículo',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiProperty({
    description: 'Buscar por descrição do produto',
    example: 'eletrônicos',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  description?: string;

  @ApiProperty({
    description: 'Filtrar por cidade de entrega',
    example: 'São Paulo',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  delivery_city?: string;

  @ApiProperty({
    description: 'Filtrar por estado de entrega',
    example: 'SP',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  delivery_state?: string;

  @ApiProperty({
    description: 'Filtrar por CEP de entrega',
    example: '01234-567',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(8, 9)
  delivery_postal_code?: string;

  @ApiProperty({
    description: 'Data inicial de entrega agendada',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduled_delivery_from?: string;

  @ApiProperty({
    description: 'Data final de entrega agendada',
    example: '2024-01-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduled_delivery_to?: string;

  @ApiProperty({
    description: 'Peso mínimo (kg)',
    example: 1.0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight_min?: number;

  @ApiProperty({
    description: 'Peso máximo (kg)',
    example: 50.0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight_max?: number;

  @ApiProperty({
    description: 'Valor declarado mínimo',
    example: 100.0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value_min?: number;

  @ApiProperty({
    description: 'Valor declarado máximo',
    example: 5000.0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value_max?: number;

  @ApiProperty({
    description: 'Entregas atrasadas',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  overdue?: boolean;

  @ApiProperty({
    description: 'Entregas hoje',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  today?: boolean;

  @ApiProperty({
    description: 'Entregas esta semana',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  this_week?: boolean;

  @ApiProperty({
    description: 'Apenas entregas ativas (não finalizadas)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  active_only?: boolean;

  @ApiProperty({
    description: 'Incluir entregas canceladas',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  include_cancelled?: boolean;

  @ApiProperty({
    description: 'Apenas entregas sem motorista atribuído',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  unassigned_only?: boolean;

  @ApiProperty({
    description: 'Apenas entregas com problemas',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  with_issues?: boolean;
}
