import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsString,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';
import { RouteStatus } from '../enums/route-status';
import { RouteType } from '../enums/route.type';

/**
 * DTO para filtrar rotas
 *
 * Implementa validações e transformações automáticas para filtros de busca
 */
export class RouteFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por código da rota',
    example: 'RT-20240115-001',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  route_code?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: RouteStatus,
    example: RouteStatus.PLANNED,
  })
  @IsOptional()
  @IsEnum(RouteStatus, {
    message: 'Status deve ser um valor válido: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED, PAUSED',
  })
  status?: RouteStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo',
    enum: RouteType as object,
    example: RouteType.URBAN,
  })
  @IsOptional()
  @IsEnum(RouteType as object, {
    message: 'Tipo deve ser um valor válido: URBAN, INTERSTATE, RURAL, EXPRESS, LOCAL',
  })
  type?: RouteType;

  @ApiPropertyOptional({
    description: 'Filtrar por veículo (ID)',
    example: '16586204-b498-48f5-923c-6821bc040266',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', {
    message: 'ID do veículo deve ser um UUID válido',
  })
  vehicle_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por motorista (ID)',
    example: '2d45ff45-6dc6-4650-b27c-67b7f0e11788',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', {
    message: 'ID do motorista deve ser um UUID válido',
  })
  driver_id?: string;

  @ApiPropertyOptional({
    description: 'Data planejada inicial (YYYY-MM-DD)',
    example: new Date().toISOString().split('T')[0],
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Data planejada inicial deve estar no formato YYYY-MM-DD',
    },
  )
  @Transform(({ value }: { value: string }) => {
    if (!value) {
      return value;
    }
    // Normaliza para formato ISO date
    const date = new Date(value);
    return date.toISOString().split('T')[0];
  })
  planned_date_from?: string;

  @ApiPropertyOptional({
    description: 'Data planejada final (YYYY-MM-DD)',
    example: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })(),
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Data planejada final deve estar no formato YYYY-MM-DD',
    },
  )
  @Transform(({ value }: { value: string }) => {
    if (!value) {
      return value;
    }
    // Normaliza para formato ISO date
    const date = new Date(value);
    return date.toISOString().split('T')[0];
  })
  planned_date_to?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por distância mínima estimada (km)',
    example: 40,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'Distância mínima deve ser um número inteiro',
  })
  @Min(0, {
    message: 'Distância mínima não pode ser negativa',
  })
  min_distance_km?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por distância máxima estimada (km)',
    example: 50,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'Distância máxima deve ser um número inteiro',
  })
  @Min(0, {
    message: 'Distância máxima não pode ser negativa',
  })
  max_distance_km?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por nível de dificuldade mínimo (1-5)',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'Nível de dificuldade deve ser um número inteiro',
  })
  @Min(1, {
    message: 'Nível de dificuldade mínimo é 1',
  })
  @Max(5, {
    message: 'Nível de dificuldade máximo é 5',
  })
  min_difficulty_level?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por nível de dificuldade máximo (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'Nível de dificuldade deve ser um número inteiro',
  })
  @Min(1, {
    message: 'Nível de dificuldade mínimo é 1',
  })
  @Max(5, {
    message: 'Nível de dificuldade máximo é 5',
  })
  max_difficulty_level?: number;

  @ApiPropertyOptional({
    description: 'Incluir rotas canceladas',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  include_cancelled?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir rotas concluídas',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  include_completed?: boolean;
}
