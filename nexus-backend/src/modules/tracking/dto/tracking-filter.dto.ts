import {
  IsOptional,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsString,
  Length,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

/**
 * DTO para filtros de listagem de rastreamento
 *
 * Permite filtrar por entrega, veículo, motorista, período e eventos
 */
export class TrackingFilterDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    example: 50,
    minimum: 1,
    maximum: 500,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Filtrar por ID da entrega',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  delivery_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do veículo',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do motorista',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiPropertyOptional({
    description: 'Data de início do período',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Data de fim do período',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de evento',
    example: 'inicio_rota',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Transform(({ value }: { value: string }) => value?.trim())
  event_type?: string;

  @ApiPropertyOptional({
    description: 'Filtrar apenas pontos válidos',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }): boolean | undefined => {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return undefined;
  })
  is_valid?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar apenas pontos de parada',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }): boolean | undefined => {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return undefined;
  })
  is_stop?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por cidade',
    example: 'São Paulo',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }: { value: string }) => value?.trim())
  city?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado (UF)',
    example: 'SP',
    minLength: 2,
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  state?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do dispositivo',
    example: 'GPS-001',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }: { value: string }) => value?.trim())
  device_id?: string;

  @ApiPropertyOptional({
    description: 'Ordenar por campo específico',
    example: 'recorded_at',
    enum: ['recorded_at', 'created_at', 'latitude', 'longitude', 'speed'],
  })
  @IsOptional()
  @IsString()
  order_by?: string = 'recorded_at';

  @ApiPropertyOptional({
    description: 'Ordem da classificação',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  @Transform(({ value }: { value: string }) => value?.toUpperCase())
  order_direction?: 'ASC' | 'DESC' = 'DESC';
}
