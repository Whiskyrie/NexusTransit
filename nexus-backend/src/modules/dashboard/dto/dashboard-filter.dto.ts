import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DashboardPeriod } from '../enums/dashboard-period.enum';

/**
 * DTO para filtros do dashboard
 * 
 * Permite customizar período e agregações de dados
 */
export class DashboardFilterDto {
  @ApiPropertyOptional({
    description: 'Período de tempo para análise',
    enum: DashboardPeriod,
    example: DashboardPeriod.LAST_30_DAYS,
    default: DashboardPeriod.LAST_30_DAYS,
  })
  @IsOptional()
  @IsEnum(DashboardPeriod)
  period?: DashboardPeriod = DashboardPeriod.LAST_30_DAYS;

  @ApiPropertyOptional({
    description: 'Data de início para período customizado',
    example: '2024-01-01',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Data de fim para período customizado',
    example: '2024-12-31',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
