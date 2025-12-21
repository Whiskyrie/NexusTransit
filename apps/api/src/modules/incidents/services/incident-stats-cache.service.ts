import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IncidentStatsFilterDto } from '../dto/incident-stats.dto';
import { IncidentStatus, IncidentSeverity, IncidentType } from '../enums/incident.enums';

/**
 * Interface para métricas incrementais em cache
 */
export interface CachedMetrics {
  total_incidents: number;
  total_active: number;
  by_status: Record<string, number>;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  resolved_count: number;
  last_updated: Date;
}

/**
 * Service para gerenciar cache Redis de estatísticas de incidentes
 *
 * Estratégias de cache:
 * - Dashboard geral: 60s TTL
 * - Métricas específicas: 120s TTL
 * - Estatísticas por período: 300s TTL
 */
@Injectable()
export class IncidentStatsCacheService {
  private readonly logger = new Logger(IncidentStatsCacheService.name);

  // Prefixos para chaves de cache
  private readonly CACHE_PREFIX = 'incident:stats';
  private readonly METRICS_PREFIX = 'incident:metrics';
  private readonly COUNTER_PREFIX = 'incident:counter';

  // TTLs em segundos
  private readonly DEFAULT_TTL = 60; // 1 minuto
  private readonly DASHBOARD_TTL = 60; // 1 minuto
  private readonly METRICS_TTL = 120; // 2 minutos
  private readonly PERIOD_TTL = 300; // 5 minutos

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Gera chave de cache baseada em filtros
   */
  private generateCacheKey(prefix: string, filterDto?: IncidentStatsFilterDto): string {
    if (!filterDto) {
      return `${this.CACHE_PREFIX}:${prefix}:all`;
    }

    const parts: string[] = [this.CACHE_PREFIX, prefix];

    if (filterDto.start_date) {
      parts.push(`start:${filterDto.start_date}`);
    }
    if (filterDto.end_date) {
      parts.push(`end:${filterDto.end_date}`);
    }
    if (filterDto.status) {
      parts.push(`status:${filterDto.status}`);
    }
    if (filterDto.severity) {
      parts.push(`severity:${filterDto.severity}`);
    }
    if (filterDto.type) {
      parts.push(`type:${filterDto.type}`);
    }
    if (filterDto.team_id) {
      parts.push(`team:${filterDto.team_id}`);
    }
    if (filterDto.customer_id) {
      parts.push(`customer:${filterDto.customer_id}`);
    }

    return parts.join(':');
  }

  /**
   * Obtém estatísticas do cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.cacheManager.get<T>(key);
      if (cached) {
        this.logger.debug(`Cache hit: ${key}`);
      }
      return cached ?? null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Armazena estatísticas no cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl ?? this.DEFAULT_TTL);
      this.logger.debug(`Cache set: ${key} (TTL: ${ttl ?? this.DEFAULT_TTL}s)`);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  /**
   * Remove entrada do cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  /**
   * Invalida cache relacionado a um incidente
   */
  async invalidateIncidentCache(incidentData: {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    type?: IncidentType;
    team_id?: string;
  }): Promise<void> {
    const keysToInvalidate: string[] = [];

    // Invalidar dashboard geral
    keysToInvalidate.push(`${this.CACHE_PREFIX}:dashboard:all`);
    keysToInvalidate.push(`${this.CACHE_PREFIX}:general:all`);

    // Invalidar por status
    if (incidentData.status) {
      keysToInvalidate.push(`${this.CACHE_PREFIX}:general:status:${incidentData.status}`);
    }

    // Invalidar por severidade
    if (incidentData.severity) {
      keysToInvalidate.push(`${this.CACHE_PREFIX}:general:severity:${incidentData.severity}`);
    }

    // Invalidar por tipo
    if (incidentData.type) {
      keysToInvalidate.push(`${this.CACHE_PREFIX}:general:type:${incidentData.type}`);
    }

    // Invalidar por equipe
    if (incidentData.team_id) {
      keysToInvalidate.push(`${this.CACHE_PREFIX}:general:team:${incidentData.team_id}`);
    }

    this.logger.log(`Invalidating ${keysToInvalidate.length} cache keys`);

    await Promise.all(keysToInvalidate.map(key => this.delete(key)));
  }

