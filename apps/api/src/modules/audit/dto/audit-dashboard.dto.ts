import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction, AuditCategory } from '@nexus/audit';

/**
 * Período de análise do dashboard
 */
export enum DashboardPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

/**
 * DTO para filtros do dashboard de auditoria
 */
export class AuditDashboardFilterDto {
  @ApiPropertyOptional({
    description: 'Período de análise',
    enum: DashboardPeriod,
    default: DashboardPeriod.WEEK,
    example: DashboardPeriod.WEEK,
  })
  @IsOptional()
  @IsEnum(DashboardPeriod)
  period?: DashboardPeriod = DashboardPeriod.WEEK;

  @ApiPropertyOptional({
    description: 'Data de início personalizada (ISO 8601)',
    example: '2024-12-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data de fim personalizada (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por categoria',
    enum: AuditCategory,
    example: AuditCategory.SYSTEM,
  })
  @IsOptional()
  @IsEnum(AuditCategory)
  category?: AuditCategory;
}

/**
 * DTO para timeline de atividades
 */
export class AuditTimelineFilterDto {
  @ApiPropertyOptional({
    description: 'Número de itens a retornar',
    minimum: 1,
    maximum: 100,
    default: 50,
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Filtrar por ação',
    enum: AuditAction,
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    description: 'Filtrar por categoria',
    enum: AuditCategory,
  })
  @IsOptional()
  @IsEnum(AuditCategory)
  category?: AuditCategory;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de recurso',
    example: 'Vehicle',
  })
  @IsOptional()
  resourceType?: string;
}

/**
 * DTO de resposta para item da timeline
 */
export class AuditTimelineItemDto {
  @ApiProperty({
    description: 'ID do log de auditoria',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Ação executada',
    enum: AuditAction,
    example: AuditAction.UPDATE,
  })
  action!: AuditAction;

  @ApiProperty({
    description: 'Categoria da ação',
    enum: AuditCategory,
    example: AuditCategory.VEHICLE_MANAGEMENT,
  })
  category!: AuditCategory;

  @ApiProperty({
    description: 'Tipo do recurso',
    example: 'Vehicle',
  })
  resourceType!: string;

  @ApiPropertyOptional({
    description: 'ID do recurso',
    example: '456e7890-e89b-12d3-a456-426614174000',
  })
  resourceId?: string | null;

  @ApiPropertyOptional({
    description: 'Email do usuário',
    example: 'user@example.com',
  })
  userEmail?: string | null;

  @ApiPropertyOptional({
    description: 'Descrição da ação',
    example: 'Veículo atualizado: placa ABC-1234',
  })
  description?: string | null;

  @ApiProperty({
    description: 'Data e hora da ação',
    example: '2024-12-20T14:30:00Z',
  })
  timestamp!: Date;

  @ApiPropertyOptional({
    description: 'Campos que foram alterados',
    example: ['status', 'mileage'],
  })
  changedFields?: string[];
}

/**
 * DTO de resposta para estatísticas do dashboard
 */
export class AuditDashboardStatsDto {
  @ApiProperty({
    description: 'Total de eventos no período',
    example: 1234,
  })
  totalEvents!: number;

  @ApiProperty({
    description: 'Variação percentual em relação ao período anterior',
    example: 12.5,
  })
  totalEventsChange!: number;

  @ApiProperty({
    description: 'Total de usuários ativos no período',
    example: 45,
  })
  activeUsers!: number;

  @ApiProperty({
    description: 'Variação percentual de usuários ativos',
    example: -3.2,
  })
  activeUsersChange!: number;

  @ApiProperty({
    description: 'Distribuição por tipo de ação',
    example: {
      CREATE: 300,
      UPDATE: 600,
      DELETE: 100,
      LOGIN: 200,
      EXPORT: 34,
    },
  })
  actionDistribution!: Record<string, number>;

  @ApiProperty({
    description: 'Distribuição por categoria',
    example: {
      VEHICLE_MANAGEMENT: 400,
      USER_MANAGEMENT: 300,
      AUTH: 500,
    },
  })
  categoryDistribution!: Record<string, number>;

  @ApiProperty({
    description: 'Eventos agrupados por hora (últimas 24h) ou por dia',
    example: [
      { label: '2024-12-20 14:00', count: 45 },
      { label: '2024-12-20 15:00', count: 52 },
    ],
  })
  eventsTrend!: { label: string; count: number }[];

  @ApiProperty({
    description: 'Tempo médio de execução em ms',
    example: 125.5,
  })
  avgResponseTime!: number;

