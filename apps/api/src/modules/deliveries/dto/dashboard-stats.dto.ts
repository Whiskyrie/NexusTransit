import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para Top Estados por volume de entregas
 */
export class TopEstadoDto {
  @ApiProperty({
    description: 'Nome completo do estado',
    example: 'São Paulo',
  })
  estado!: string;

  @ApiProperty({
    description: 'Sigla do estado (UF)',
    example: 'SP',
  })
  sigla!: string;

  @ApiProperty({
    description: 'Quantidade de entregas',
    example: 150,
  })
  entregas!: number;

  @ApiProperty({
    description: 'Percentual em relação ao total',
    example: 35,
  })
  percentual!: number;
}

/**
 * DTO para Top Clientes por volume de entregas
 */
export class TopClienteDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome do cliente',
    example: 'Empresa ABC Ltda',
  })
  nome!: string;

  @ApiProperty({
    description: 'Categoria do cliente',
    example: 'VIP',
  })
  categoria!: string;

  @ApiProperty({
    description: 'Quantidade de entregas',
    example: 45,
  })
  entregas!: number;
}

/**
 * DTO para filtros do dashboard de entregas
 */
export class DeliveryDashboardFilterDto {
  @ApiProperty({
    description: 'Data de início do período (ISO 8601)',
    required: false,
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({
    description: 'Data de fim do período (ISO 8601)',
    required: false,
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({
    description: 'Status das entregas para filtrar',
    required: false,
    enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'])
  status?: string;

  @ApiProperty({
    description: 'Quantidade de resultados a retornar',
    required: false,
    default: 5,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}
