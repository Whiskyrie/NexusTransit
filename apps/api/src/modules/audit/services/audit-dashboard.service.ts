import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { AuditLogEntity, AuditAction, AuditCategory } from '@nexus/audit';
import { subDays, subMonths, subYears, startOfDay, endOfDay, differenceInHours } from 'date-fns';
import { AUDIT_DASHBOARD, AUDIT_ALERT_THRESHOLDS } from '../constants/audit.constants';
import {
  DashboardPeriod,
  AuditDashboardFilterDto,
  AuditTimelineFilterDto,
  AuditDashboardStatsDto,
  AuditTopUserDto,
  AuditTopEntityDto,
  AuditSecurityAlertDto,
  AuditTimelineItemDto,
  AuditDashboardResponseDto,
} from '../dto/audit-dashboard.dto';

/**
 * Service para Dashboard de Auditoria
 *
 * Fornece análises avançadas, estatísticas agregadas e detecção de
 * atividades suspeitas nos logs de auditoria.
 */
@Injectable()
export class AuditDashboardService {
  private readonly logger = new Logger(AuditDashboardService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  /**
   * Obtém dashboard completo com todas as informações
   */
  async getDashboard(filterDto: AuditDashboardFilterDto): Promise<AuditDashboardResponseDto> {
    const { startDate, endDate } = this.getDateRange(filterDto);

    const [stats, topUsers, topEntities, securityAlerts, recentActivity] = await Promise.all([
      this.getStats(filterDto),
      this.getTopUsers(startDate, endDate, filterDto.category),
      this.getTopEntities(startDate, endDate, filterDto.category),
      this.getSecurityAlerts(),
      this.getTimeline({ limit: 20 }),
    ]);

    return {
      stats,
      topUsers,
      topEntities,
      securityAlerts,
      recentActivity,
    };
  }

  /**
   * Obtém estatísticas gerais do dashboard
   */
  async getStats(filterDto: AuditDashboardFilterDto): Promise<AuditDashboardStatsDto> {
    const { startDate, endDate } = this.getDateRange(filterDto);
    const { previousStart, previousEnd } = this.getPreviousPeriod(startDate, endDate);

    // Consultas em paralelo para melhor performance
    const [
      totalEvents,
      previousTotalEvents,
      activeUsers,
      previousActiveUsers,
      actionDistribution,
      categoryDistribution,
      eventsTrend,
      avgResponseTime,
      errorCount,
    ] = await Promise.all([
      // Total de eventos atual
      this.auditLogRepository.count({
        where: { created_at: Between(startDate, endDate) },
      }),
      // Total de eventos período anterior
      this.auditLogRepository.count({
        where: { created_at: Between(previousStart, previousEnd) },
      }),
      // Usuários ativos
      this.countActiveUsers(startDate, endDate),
      // Usuários ativos período anterior
      this.countActiveUsers(previousStart, previousEnd),
      // Distribuição por ação
      this.getActionDistribution(startDate, endDate, filterDto.category),
      // Distribuição por categoria
      this.getCategoryDistribution(startDate, endDate),
      // Tendência de eventos
      this.getEventsTrend(startDate, endDate),
      // Tempo médio de resposta
      this.getAvgResponseTime(startDate, endDate),
      // Contagem de erros
      this.getErrorCount(startDate, endDate),
    ]);

    const totalEventsChange = this.calculatePercentChange(previousTotalEvents, totalEvents);
    const activeUsersChange = this.calculatePercentChange(previousActiveUsers, activeUsers);
    const errorRate = totalEvents > 0 ? (errorCount / totalEvents) * 100 : 0;

    return {
      totalEvents,
      totalEventsChange,
      activeUsers,
      activeUsersChange,
      actionDistribution,
      categoryDistribution,
      eventsTrend,
      avgResponseTime,
      errorRate: Math.round(errorRate * 100) / 100,
      period: filterDto.period ?? DashboardPeriod.WEEK,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  /**
   * Obtém timeline de atividades recentes
   */
  async getTimeline(filterDto: AuditTimelineFilterDto): Promise<AuditTimelineItemDto[]> {
    const { limit = AUDIT_DASHBOARD.TIMELINE_LIMIT, action, category, resourceType } = filterDto;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .select([
        'log.id',
        'log.action',
        'log.category',
        'log.resourceType',
        'log.resourceId',
        'log.userEmail',
        'log.description',
        'log.created_at',
        'log.oldValues',
        'log.newValues',
      ])
      .orderBy('log.created_at', 'DESC')
      .take(limit);

    if (action) {
      queryBuilder.andWhere('log.action = :action', { action });
    }

    if (category) {
      queryBuilder.andWhere('log.category = :category', { category });
    }

    if (resourceType) {
      queryBuilder.andWhere('log.resourceType = :resourceType', { resourceType });
    }

    const logs = await queryBuilder.getMany();

    return logs.map(log => ({
      id: log.id,
      action: log.action,
      category: log.category,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      userEmail: log.userEmail,
      description: log.description,
      timestamp: log.created_at,
      changedFields: this.extractChangedFields(log.oldValues, log.newValues),
    }));
  }

  /**
   * Obtém top usuários mais ativos
   */
  async getTopUsers(
    startDate: Date,
    endDate: Date,
    category?: AuditCategory,
  ): Promise<AuditTopUserDto[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.userId', 'userId')
      .addSelect('log.userEmail', 'userEmail')
      .addSelect('log.userRole', 'userRole')
      .addSelect('COUNT(*)', 'totalActions')
      .addSelect('MAX(log.created_at)', 'lastActivity')
      .where('log.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('log.userId IS NOT NULL')
      .groupBy('log.userId')
      .addGroupBy('log.userEmail')
      .addGroupBy('log.userRole')
      .orderBy('totalActions', 'DESC')
      .limit(AUDIT_DASHBOARD.TOP_USERS_LIMIT);

    if (category) {
      queryBuilder.andWhere('log.category = :category', { category });
    }

    const results = await queryBuilder.getRawMany<{
      userId: string;
      userEmail: string;
      userRole: string;
      totalActions: string;
      lastActivity: string;
    }>();

    // Buscar breakdown de ações para cada usuário
    const usersWithBreakdown = await Promise.all(
      results.map(async user => {
        const breakdown = await this.getUserActionBreakdown(user.userId, startDate, endDate);
        return {
          userId: user.userId,
          userEmail: user.userEmail,
          userRole: user.userRole,
          totalActions: parseInt(user.totalActions, 10),
          lastActivity: new Date(user.lastActivity),
          actionBreakdown: breakdown,
        };
      }),
    );

    return usersWithBreakdown;
  }

  /**
   * Obtém top entidades mais modificadas
   */
  async getTopEntities(
    startDate: Date,
    endDate: Date,
    category?: AuditCategory,
  ): Promise<AuditTopEntityDto[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.resourceType', 'entityType')
      .addSelect('COUNT(*)', 'totalModifications')
      .addSelect(`SUM(CASE WHEN log.action = '${AuditAction.CREATE}' THEN 1 ELSE 0 END)`, 'creates')
      .addSelect(`SUM(CASE WHEN log.action = '${AuditAction.UPDATE}' THEN 1 ELSE 0 END)`, 'updates')
      .addSelect(`SUM(CASE WHEN log.action = '${AuditAction.DELETE}' THEN 1 ELSE 0 END)`, 'deletes')
      .where('log.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('log.resourceType IS NOT NULL')
      .groupBy('log.resourceType')
      .orderBy('totalModifications', 'DESC')
      .limit(AUDIT_DASHBOARD.TOP_ENTITIES_LIMIT);

    if (category) {
      queryBuilder.andWhere('log.category = :category', { category });
    }

    const results = await queryBuilder.getRawMany<{
      entityType: string;
      totalModifications: string;
      creates: string;
      updates: string;
      deletes: string;
    }>();

    // Calcular período anterior para comparação
    const { previousStart, previousEnd } = this.getPreviousPeriod(startDate, endDate);

    return Promise.all(
      results.map(async entity => {
        const previousCount = await this.auditLogRepository.count({
          where: {
            resourceType: entity.entityType,
            created_at: Between(previousStart, previousEnd),
          },
        });

        const changePercent = this.calculatePercentChange(
          previousCount,
          parseInt(entity.totalModifications, 10),
        );

        return {
          entityType: entity.entityType,
          totalModifications: parseInt(entity.totalModifications, 10),
          creates: parseInt(entity.creates ?? '0', 10),
          updates: parseInt(entity.updates ?? '0', 10),
          deletes: parseInt(entity.deletes ?? '0', 10),
          changePercent,
        };
      }),
    );
  }

  /**
   * Detecta e retorna alertas de segurança
   */
  async getSecurityAlerts(): Promise<AuditSecurityAlertDto[]> {
    const alerts: AuditSecurityAlertDto[] = [];
    const now = new Date();

    // 1. Detectar múltiplas falhas de login
    const loginFailures = await this.detectLoginFailures(now);
    alerts.push(...loginFailures);

    // 2. Detectar exclusões em massa
    const bulkDeletes = await this.detectBulkDeletes(now);
    alerts.push(...bulkDeletes);

    // 3. Detectar atividade alta de um único usuário
    const highActivity = await this.detectHighActivity(now);
    alerts.push(...highActivity);

    // 4. Detectar acesso de múltiplos IPs
    const multipleIps = await this.detectMultipleIps(now);
    alerts.push(...multipleIps);

    // Ordenar por severidade e data
    const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return b.detectedAt.getTime() - a.detectedAt.getTime();
    });
  }

  // ============= Métodos Auxiliares Privados =============

  /**
   * Obtém range de datas baseado nos filtros
   */
  private getDateRange(filterDto: AuditDashboardFilterDto): {
    startDate: Date;
    endDate: Date;
  } {
    if (filterDto.startDate && filterDto.endDate) {
      return {
        startDate: startOfDay(new Date(filterDto.startDate)),
        endDate: endOfDay(new Date(filterDto.endDate)),
      };
    }

    const endDate = endOfDay(new Date());
    let startDate: Date;

    switch (filterDto.period) {
      case DashboardPeriod.DAY:
        startDate = startOfDay(new Date());
        break;
      case DashboardPeriod.MONTH:
        startDate = startOfDay(subDays(new Date(), 30));
        break;
      case DashboardPeriod.QUARTER:
        startDate = startOfDay(subMonths(new Date(), 3));
        break;
      case DashboardPeriod.YEAR:
        startDate = startOfDay(subYears(new Date(), 1));
        break;
      case DashboardPeriod.WEEK:
      default:
        startDate = startOfDay(subDays(new Date(), 7));
    }

    return { startDate, endDate };
  }

  /**
   * Calcula período anterior para comparações
   */
  private getPreviousPeriod(
    startDate: Date,
    endDate: Date,
  ): { previousStart: Date; previousEnd: Date } {
    const duration = endDate.getTime() - startDate.getTime();
    return {
      previousStart: new Date(startDate.getTime() - duration),
      previousEnd: new Date(endDate.getTime() - duration),
    };
  }

  /**
   * Calcula variação percentual
   */
  private calculatePercentChange(previous: number, current: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    const change = ((current - previous) / previous) * 100;
    return Math.round(change * 100) / 100;
  }

  /**
   * Conta usuários ativos no período
   */
  private async countActiveUsers(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.userId)', 'count')
      .where('log.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('log.userId IS NOT NULL')
      .getRawOne<{ count: string }>();

    return parseInt(result?.count ?? '0', 10);
  }

  /**
   * Obtém distribuição de ações
   */
  private async getActionDistribution(
    startDate: Date,
    endDate: Date,
    category?: AuditCategory,
  ): Promise<Record<string, number>> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('log.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('log.action');

    if (category) {
      queryBuilder.andWhere('log.category = :category', { category });
    }

    const results = await queryBuilder.getRawMany<{ action: string; count: string }>();

    return results.reduce<Record<string, number>>((acc, item) => {
      acc[item.action] = parseInt(item.count, 10);
      return acc;
    }, {});
  }

  /**
   * Obtém distribuição por categoria
   */
  private async getCategoryDistribution(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const results = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('log.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('log.category')
      .getRawMany<{ category: string; count: string }>();

    return results.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = parseInt(item.count, 10);
      return acc;
    }, {});
  }

  /**
   * Obtém tendência de eventos (por hora ou dia)
   */
  private async getEventsTrend(
    startDate: Date,
    endDate: Date,
  ): Promise<{ label: string; count: number }[]> {
    const hoursDiff = differenceInHours(endDate, startDate);
    const groupByHour = hoursDiff <= 48;

    let results: { label: string; count: string }[];

    if (groupByHour) {
      results = await this.auditLogRepository
        .createQueryBuilder('log')
        .select("TO_CHAR(log.created_at, 'YYYY-MM-DD HH24:00')", 'label')
        .addSelect('COUNT(*)', 'count')
        .where('log.created_at BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .groupBy("TO_CHAR(log.created_at, 'YYYY-MM-DD HH24:00')")
        .orderBy('label', 'ASC')
        .getRawMany<{ label: string; count: string }>();
    } else {
      results = await this.auditLogRepository
        .createQueryBuilder('log')
        .select('DATE(log.created_at)', 'label')
        .addSelect('COUNT(*)', 'count')
        .where('log.created_at BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .groupBy('DATE(log.created_at)')
        .orderBy('label', 'ASC')
        .getRawMany<{ label: string; count: string }>();
    }

    return results.map(r => ({
      label: String(r.label),
      count: parseInt(r.count, 10),
    }));
  }

  /**
   * Obtém tempo médio de resposta
   */
  private async getAvgResponseTime(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('AVG(log.executionTimeMs)', 'avg')
      .where('log.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('log.executionTimeMs IS NOT NULL')
      .getRawOne<{ avg: string | null }>();

    return Math.round(parseFloat(result?.avg ?? '0') * 100) / 100;
  }

  /**
   * Conta eventos de erro
   */
  private async getErrorCount(startDate: Date, endDate: Date): Promise<number> {
    return this.auditLogRepository.count({
      where: {
        created_at: Between(startDate, endDate),
        statusCode: MoreThanOrEqual(400),
      },
    });
  }

  /**
   * Obtém breakdown de ações de um usuário
   */
  private async getUserActionBreakdown(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const results = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('log.userId = :userId', { userId })
      .andWhere('log.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('log.action')
      .getRawMany<{ action: string; count: string }>();

    return results.reduce<Record<string, number>>((acc, item) => {
      acc[item.action] = parseInt(item.count, 10);
      return acc;
    }, {});
  }

  /**
   * Extrai campos alterados comparando valores antigos e novos
   */
  private extractChangedFields(
    oldValues: Record<string, unknown> | null,
    newValues: Record<string, unknown> | null,
  ): string[] {
    if (!oldValues && !newValues) {
      return [];
    }

    const allKeys = new Set([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})]);

    const changedFields: string[] = [];

    for (const key of allKeys) {
      const oldVal = oldValues?.[key];
      const newVal = newValues?.[key];

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  // ============= Detecção de Alertas =============

  /**
   * Detecta múltiplas falhas de login
   */
  private async detectLoginFailures(now: Date): Promise<AuditSecurityAlertDto[]> {
    const windowStart = new Date(
      now.getTime() - AUDIT_ALERT_THRESHOLDS.LOGIN_FAILURES_WINDOW_MINUTES * 60 * 1000,
    );

    const results = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.userId', 'userId')
      .addSelect('log.userEmail', 'userEmail')
      .addSelect('log.ipAddress', 'ipAddress')
      .addSelect('COUNT(*)', 'failureCount')
      .where('log.action = :action', { action: AuditAction.FAILED_LOGIN })
      .andWhere('log.created_at >= :windowStart', { windowStart })
      .groupBy('log.userId')
      .addGroupBy('log.userEmail')
      .addGroupBy('log.ipAddress')
      .having('COUNT(*) >= :threshold', {
        threshold: AUDIT_ALERT_THRESHOLDS.LOGIN_FAILURES_THRESHOLD,
      })
      .getRawMany<{
        userId: string | null;
        userEmail: string | null;
        ipAddress: string | null;
        failureCount: string;
      }>();

    return results.map((r, index) => ({
      id: `login-failure-${index}-${Date.now()}`,
      type: 'MULTIPLE_LOGIN_FAILURES',
      severity: 'HIGH' as const,
      message: `Múltiplas falhas de login detectadas: ${r.userEmail ?? r.userId ?? `IP ${r.ipAddress}`}`,
      userId: r.userId ?? undefined,
      userEmail: r.userEmail ?? undefined,
      ipAddress: r.ipAddress ?? undefined,
      detectedAt: now,
      details: {
        failureCount: parseInt(r.failureCount, 10),
        windowMinutes: AUDIT_ALERT_THRESHOLDS.LOGIN_FAILURES_WINDOW_MINUTES,
      },
    }));
  }

  /**
   * Detecta exclusões em massa
   */
  private async detectBulkDeletes(now: Date): Promise<AuditSecurityAlertDto[]> {
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000); // última hora

    const results = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.userId', 'userId')
      .addSelect('log.userEmail', 'userEmail')
      .addSelect('log.resourceType', 'resourceType')
      .addSelect('COUNT(*)', 'deleteCount')
      .where('log.action = :action', { action: AuditAction.DELETE })
      .andWhere('log.created_at >= :windowStart', { windowStart })
      .groupBy('log.userId')
      .addGroupBy('log.userEmail')
      .addGroupBy('log.resourceType')
      .having('COUNT(*) >= :threshold', {
        threshold: AUDIT_ALERT_THRESHOLDS.BULK_DELETE_THRESHOLD,
      })
      .getRawMany<{
        userId: string | null;
        userEmail: string | null;
        resourceType: string;
        deleteCount: string;
      }>();

    return results.map((r, index) => ({
      id: `bulk-delete-${index}-${Date.now()}`,
      type: 'BULK_DELETE',
      severity: 'CRITICAL' as const,
      message: `Exclusão em massa detectada: ${r.deleteCount} ${r.resourceType} por ${r.userEmail ?? r.userId}`,
      userId: r.userId ?? undefined,
      userEmail: r.userEmail ?? undefined,
      detectedAt: now,
      details: {
        deleteCount: parseInt(r.deleteCount, 10),
        resourceType: r.resourceType,
        windowHours: 1,
      },
    }));
  }

  /**
   * Detecta atividade muito alta de um usuário
   */
  private async detectHighActivity(now: Date): Promise<AuditSecurityAlertDto[]> {
    const windowStart = new Date(now.getTime() - 60 * 1000); // último minuto

    const results = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.userId', 'userId')
      .addSelect('log.userEmail', 'userEmail')
      .addSelect('COUNT(*)', 'activityCount')
      .where('log.created_at >= :windowStart', { windowStart })
      .andWhere('log.userId IS NOT NULL')
      .groupBy('log.userId')
      .addGroupBy('log.userEmail')
      .having('COUNT(*) >= :threshold', {
        threshold: AUDIT_ALERT_THRESHOLDS.HIGH_ACTIVITY_PER_MINUTE,
      })
      .getRawMany<{
        userId: string;
        userEmail: string | null;
        activityCount: string;
      }>();

    return results.map((r, index) => ({
      id: `high-activity-${index}-${Date.now()}`,
      type: 'HIGH_ACTIVITY',
      severity: 'MEDIUM' as const,
      message: `Atividade muito alta: ${r.activityCount} ações/minuto por ${r.userEmail ?? r.userId}`,
      userId: r.userId,
      userEmail: r.userEmail ?? undefined,
      detectedAt: now,
      details: {
        activityCount: parseInt(r.activityCount, 10),
        windowMinutes: 1,
      },
    }));
  }

  /**
   * Detecta acesso de múltiplos IPs para mesmo usuário
   */
  private async detectMultipleIps(now: Date): Promise<AuditSecurityAlertDto[]> {
    const windowStart = new Date(
      now.getTime() - AUDIT_ALERT_THRESHOLDS.DIFFERENT_IPS_WINDOW_MINUTES * 60 * 1000,
    );

    const results = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.userId', 'userId')
      .addSelect('log.userEmail', 'userEmail')
      .addSelect('COUNT(DISTINCT log.ipAddress)', 'ipCount')
      .where('log.created_at >= :windowStart', { windowStart })
      .andWhere('log.userId IS NOT NULL')
      .andWhere('log.ipAddress IS NOT NULL')
      .groupBy('log.userId')
      .addGroupBy('log.userEmail')
      .having('COUNT(DISTINCT log.ipAddress) >= :threshold', {
        threshold: AUDIT_ALERT_THRESHOLDS.DIFFERENT_IPS_THRESHOLD,
      })
      .getRawMany<{
        userId: string;
        userEmail: string | null;
        ipCount: string;
      }>();

    return results.map((r, index) => ({
      id: `multiple-ips-${index}-${Date.now()}`,
      type: 'MULTIPLE_IPS',
      severity: 'MEDIUM' as const,
      message: `Acesso de ${r.ipCount} IPs diferentes: ${r.userEmail ?? r.userId}`,
      userId: r.userId,
      userEmail: r.userEmail ?? undefined,
      detectedAt: now,
      details: {
        ipCount: parseInt(r.ipCount, 10),
        windowMinutes: AUDIT_ALERT_THRESHOLDS.DIFFERENT_IPS_WINDOW_MINUTES,
      },
    }));
  }
}
