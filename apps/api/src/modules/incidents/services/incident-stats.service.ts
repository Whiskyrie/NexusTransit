import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, In, SelectQueryBuilder } from 'typeorm';
import { Incident } from '../entities/incident.entity';
import { IncidentStatusHistory } from '../entities/incident-status-history.entity';
import { IncidentStatus, IncidentSeverity, IncidentType } from '../enums/incident.enums';
import { IncidentStatsCacheService } from './incident-stats-cache.service';
import { Cacheable } from '../decorators/cacheable.decorator';
import {
  IncidentStatsFilterDto,
  IncidentStatsResponseDto,
  IncidentTrendDto,
  IncidentTrendsResponseDto,
  ResponseTimeMetricsDto,
  ResolutionTimeMetricsDto,
  IncidentDashboardDto,
} from '../dto/incident-stats.dto';

/**
 * Service para geração de estatísticas e analytics de incidentes
 */
@Injectable()
export class IncidentStatsService {
  private readonly logger = new Logger(IncidentStatsService.name);

  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(IncidentStatusHistory)
    private readonly statusHistoryRepository: Repository<IncidentStatusHistory>,
    private readonly cacheService: IncidentStatsCacheService,
  ) {}

  /**
   * Gera estatísticas gerais de incidentes
   * Cache: 120s para queries de stats gerais
   */
  @Cacheable({ ttl: 120, keyPrefix: 'general_stats', useArgs: true })
  async getGeneralStats(filterDto: IncidentStatsFilterDto): Promise<IncidentStatsResponseDto> {
    this.logger.debug(`Calculating general stats with filters: ${JSON.stringify(filterDto)}`);

    const { start_date, end_date, status, severity, type, customer_id, team_id } = filterDto;

    // Construir query base
    const queryBuilder = this.incidentRepository.createQueryBuilder('incident');

    // Aplicar filtros de data
    if (start_date || end_date) {
      const startDate = start_date ? new Date(start_date) : new Date(0);
      const endDate = end_date ? new Date(end_date) : new Date();
      queryBuilder.andWhere('incident.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Aplicar filtros específicos
    if (status) {
      queryBuilder.andWhere('incident.status = :status', { status });
    }
    if (severity) {
      queryBuilder.andWhere('incident.severity = :severity', { severity });
    }
    if (type) {
      queryBuilder.andWhere('incident.type = :type', { type });
    }
    if (customer_id) {
      queryBuilder.andWhere('incident.customer_id = :customer_id', {
        customer_id,
      });
    }
    if (team_id) {
      queryBuilder.andWhere('incident.team_id = :team_id', { team_id });
    }

    // Total de incidentes
    const totalIncidents = await queryBuilder.getCount();

    // Incidentes por status
    const incidentsByStatus = await this.getIncidentsByStatus(queryBuilder.clone());

    // Incidentes por severidade
    const incidentsBySeverity = await this.getIncidentsBySeverity(queryBuilder.clone());

    // Incidentes por tipo
    const incidentsByType = await this.getIncidentsByType(queryBuilder.clone());

    // Métricas de tempo
    const responseMetrics = await this.getResponseTimeMetrics(filterDto);
    const resolutionMetrics = await this.getResolutionTimeMetrics(filterDto);

    // Taxa de resolução
    const resolvedCount =
      (incidentsByStatus[IncidentStatus.RESOLVED] || 0) +
      (incidentsByStatus[IncidentStatus.CLOSED] || 0);
    const resolutionRate = totalIncidents > 0 ? (resolvedCount / totalIncidents) * 100 : 0;

    // Incidentes criados e resolvidos no período
    const createdIncidents = totalIncidents;
    const resolvedIncidents = resolvedCount;

    this.logger.log(`Estatísticas geradas: ${totalIncidents} incidentes`);

    return {
      total_incidents: totalIncidents,
      incidents_by_status: incidentsByStatus,
      incidents_by_severity: incidentsBySeverity,
      incidents_by_type: incidentsByType,
      avg_resolution_time_hours: resolutionMetrics.avg_resolution_time_hours,
      avg_response_time_minutes: responseMetrics.avg_response_time_minutes,
      resolution_rate: Math.round(resolutionRate * 100) / 100,
      created_incidents: createdIncidents,
      resolved_incidents: resolvedIncidents,
      period: `${start_date ?? 'ínicio'} to ${end_date ?? 'hoje'}`,
    };
  }

  /**
   * Gera análise de tendências
   * Cache: 300s para análises de período (menos volátil)
   */
  @Cacheable({ ttl: 300, keyPrefix: 'trends', useArgs: true })
  async getTrends(filterDto: IncidentStatsFilterDto): Promise<IncidentTrendsResponseDto> {
    this.logger.debug(`Calculating trends with filters: ${JSON.stringify(filterDto)}`);

    const { start_date, end_date, group_by = 'day' } = filterDto;

    if (!start_date || !end_date) {
      throw new Error('start_date e end_date são obrigatórios para análise de tendências');
    }

    // Determinar o formato de agrupamento
    const dateFormat = this.getDateTruncFormat(group_by);

    // Query para dados agrupados
    const queryBuilder = this.incidentRepository
      .createQueryBuilder('incident')
      .select(`DATE_TRUNC('${dateFormat}', incident.created_at)`, 'period')
      .addSelect('COUNT(*)', 'count')
      .where('incident.created_at BETWEEN :start_date AND :end_date', {
        start_date: new Date(start_date),
        end_date: new Date(end_date),
      })
      .groupBy(`DATE_TRUNC('${dateFormat}', incident.created_at)`)
      .orderBy('period', 'ASC');

    const results = await queryBuilder.getRawMany();

    // Calcular variação percentual
    const trendData: IncidentTrendDto[] = [];
    let previousCount = 0;

    for (const result of results) {
      const count = parseInt((result as Record<string, unknown>).count as string, 10);
      const variation = previousCount > 0 ? ((count - previousCount) / previousCount) * 100 : 0;

      trendData.push({
        period: new Date((result as Record<string, unknown>).period as string)
          .toISOString()
          .split('T')[0],
        count,
        variation: Math.round(variation * 100) / 100,
      });

      previousCount = count;
    }

    // Determinar tendência geral
    const trend = this.calculateOverallTrend(trendData);
    const totalVariation =
      trendData.length > 1 ? trendData[trendData.length - 1].count - trendData[0].count : 0;

    this.logger.log(`Tendências calculadas: ${trendData.length} períodos`);

    return {
      data: trendData,
      trend,
      total_variation: totalVariation,
    };
  }

  /**
   * Métricas para dashboard principal
   * Cache: 60s para dashboard (atualização rápida)
   * Strategy: Cache-first com fallback para DB
   */
  @Cacheable({ ttl: 60, keyPrefix: 'dashboard' })
  async getDashboardMetrics(): Promise<IncidentDashboardDto> {
    this.logger.debug('Fetching dashboard metrics');

    // Tentar obter métricas incrementais do cache
    const cachedMetrics = await this.cacheService.getIncrementalMetrics();
    if (cachedMetrics !== null && cachedMetrics !== undefined) {
      this.logger.debug('Returning cached incremental metrics');

      // Converter métricas incrementais para formato dashboard
      // Nota: Valores de tempo necessitam cálculo do DB
      const responseMetrics = await this.getResponseTimeMetrics({});
      const resolutionMetrics = await this.getResolutionTimeMetrics({});

      // Garantir tipos corretos através de conversão explícita
      const totalActive = Number(cachedMetrics.total_active ?? 0);
      const newToday = Number(cachedMetrics.by_status[IncidentStatus.REPORTED] ?? 0);
      const resolvedCount =
        Number(cachedMetrics.by_status[IncidentStatus.RESOLVED] ?? 0) +
        Number(cachedMetrics.by_status[IncidentStatus.CLOSED] ?? 0);
      const criticalCount = Number(cachedMetrics.by_severity[IncidentSeverity.CRITICAL] ?? 0);

      return {
        active_incidents: totalActive,
        new_today: newToday,
        resolved_today: resolvedCount,
        critical_incidents: criticalCount,
        avg_response_time_minutes: responseMetrics.avg_response_time_minutes,
        resolution_rate_7d: 0, // Calculado apenas no fallback completo
        response_metrics: responseMetrics,
        resolution_metrics: resolutionMetrics,
      };
    }

    // Fallback: calcular do banco de dados
    this.logger.debug('Cache miss, calculating dashboard metrics from DB');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Incidentes ativos
    const activeIncidents = await this.incidentRepository.count({
      where: {
        status: In([
          IncidentStatus.REPORTED,
          IncidentStatus.IN_PROGRESS,
          IncidentStatus.INVESTIGATING,
        ]),
      },
    });

    // Novos incidentes hoje
    const newToday = await this.incidentRepository.count({
      where: {
        created_at: MoreThanOrEqual(today),
      },
    });

    // Resolvidos hoje
    const resolvedToday = await this.incidentRepository.count({
      where: {
        status: In([IncidentStatus.RESOLVED, IncidentStatus.CLOSED]),
        updated_at: MoreThanOrEqual(today),
      },
    });

    // Incidentes críticos
    const criticalIncidents = await this.incidentRepository.count({
      where: {
        severity: IncidentSeverity.CRITICAL,
        status: In([
          IncidentStatus.REPORTED,
          IncidentStatus.IN_PROGRESS,
          IncidentStatus.INVESTIGATING,
        ]),
      },
    });

    // Métricas de tempo
    const responseMetrics = await this.getResponseTimeMetrics({});
    const resolutionMetrics = await this.getResolutionTimeMetrics({});

    // Taxa de resolução (7 dias)
    const resolutionRate7d = await this.getResolutionRate7Days(sevenDaysAgo, now);

    // Agregações por categoria
    const bySeverity = await this.getIncidentsBySeverity(
      this.incidentRepository.createQueryBuilder('incident'),
    );
    const byStatus = await this.getIncidentsByStatus(
      this.incidentRepository.createQueryBuilder('incident'),
    );
    const byType = await this.getIncidentsByType(
      this.incidentRepository.createQueryBuilder('incident'),
    );

    this.logger.log('Métricas do dashboard calculadas do banco de dados');

    const dashboardMetrics: IncidentDashboardDto = {
      active_incidents: activeIncidents,
      new_today: newToday,
      resolved_today: resolvedToday,
      critical_incidents: criticalIncidents,
      avg_response_time_minutes: responseMetrics.avg_response_time_minutes,
      resolution_rate_7d: Math.round(resolutionRate7d * 100) / 100,
      response_metrics: responseMetrics,
      resolution_metrics: resolutionMetrics,
    };

    // Atualizar cache com métricas calculadas
    // Incrementar contadores totais
    const totalIncidents = activeIncidents + resolvedToday;
    for (let i = 0; i < totalIncidents; i++) {
      await this.cacheService.updateIncrementalMetrics({});
    }

    // Atualizar métricas de status
    for (const [status, count] of Object.entries(byStatus)) {
      for (let i = 0; i < count; i++) {
        await this.cacheService.updateIncrementalMetrics({
          status: status as IncidentStatus,
        });
      }
    }

    // Atualizar métricas de severidade
    for (const [severity, count] of Object.entries(bySeverity)) {
      for (let i = 0; i < count; i++) {
        await this.cacheService.updateIncrementalMetrics({
          severity: severity as IncidentSeverity,
        });
      }
    }

    // Atualizar métricas de tipo
    for (const [type, count] of Object.entries(byType)) {
      for (let i = 0; i < count; i++) {
        await this.cacheService.updateIncrementalMetrics({
          type: type as IncidentType,
        });
      }
    }

    return dashboardMetrics;
  }

  // Métodos privados auxiliares

  /**
   * Obtém contagem de incidentes por status
   */
  private async getIncidentsByStatus(
    queryBuilder: SelectQueryBuilder<Incident>,
  ): Promise<Record<string, number>> {
    const qb = queryBuilder
      .select('incident.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('incident.status');

    const results = await qb.getRawMany();

    const stats: Record<string, number> = {};
    for (const result of results) {
      const r = result as Record<string, unknown>;
      stats[r.status as string] = parseInt(r.count as string, 10);
    }

    return stats;
  }

  /**
   * Obtém contagem de incidentes por severidade
   */
  private async getIncidentsBySeverity(
    queryBuilder: SelectQueryBuilder<Incident>,
  ): Promise<Record<string, number>> {
    const qb = queryBuilder
      .select('incident.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('incident.severity');

    const results = await qb.getRawMany();

    const stats: Record<string, number> = {};
    for (const result of results) {
      const r = result as Record<string, unknown>;
      stats[r.severity as string] = parseInt(r.count as string, 10);
    }

    return stats;
  }

  /**
   * Obtém contagem de incidentes por tipo
   */
  private async getIncidentsByType(
    queryBuilder: SelectQueryBuilder<Incident>,
  ): Promise<Record<string, number>> {
    const qb = queryBuilder
      .select('incident.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('incident.type');

    const results = await qb.getRawMany();

    const stats: Record<string, number> = {};
    for (const result of results) {
      const r = result as Record<string, unknown>;
      stats[r.type as string] = parseInt(r.count as string, 10);
    }

    return stats;
  }

  /**
   * Calcula métricas de tempo de resposta
   */
  private async getResponseTimeMetrics(
    filterDto: IncidentStatsFilterDto,
  ): Promise<ResponseTimeMetricsDto> {
    const { start_date, end_date } = filterDto;

    // Query para calcular tempos de resposta
    // Considera o tempo entre criação e primeiro status IN_PROGRESS
    const qb = this.statusHistoryRepository
      .createQueryBuilder('history')
      .select(
        'EXTRACT(EPOCH FROM (history.created_at - incident.created_at)) / 60',
        'response_time_minutes',
      )
      .innerJoin('history.incident', 'incident')
      .where('history.new_status = :status', {
        status: IncidentStatus.IN_PROGRESS,
      })
      .andWhere(
        `history.id IN (
        SELECT MIN(h2.id) 
        FROM incident_status_history h2 
        WHERE h2.incident_id = history.incident_id 
        AND h2.new_status = :status
      )`,
        { status: IncidentStatus.IN_PROGRESS },
      );

    if (start_date) {
      qb.andWhere('incident.created_at >= :start_date', {
        start_date: new Date(start_date),
      });
    }
    if (end_date) {
      qb.andWhere('incident.created_at <= :end_date', {
        end_date: new Date(end_date),
      });
    }

    const results = await qb.getRawMany();

    if (results.length === 0) {
      return {
        avg_response_time_minutes: 0,
        min_response_time_minutes: 0,
        max_response_time_minutes: 0,
        median_response_time_minutes: 0,
      };
    }

    const times = results
      .map(r => parseFloat((r as Record<string, unknown>).response_time_minutes as string))
      .filter(t => !isNaN(t) && t >= 0)
      .sort((a, b) => a - b);

    if (times.length === 0) {
      return {
        avg_response_time_minutes: 0,
        min_response_time_minutes: 0,
        max_response_time_minutes: 0,
        median_response_time_minutes: 0,
      };
    }

    const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
    const median =
      times.length % 2 === 0
        ? (times[times.length / 2 - 1] + times[times.length / 2]) / 2
        : times[Math.floor(times.length / 2)];

    return {
      avg_response_time_minutes: Math.round(avg * 100) / 100,
      min_response_time_minutes: Math.round(times[0] * 100) / 100,
      max_response_time_minutes: Math.round(times[times.length - 1] * 100) / 100,
      median_response_time_minutes: Math.round(median * 100) / 100,
    };
  }

  /**
   * Calcula métricas de tempo de resolução
   */
  private async getResolutionTimeMetrics(
    filterDto: IncidentStatsFilterDto,
  ): Promise<ResolutionTimeMetricsDto> {
    const { start_date, end_date } = filterDto;

    // Query para calcular tempos de resolução
    const qb = this.incidentRepository
      .createQueryBuilder('incident')
      .select(
        'EXTRACT(EPOCH FROM (incident.updated_at - incident.created_at)) / 3600',
        'resolution_time_hours',
      )
      .where('incident.status IN (:...statuses)', {
        statuses: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED],
      });

    if (start_date) {
      qb.andWhere('incident.created_at >= :start_date', {
        start_date: new Date(start_date),
      });
    }
    if (end_date) {
      qb.andWhere('incident.created_at <= :end_date', {
        end_date: new Date(end_date),
      });
    }

    const results = await qb.getRawMany();

    if (results.length === 0) {
      return {
        avg_resolution_time_hours: 0,
        min_resolution_time_hours: 0,
        max_resolution_time_hours: 0,
        median_resolution_time_hours: 0,
      };
    }

    const times = results
      .map(r => parseFloat((r as Record<string, unknown>).resolution_time_hours as string))
      .filter(t => !isNaN(t) && t >= 0)
      .sort((a, b) => a - b);

    if (times.length === 0) {
      return {
        avg_resolution_time_hours: 0,
        min_resolution_time_hours: 0,
        max_resolution_time_hours: 0,
        median_resolution_time_hours: 0,
      };
    }

    const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
    const median =
      times.length % 2 === 0
        ? (times[times.length / 2 - 1] + times[times.length / 2]) / 2
        : times[Math.floor(times.length / 2)];

    return {
      avg_resolution_time_hours: Math.round(avg * 100) / 100,
      min_resolution_time_hours: Math.round(times[0] * 100) / 100,
      max_resolution_time_hours: Math.round(times[times.length - 1] * 100) / 100,
      median_resolution_time_hours: Math.round(median * 100) / 100,
    };
  }

  /**
   * Calcula taxa de resolução nos últimos 7 dias
   */
  private async getResolutionRate7Days(startDate: Date, endDate: Date): Promise<number> {
    const total = await this.incidentRepository.count({
      where: {
        created_at: Between(startDate, endDate),
      },
    });

    if (total === 0) {
      return 0;
    }

    const resolved = await this.incidentRepository.count({
      where: {
        created_at: Between(startDate, endDate),
        status: In([IncidentStatus.RESOLVED, IncidentStatus.CLOSED]),
      },
    });

    return (resolved / total) * 100;
  }

  /**
   * Obtém formato de truncamento de data para o PostgreSQL
   */
  private getDateTruncFormat(groupBy: string): string {
    switch (groupBy) {
      case 'day':
        return 'day';
      case 'week':
        return 'week';
      case 'month':
        return 'month';
      default:
        return 'day';
    }
  }

  /**
   * Calcula tendência geral baseada nos dados
   */
  private calculateOverallTrend(data: IncidentTrendDto[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) {
      return 'stable';
    }

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((sum, item) => sum + item.count, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.count, 0) / secondHalf.length;

    const variation = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (variation > 5) {
      return 'increasing';
    }
    if (variation < -5) {
      return 'decreasing';
    }
    return 'stable';
  }
}
