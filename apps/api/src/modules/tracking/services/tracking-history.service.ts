import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrackingEvent } from '../entities/tracking-event.entity';
import { TrackingHistoryData, TrackingStatistics } from '../interfaces/tracking-history.interface';

/**
 * Service para consulta da view materializada de histórico de rastreamento
 *
 * Fornece acesso otimizado a dados agregados de rastreamento
 */
@Injectable()
export class TrackingHistoryService implements OnModuleInit {
  private readonly logger = new Logger(TrackingHistoryService.name);
  private viewExists = false;

  constructor(
    @InjectRepository(TrackingEvent)
    private readonly trackingEventRepository: Repository<TrackingEvent>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Verifica se a view materializada existe no banco de dados
   */
  async onModuleInit(): Promise<void> {
    await this.checkViewExists();
  }

  /**
   * Verifica existência da view materializada
   */
  private async checkViewExists(): Promise<boolean> {
    try {
      const result = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_matviews 
          WHERE matviewname = 'tracking_history'
        ) as exists
      `);
      this.viewExists = result[0]?.exists ?? false;

      if (!this.viewExists) {
        this.logger.warn(
          'View materializada tracking_history não existe. ' +
            'Execute a migration CreateTrackingHistoryView ou recrie a view manualmente.',
        );
      }

      return this.viewExists;
    } catch (error) {
      this.logger.error('Erro ao verificar existência da view materializada:', error);
      this.viewExists = false;
      return false;
    }
  }

  /**
   * Busca histórico agregado de uma entrega
   *
   * @param deliveryId - ID da entrega
   * @returns Dados agregados da view materializada
   */
  async getHistory(deliveryId: string): Promise<TrackingHistoryData> {
    const query = `
      SELECT * FROM tracking_history
      WHERE delivery_id = $1
    `;

    const result: TrackingHistoryData[] = await this.dataSource.query(query, [deliveryId]);

    if (!result || result.length === 0) {
      throw new NotFoundException(`Histórico não encontrado para a entrega: ${deliveryId}`);
    }

    return result[0];
  }

  /**
   * Busca histórico de múltiplas entregas
   *
   * @param deliveryIds - Array de IDs de entregas
   * @returns Array de históricos
   */
  async getHistories(deliveryIds: string[]): Promise<TrackingHistoryData[]> {
    if (!deliveryIds || deliveryIds.length === 0) {
      return [];
    }

    const query = `
      SELECT * FROM tracking_history
      WHERE delivery_id = ANY($1)
      ORDER BY last_update DESC
    `;

    const result: TrackingHistoryData[] = await this.dataSource.query(query, [deliveryIds]);
    return result;
  }

  /**
   * Busca entregas com warnings
   *
   * @param limit - Limite de resultados
   * @returns Entregas com avisos
   */
  async getDeliveriesWithWarnings(limit = 50): Promise<TrackingHistoryData[]> {
    const query = `
      SELECT * FROM tracking_history
      WHERE warning_events > 0
      ORDER BY warning_events DESC, last_update DESC
      LIMIT $1
    `;

    const result: TrackingHistoryData[] = await this.dataSource.query(query, [limit]);
    return result;
  }

  /**
   * Busca entregas por status atual
   *
   * @param status - Status da entrega
   * @param limit - Limite de resultados
   * @returns Entregas com o status especificado
   */
  async getDeliveriesByStatus(status: string, limit = 100): Promise<TrackingHistoryData[]> {
    const query = `
      SELECT * FROM tracking_history
      WHERE current_status = $1
      ORDER BY last_update DESC
      LIMIT $2
    `;

    const result: TrackingHistoryData[] = await this.dataSource.query(query, [status, limit]);
    return result;
  }

  /**
   * Busca entregas em trânsito (para dashboard em tempo real)
   *
   * @returns Entregas em trânsito
   */
  async getActiveDeliveries(): Promise<TrackingHistoryData[]> {
    const query = `
      SELECT * FROM tracking_history
      WHERE current_status IN ('IN_TRANSIT', 'OUT_FOR_DELIVERY', 'NEAR_DESTINATION')
      ORDER BY last_update DESC
    `;

    const result: TrackingHistoryData[] = await this.dataSource.query(query);
    return result;
  }

  /**
   * Busca estatísticas gerais do histórico
   *
   * @returns Estatísticas agregadas
   */
  async getStatistics(): Promise<{
    total_deliveries: number;
    active_deliveries: number;
    deliveries_with_errors: number;
    deliveries_with_warnings: number;
    avg_events_per_delivery: number;
    avg_distance_km: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_deliveries,
        COUNT(CASE WHEN current_status IN ('IN_TRANSIT', 'OUT_FOR_DELIVERY', 'NEAR_DESTINATION') THEN 1 END) as active_deliveries,
        COUNT(CASE WHEN error_events > 0 THEN 1 END) as deliveries_with_errors,
        COUNT(CASE WHEN warning_events > 0 THEN 1 END) as deliveries_with_warnings,
        AVG(total_events)::numeric(10,2) as avg_events_per_delivery,
        AVG(total_distance_km)::numeric(10,2) as avg_distance_km
      FROM tracking_history
    `;

    const result: TrackingStatistics[] = await this.dataSource.query(query);
    return result[0];
  }

  /**
   * Atualiza (refresh) a view materializada
   *
   * Pode ser chamado manualmente ou via scheduled job
   */
  async refreshMaterializedView(): Promise<void> {
    // Verificar se a view existe antes de tentar refresh
    if (!this.viewExists) {
      const exists = await this.checkViewExists();
      if (!exists) {
        this.logger.debug('Pulando refresh: view materializada não existe');
        return;
      }
    }

    this.logger.log('Iniciando refresh da view materializada tracking_history');

    try {
      const startTime = Date.now();

      await this.dataSource.query('REFRESH MATERIALIZED VIEW CONCURRENTLY tracking_history');

      const duration = Date.now() - startTime;
      this.logger.log(`View materializada atualizada com sucesso em ${duration}ms`);
    } catch (error) {
      // Verificar se o erro é porque a view não existe
      if (error instanceof Error && error.message.includes('does not exist')) {
        this.viewExists = false;
        this.logger.warn('View materializada não encontrada. Marcando como inexistente.');
        return;
      }
      this.logger.error('Erro ao atualizar view materializada:', error);
      throw error;
    }
  }

  /**
   * Scheduled job para refresh automático da view materializada
   * Executa a cada 5 minutos
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledRefresh(): Promise<void> {
    this.logger.debug('Executando refresh scheduled da view materializada');

    try {
      await this.refreshMaterializedView();
    } catch (error) {
      this.logger.error('Erro no refresh scheduled:', error);
      // Não relançar erro para não quebrar o cron
    }
  }

  /**
   * Verifica quando foi o último refresh da view
   *
   * @returns Data do último refresh
   */
  async getLastRefreshTime(): Promise<Date | null> {
    const query = `
      SELECT MAX(materialized_at) as last_refresh
      FROM tracking_history
    `;

    const result: { last_refresh: Date | null }[] = await this.dataSource.query(query);
    return result[0]?.last_refresh ?? null;
  }

  /**
   * Busca entregas que não foram atualizadas recentemente
   * (possível problema de comunicação ou bateria)
   *
   * @param minutesThreshold - Minutos sem atualização
   * @param limit - Limite de resultados
   * @returns Entregas sem atualização recente
   */
  async getStaleDeliveries(minutesThreshold = 30, limit = 50): Promise<TrackingHistoryData[]> {
    const query = `
      SELECT * FROM tracking_history
      WHERE current_status IN ('IN_TRANSIT', 'OUT_FOR_DELIVERY')
        AND last_update < NOW() - INTERVAL '${minutesThreshold} minutes'
      ORDER BY last_update ASC
      LIMIT $1
    `;

    const result: TrackingHistoryData[] = await this.dataSource.query(query, [limit]);
    return result;
  }

  /**
   * Busca entregas com baixo nível de bateria
   *
   * @param batteryThreshold - Nível mínimo de bateria (%)
   * @param limit - Limite de resultados
   * @returns Entregas com bateria baixa
   */
  async getLowBatteryDeliveries(batteryThreshold = 20, limit = 50): Promise<TrackingHistoryData[]> {
    const query = `
      SELECT * FROM tracking_history
      WHERE current_battery_level IS NOT NULL
        AND current_battery_level < $1
        AND current_status IN ('IN_TRANSIT', 'OUT_FOR_DELIVERY')
      ORDER BY current_battery_level ASC, last_update DESC
      LIMIT $2
    `;

    const result: TrackingHistoryData[] = await this.dataSource.query(query, [
      batteryThreshold,
      limit,
    ]);
    return result;
  }

  /**
   * Busca entregas com precisão GPS baixa
   *
   * @param accuracyThreshold - Precisão máxima em metros
   * @param limit - Limite de resultados
   * @returns Entregas com GPS impreciso
   */
  async getLowAccuracyDeliveries(
    accuracyThreshold = 100,
    limit = 50,
  ): Promise<TrackingHistoryData[]> {
    const query = `
      SELECT * FROM tracking_history
      WHERE location_accuracy IS NOT NULL
        AND location_accuracy > $1
        AND current_status IN ('IN_TRANSIT', 'OUT_FOR_DELIVERY')
      ORDER BY location_accuracy DESC, last_update DESC
      LIMIT $2
    `;

    const result: TrackingHistoryData[] = await this.dataSource.query(query, [
      accuracyThreshold,
      limit,
    ]);
    return result;
  }
}
