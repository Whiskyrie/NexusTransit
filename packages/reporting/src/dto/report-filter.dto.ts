import { IsOptional, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseFilterDto } from '@nexus/common';
import { ReportType, ReportStatus, ReportFormat } from '../enums';

/**
 * DTO para filtros de consulta de relatórios
 */
export class ReportFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de relatório',
    enum: ReportType,
    example: ReportType.DELIVERIES,
  })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @ApiPropertyOptional({
    description: 'Filtrar por status do relatório',
    enum: ReportStatus,
    example: ReportStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por formato do relatório',
    enum: ReportFormat,
    example: ReportFormat.PDF,
  })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do usuário solicitante',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  requested_by?: string;

  @ApiPropertyOptional({
    description: 'Filtrar apenas relatórios agendados',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_scheduled?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar apenas relatórios ativos',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar relatórios expirados',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_expired?: boolean;
}