  @ApiProperty({
    description: 'Taxa de erro no período (%)',
    example: 2.3,
  })
  errorRate!: number;

  @ApiProperty({
    description: 'Período analisado',
    example: 'week',
  })
  period!: string;

  @ApiProperty({
    description: 'Data de início do período',
    example: '2024-12-13T00:00:00Z',
  })
  periodStart!: Date;

  @ApiProperty({
    description: 'Data de fim do período',
    example: '2024-12-20T23:59:59Z',
  })
  periodEnd!: Date;
}

/**
 * DTO de resposta para top usuários
 */
export class AuditTopUserDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId!: string;

  @ApiPropertyOptional({
    description: 'Email do usuário',
    example: 'admin@example.com',
  })
  userEmail?: string | null;

  @ApiPropertyOptional({
    description: 'Role do usuário',
    example: 'ADMIN',
  })
  userRole?: string | null;

  @ApiProperty({
    description: 'Total de ações',
    example: 150,
  })
  totalActions!: number;

  @ApiProperty({
    description: 'Última atividade',
    example: '2024-12-20T14:30:00Z',
  })
  lastActivity!: Date;

  @ApiProperty({
    description: 'Distribuição de ações do usuário',
    example: { CREATE: 50, UPDATE: 80, DELETE: 20 },
  })
  actionBreakdown!: Record<string, number>;
}

/**
 * DTO de resposta para top entidades
 */
export class AuditTopEntityDto {
  @ApiProperty({
    description: 'Tipo da entidade',
    example: 'Vehicle',
  })
  entityType!: string;

  @ApiProperty({
    description: 'Total de modificações',
    example: 450,
  })
  totalModifications!: number;

  @ApiProperty({
    description: 'Total de criações',
    example: 100,
  })
  creates!: number;

  @ApiProperty({
    description: 'Total de atualizações',
    example: 300,
  })
  updates!: number;

  @ApiProperty({
    description: 'Total de exclusões',
    example: 50,
  })
  deletes!: number;

  @ApiProperty({
    description: 'Variação percentual',
    example: 15.3,
  })
  changePercent!: number;
}

/**
 * DTO de resposta para alertas de segurança
 */
export class AuditSecurityAlertDto {
  @ApiProperty({
    description: 'ID do alerta',
    example: 'alert-001',
  })
  id!: string;

  @ApiProperty({
    description: 'Tipo do alerta',
    enum: [
      'MULTIPLE_LOGIN_FAILURES',
      'BULK_DELETE',
      'HIGH_ACTIVITY',
      'MULTIPLE_IPS',
      'PERMISSION_ESCALATION',
    ],
    example: 'MULTIPLE_LOGIN_FAILURES',
  })
  type!: string;

  @ApiProperty({
    description: 'Severidade do alerta',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    example: 'HIGH',
  })
  severity!: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @ApiProperty({
    description: 'Mensagem descritiva',
    example: 'Usuário user@example.com teve 5 falhas de login nos últimos 15 minutos',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'ID do usuário relacionado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId?: string;

  @ApiPropertyOptional({
    description: 'Email do usuário relacionado',
    example: 'user@example.com',
  })
  userEmail?: string;

  @ApiPropertyOptional({
    description: 'IP relacionado',
    example: '192.168.1.100',
  })
  ipAddress?: string;

  @ApiProperty({
    description: 'Data/hora de detecção',
    example: '2024-12-20T14:30:00Z',
  })
  detectedAt!: Date;

  @ApiProperty({
    description: 'Detalhes adicionais',
    example: { failureCount: 5, windowMinutes: 15 },
  })
  details!: Record<string, unknown>;
}

/**
 * DTO de resposta completa do dashboard
 */
export class AuditDashboardResponseDto {
  @ApiProperty({
    description: 'Estatísticas gerais',
    type: AuditDashboardStatsDto,
  })
  stats!: AuditDashboardStatsDto;

  @ApiProperty({
    description: 'Top 10 usuários mais ativos',
    type: [AuditTopUserDto],
  })
  topUsers!: AuditTopUserDto[];

  @ApiProperty({
    description: 'Top 10 entidades mais modificadas',
    type: [AuditTopEntityDto],
  })
  topEntities!: AuditTopEntityDto[];

  @ApiProperty({
    description: 'Alertas de segurança ativos',
    type: [AuditSecurityAlertDto],
  })
  securityAlerts!: AuditSecurityAlertDto[];

  @ApiProperty({
    description: 'Atividades recentes (timeline)',
    type: [AuditTimelineItemDto],
  })
  recentActivity!: AuditTimelineItemDto[];
}