  /**
   * Obtém métricas incrementais do cache
   */
  async getIncrementalMetrics(): Promise<CachedMetrics | null> {
    const key = `${this.METRICS_PREFIX}:incremental`;
    return this.get<CachedMetrics>(key);
  }

  /**
   * Atualiza métricas incrementais
   */
  async updateIncrementalMetrics(update: {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    type?: IncidentType;
    increment?: number;
  }): Promise<void> {
    const key = `${this.METRICS_PREFIX}:incremental`;
    let metrics = await this.getIncrementalMetrics();

    metrics ??= {
      total_incidents: 0,
      total_active: 0,
      by_status: {},
      by_severity: {},
      by_type: {},
      resolved_count: 0,
      last_updated: new Date(),
    };

    const increment = update.increment ?? 1;

    // Atualizar total
    metrics.total_incidents += increment;

    // Atualizar por status
    if (update.status) {
      metrics.by_status[update.status] = (metrics.by_status[update.status] ?? 0) + increment;

      // Atualizar contagem de resolvidos
      if (update.status === IncidentStatus.RESOLVED || update.status === IncidentStatus.CLOSED) {
        metrics.resolved_count += increment;
      }
    }

    // Atualizar por severidade
    if (update.severity) {
      metrics.by_severity[update.severity] =
        (metrics.by_severity[update.severity] ?? 0) + increment;
    }

    // Atualizar por tipo
    if (update.type) {
      metrics.by_type[update.type] = (metrics.by_type[update.type] ?? 0) + increment;
    }

    metrics.last_updated = new Date();

    await this.set(key, metrics, this.METRICS_TTL);

    this.logger.debug('Incremental metrics updated');
  }

  /**
   * Incrementa contador específico
   */
  async incrementCounter(counterName: string, amount = 1): Promise<number> {
    const key = `${this.COUNTER_PREFIX}:${counterName}`;

    try {
      const current = (await this.get<number>(key)) ?? 0;
      const newValue = current + amount;
      await this.set(key, newValue, this.METRICS_TTL);

      this.logger.debug(`Counter ${counterName} incremented to ${newValue}`);

      return newValue;
    } catch (error) {
      this.logger.error(`Error incrementing counter ${counterName}:`, error);
      return 0;
    }
  }

  /**
   * Obtém valor de contador
   */
  async getCounter(counterName: string): Promise<number> {
    const key = `${this.COUNTER_PREFIX}:${counterName}`;
    return (await this.get<number>(key)) ?? 0;
  }

  /**
   * Reseta contador
   */
  async resetCounter(counterName: string): Promise<void> {
    const key = `${this.COUNTER_PREFIX}:${counterName}`;
    await this.delete(key);
    this.logger.debug(`Counter ${counterName} reset`);
  }

  /**
   * Obtém chave de cache para estatísticas gerais
   */
  getGeneralStatsKey(filterDto?: IncidentStatsFilterDto): string {
    return this.generateCacheKey('general', filterDto);
  }

  /**
   * Obtém chave de cache para dashboard
   */
  getDashboardKey(filterDto?: IncidentStatsFilterDto): string {
    return this.generateCacheKey('dashboard', filterDto);
  }

  /**
   * Obtém chave de cache para tendências
   */
  getTrendsKey(filterDto?: IncidentStatsFilterDto): string {
    return this.generateCacheKey('trends', filterDto);
  }

  /**
   * Obtém TTL para dashboard
   */
  getDashboardTTL(): number {
    return this.DASHBOARD_TTL;
  }

  /**
   * Obtém TTL para métricas
   */
  getMetricsTTL(): number {
    return this.METRICS_TTL;
  }

  /**
   * Obtém TTL para período
   */
  getPeriodTTL(): number {
    return this.PERIOD_TTL;
  }

  /**
   * Limpa todo o cache de estatísticas
   */
  clearAllStats(): void {
    this.logger.warn('Clearing all incident stats cache');
    // Nota: Cache manager do NestJS não tem método para limpar por padrão
    // Precisaria implementar com Redis diretamente se necessário
    // this.cacheManager.reset();
  }
}
