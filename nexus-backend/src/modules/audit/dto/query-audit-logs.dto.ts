import {
  IsOptional,
  IsEnum,
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction, AuditCategory } from '../enums';

/**
 * DTO para consulta de logs de auditoria com filtros e paginação
 */
export class QueryAuditLogsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ação executada',
    enum: AuditAction,
    example: AuditAction.CREATE,
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    description: 'Filtrar por categoria da operação',
    enum: AuditCategory,
    example: AuditCategory.DELIVERY_MANAGEMENT,
  })
  @IsOptional()
  @IsEnum(AuditCategory)
  category?: AuditCategory;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por email do usuário (busca parcial)',
    example: 'usuario@example.com',
  })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de recurso',
    example: 'Delivery',
  })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do recurso',
    example: '789e0123-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({
    description: 'Data inicial do período (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data final do período (ISO 8601)',
    example: '2024-01-31T23:59:59Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Busca textual na descrição dos logs',
    example: 'entrega',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Número da página (começa em 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  @Min(1)
  @Max(100)
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
    description: 'Ordem de classificação',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
