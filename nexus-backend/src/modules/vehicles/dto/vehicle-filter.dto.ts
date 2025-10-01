import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { VehicleStatus } from '../enums/vehicle-status.enum';
import { VehicleType } from '../enums/vehicle-type.enum';

export class VehicleFilterDto {
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
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrar por status do veículo',
    enum: VehicleStatus,
    example: VehicleStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo do veículo',
    enum: VehicleType,
    example: VehicleType.CAR,
  })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicle_type?: VehicleType;

  @ApiPropertyOptional({
    description: 'Buscar por placa, marca ou modelo',
    example: 'ABC',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por marca',
    example: 'Toyota',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  brand?: string;

  @ApiPropertyOptional({
    description: 'Mostrar apenas veículos que precisam de manutenção',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): boolean | undefined => {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return undefined;
  })
  needs_maintenance?: boolean;

  @ApiPropertyOptional({
    description: 'Ordenar por campo específico',
    example: 'created_at',
    enum: ['created_at', 'updated_at', 'license_plate', 'brand', 'model', 'year'],
  })
  @IsOptional()
  @IsString()
  order_by?: string = 'created_at';

  @ApiPropertyOptional({
    description: 'Ordem da classificação',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  order_direction?: 'ASC' | 'DESC' = 'DESC';
}
