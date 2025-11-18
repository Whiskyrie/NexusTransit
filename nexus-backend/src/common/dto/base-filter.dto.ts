import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Termo de busca',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Limite de resultados por página',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Ordenar por campo',
    example: 'created_at',
  })
  @IsOptional()
  @IsString()
  sort_by?: string;

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({
    description: 'Data de criação inicial',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  created_from?: string;

  @ApiPropertyOptional({
    description: 'Data de criação final',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  created_to?: string;

  @ApiPropertyOptional({
    description: 'Data de atualização inicial',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  updated_from?: string;

  @ApiPropertyOptional({
    description: 'Data de atualização final',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  updated_to?: string;

  @ApiPropertyOptional({
    description: 'Lista de IDs para filtrar',
    example: ['uuid1', 'uuid2'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  ids?: string[];
}
