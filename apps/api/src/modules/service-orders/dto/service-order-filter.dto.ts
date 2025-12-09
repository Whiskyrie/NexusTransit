import { IsOptional, IsEnum, IsDateString, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseFilterDto } from '@nexus/common';
import { OrderStatus } from '../enums/service_order-status';
import { OrderPriority } from '../enums/service_order-priority';

/**
 * DTO para filtros de busca de ordens de serviço
 */
export class ServiceOrderFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por prioridade',
    enum: OrderPriority,
    example: OrderPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de serviço',
    example: 'MAINTENANCE',
  })
  @IsOptional()
  @IsString()
  service_type?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do veículo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiPropertyOptional({
    description: 'Data inicial de agendamento',
    example: '2024-12-01',
  })
  @IsOptional()
  @IsDateString()
  scheduled_date_start?: string;

  @ApiPropertyOptional({
    description: 'Data final de agendamento',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  scheduled_date_end?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por usuário criador',
    example: 'joao.silva@empresa.com',
  })
  @IsOptional()
  @IsString()
  created_by?: string;
}
