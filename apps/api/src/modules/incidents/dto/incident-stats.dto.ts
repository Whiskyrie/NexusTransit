import { IsOptional, IsDateString, IsEnum, IsUUID, IsIn } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IncidentStatus, IncidentSeverity, IncidentType } from '../enums/incident.enums';

/**
 * DTO para filtros de estatísticas de incidentes
 */
export class IncidentStatsFilterDto {
  @ApiPropertyOptional({
    description: 'Data de início do período',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Data de fim do período',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: IncidentStatus,
  })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por severidade',
    enum: IncidentSeverity,
  })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo',
    enum: IncidentType,
  })
  @IsOptional()
  @IsEnum(IncidentType)
  type?: IncidentType;

  @ApiPropertyOptional({
    description: 'Filtrar por cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por equipe',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  team_id?: string;

  @ApiPropertyOptional({
    description: 'Agrupamento para análise de tendências',
    enum: ['day', 'week', 'month'],
    default: 'day',
  })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  group_by?: 'day' | 'week' | 'month';
}

/**
 * DTO de resposta com estatísticas gerais
 */
export class IncidentStatsResponseDto {
  @ApiProperty({
    description: 'Total de incidentes no período',
    example: 150,
  })
  total_incidents!: number;

  @ApiProperty({
    description: 'Incidentes por status',
    example: { OPEN: 20, IN_PROGRESS: 30, RESOLVED: 80, CLOSED: 20 },
  })
  incidents_by_status!: Record<string, number>;

  @ApiProperty({
    description: 'Incidentes por severidade',
    example: { LOW: 50, MEDIUM: 60, HIGH: 30, CRITICAL: 10 },
  })
  incidents_by_severity!: Record<string, number>;

  @ApiProperty({
    description: 'Incidentes por tipo',
    example: { TECHNICAL: 80, OPERATIONAL: 40, CUSTOMER: 30 },
  })
  incidents_by_type!: Record<string, number>;

  @ApiProperty({
    description: 'Tempo médio de resolução em horas',
    example: 24.5,
  })
  avg_resolution_time_hours!: number;

  @ApiProperty({
    description: 'Tempo médio de resposta em minutos',
    example: 45.2,
  })
  avg_response_time_minutes!: number;

  @ApiProperty({
    description: 'Taxa de resolução (%)',
    example: 85.5,
  })
  resolution_rate!: number;

  @ApiProperty({
    description: 'Total de incidentes criados no período',
    example: 120,
  })
  created_incidents!: number;

  @ApiProperty({
    description: 'Total de incidentes resolvidos no período',
    example: 100,
  })
  resolved_incidents!: number;

  @ApiProperty({
    description: 'Período da análise',
    example: '2024-01-01 to 2024-12-31',
  })
  period!: string;
}

/**
 * DTO para item de tendência
 */
export class IncidentTrendDto {
  @ApiProperty({
    description: 'Período (data)',
    example: '2024-01-15',
  })
  period!: string;

  @ApiProperty({
    description: 'Contagem de incidentes',
    example: 15,
  })
  count!: number;

  @ApiProperty({
    description: 'Variação percentual em relação ao período anterior',
    example: 12.5,
  })
  variation!: number;
}

/**
 * DTO de resposta com análise de tendências
 */
export class IncidentTrendsResponseDto {
  @ApiProperty({
    description: 'Dados de tendência por período',
    type: [IncidentTrendDto],
  })
  data!: IncidentTrendDto[];

  @ApiProperty({
    description: 'Tendência geral',
    enum: ['increasing', 'decreasing', 'stable'],
    example: 'decreasing',
  })
  trend!: 'increasing' | 'decreasing' | 'stable';

  @ApiProperty({
    description: 'Variação total no período',
    example: -10,
  })
  total_variation!: number;
}

/**
 * DTO com métricas de tempo de resposta
 */
export class ResponseTimeMetricsDto {
  @ApiProperty({
    description: 'Tempo médio de resposta em minutos',
    example: 45.2,
  })
  avg_response_time_minutes!: number;

  @ApiProperty({
    description: 'Tempo mínimo de resposta em minutos',
    example: 5.0,
  })
  min_response_time_minutes!: number;

  @ApiProperty({
    description: 'Tempo máximo de resposta em minutos',
    example: 180.0,
  })
  max_response_time_minutes!: number;

  @ApiProperty({
    description: 'Mediana do tempo de resposta em minutos',
    example: 30.0,
  })
  median_response_time_minutes!: number;
}

/**
 * DTO com métricas de tempo de resolução
 */
export class ResolutionTimeMetricsDto {
  @ApiProperty({
    description: 'Tempo médio de resolução em horas',
    example: 24.5,
  })
  avg_resolution_time_hours!: number;

  @ApiProperty({
    description: 'Tempo mínimo de resolução em horas',
    example: 2.0,
  })
  min_resolution_time_hours!: number;

  @ApiProperty({
    description: 'Tempo máximo de resolução em horas',
    example: 168.0,
  })
  max_resolution_time_hours!: number;

  @ApiProperty({
    description: 'Mediana do tempo de resolução em horas',
    example: 18.0,
  })
  median_resolution_time_hours!: number;
}

/**
 * DTO com métricas do dashboard
 */
export class IncidentDashboardDto {
  @ApiProperty({
    description: 'Total de incidentes ativos',
    example: 25,
  })
  active_incidents!: number;

  @ApiProperty({
    description: 'Novos incidentes hoje',
    example: 5,
  })
  new_today!: number;

  @ApiProperty({
    description: 'Incidentes resolvidos hoje',
    example: 8,
  })
  resolved_today!: number;

  @ApiProperty({
    description: 'Tempo médio de resposta em minutos',
    example: 45.2,
  })
  avg_response_time_minutes!: number;

  @ApiProperty({
    description: 'Incidentes críticos ativos',
    example: 3,
  })
  critical_incidents!: number;

  @ApiProperty({
    description: 'Taxa de resolução nos últimos 7 dias (%)',
    example: 85.5,
  })
  resolution_rate_7d!: number;

  @ApiProperty({
    description: 'Métricas de tempo de resposta',
    type: ResponseTimeMetricsDto,
  })
  response_metrics!: ResponseTimeMetricsDto;

  @ApiProperty({
    description: 'Métricas de tempo de resolução',
    type: ResolutionTimeMetricsDto,
  })
  resolution_metrics!: ResolutionTimeMetricsDto;
}
