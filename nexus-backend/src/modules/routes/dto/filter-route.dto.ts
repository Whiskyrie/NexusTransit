import { IsOptional, IsEnum, IsDateString, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';
import { RouteStatus } from '../enums/route-status';
import { RouteType } from '../enums/route-type';

/**
 * DTO para filtrar rotas
 */
export class RouteFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por código da rota',
    example: 'RT-20240115-001',
  })
  @IsOptional()
  @IsString()
  route_code?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: RouteStatus,
    example: RouteStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo',
    enum: RouteType,
    example: RouteType.URBAN,
  })
  @IsOptional()
  @IsEnum(RouteType)
  type?: RouteType;

  @ApiPropertyOptional({
    description: 'Filtrar por veículo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por motorista',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiPropertyOptional({
    description: 'Data planejada inicial (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  planned_date_from?: string;

  @ApiPropertyOptional({
    description: 'Data planejada final (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  planned_date_to?: string;
}