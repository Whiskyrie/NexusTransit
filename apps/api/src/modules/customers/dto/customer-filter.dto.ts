import { IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType } from '../enums/customer-type.enum';
import { CustomerStatus } from '../enums/customer-status.enum';
import { CustomerCategory } from '../enums/customer-category.enum';

/**
 * DTO para filtros de busca de clientes
 */
export class CustomerFilterDto {
  @ApiPropertyOptional({
    description: 'Busca por nome, email ou CPF/CNPJ',
    example: 'João Silva',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de cliente',
    enum: CustomerType,
    example: CustomerType.INDIVIDUAL,
  })
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: CustomerStatus,
    example: CustomerStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por categoria',
    enum: CustomerCategory,
    example: CustomerCategory.STANDARD,
  })
  @IsOptional()
  @IsEnum(CustomerCategory)
  category?: CustomerCategory;

  @ApiPropertyOptional({
    description: 'Filtrar por múltiplos status',
    enum: CustomerStatus,
    isArray: true,
    example: [CustomerStatus.ACTIVE, CustomerStatus.PROSPECT],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CustomerStatus, { each: true })
  statuses?: CustomerStatus[];

  @ApiPropertyOptional({
    description: 'Filtrar por cidade',
    example: 'São Paulo',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado (UF)',
    example: 'SP',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Data de criação inicial (filtro)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @Type(() => Date)
  createdAtFrom?: Date;

  @ApiPropertyOptional({
    description: 'Data de criação final (filtro)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @Type(() => Date)
  createdAtTo?: Date;

  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    example: 'created_at',
    default: 'created_at',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
