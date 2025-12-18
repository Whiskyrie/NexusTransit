import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '@nexus/redis';
import { TrackingEvent } from '../entities/tracking-event.entity';
import { CACHE_TTL_SECONDS } from '../constants/tracking.constants';
import { CachedTrackingData, CachedTrackingTimeline } from '../interfaces/cache.interface';

/**
 * Service para gerenciamento de cache de rastreamento com Redis
 */
@Injectable()
export class TrackingCacheService {
  private readonly logger = new Logger(TrackingCacheService.name);

  constructor(
    @InjectRepository(TrackingEvent)
    private readonly trackingEventRepository: Repository<TrackingEvent>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Obtém dados de rastreamento do cache
   */
  async getTrackingData(deliveryId: string): Promise<CachedTrackingData | null> {
    const cacheKey = `tracking:${deliveryId}`;

    try {
      const cached = await this.redisService.get<CachedTrackingData>(cacheKey);

      if (cached) {
        this.logger.debug(`Cache hit para rastreamento: ${deliveryId}`);
        return cached;
      }

      this.logger.debug(`Cache miss para rastreamento: ${deliveryId}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return null;
    }
  }

  /**
   * Armazena dados de rastreamento no cache
   */
  async setTrackingData(
    deliveryId: string,
    data: CachedTrackingData,
    ttl: number = CACHE_TTL_SECONDS,
  ): Promise<void> {
    const cacheKey = `tracking:${deliveryId}`;

    try {
      await this.redisService.set(cacheKey, data, ttl * 1000); // Keyv usa milissegundos

      this.logger.debug(`Dados de rastreamento armazenados em cache: ${deliveryId} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(
        `Erro ao armazenar cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Obtém timeline de eventos do cache
   */
  async getTrackingTimeline(deliveryId: string): Promise<CachedTrackingTimeline | null> {
    const cacheKey = `tracking:timeline:${deliveryId}`;

    try {
      const cached = await this.redisService.get<CachedTrackingTimeline>(cacheKey);

      if (cached) {
        this.logger.debug(`Cache hit para timeline: ${deliveryId}`);
        return cached;
      }

      this.logger.debug(`Cache miss para timeline: ${deliveryId}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar timeline do cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return null;
    }
  }

  /**
   * Armazena timeline de eventos no cache
   */
  async setTrackingTimeline(
    deliveryId: string,
    timeline: CachedTrackingTimeline,
    ttl: number = CACHE_TTL_SECONDS,
  ): Promise<void> {
    const cacheKey = `tracking:timeline:${deliveryId}`;

    try {
      await this.redisService.set(cacheKey, timeline, ttl * 1000); // Keyv usa milissegundos

      this.logger.debug(
        `Timeline armazenada em cache: ${deliveryId} (${timeline.events.length} eventos)`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao armazenar timeline: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Invalida cache de uma entrega
   */
  async invalidateTrackingCache(deliveryId: string): Promise<void> {
    const keys = [`tracking:${deliveryId}`, `tracking:timeline:${deliveryId}`];

    try {
      await Promise.all(keys.map(key => this.redisService.delete(key)));

      this.logger.debug(`Cache invalidado para entrega: ${deliveryId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao invalidar cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Pré-aquece cache para entregas ativas
   */
  async prewarmCache(deliveryIds: string[]): Promise<void> {
    this.logger.log(`Pré-aquecendo cache para ${deliveryIds.length} entregas...`);

    const promises = deliveryIds.map(async deliveryId => {
      try {
        // Buscar último evento
        const lastEvent = await this.trackingEventRepository.findOne({
          where: { delivery_id: deliveryId },
          order: { timestamp: 'DESC' },
        });

        if (lastEvent) {
          const coords = lastEvent.getCoordinates();

          const trackingData: CachedTrackingData = {
            delivery_id: deliveryId,
            current_status: lastEvent.event_type,
            last_location: coords
              ? {
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  address: lastEvent.location_address,
                }
              : undefined,
            last_update: lastEvent.timestamp,
            events_count: await this.trackingEventRepository.count({
              where: { delivery_id: deliveryId },
            }),
          };

          await this.setTrackingData(deliveryId, trackingData);
        }
      } catch (error) {
        this.logger.error(
          `Erro ao pré-aquecer cache para entrega ${deliveryId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        );
      }
    });

    await Promise.all(promises);

    this.logger.log('Pré-aquecimento de cache concluído');
  }

  /**
   * Limpa todo o cache de rastreamento
   */
  async clearAllCache(): Promise<void> {
    try {
      await this.redisService.clear();
      this.logger.log('Cache de rastreamento limpo completamente');
    } catch (error) {
      this.logger.error(
        `Erro ao limpar cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  async getCacheStats(): Promise<{
    total_keys: number;
    tracking_data_keys: number;
    timeline_keys: number;
  }> {
    try {
      // Usar Redis client nativo se disponível para estatísticas
      const redisClient = this.redisService.getRedisClient();

      if (redisClient) {
        const keys = await redisClient.keys('nexus:tracking:*');
        const trackingDataKeys = keys.filter(
          k => k.startsWith('nexus:tracking:') && !k.includes('timeline'),
        );
        const timelineKeys = keys.filter(k => k.includes('timeline'));

        return {
          total_keys: keys.length,
          tracking_data_keys: trackingDataKeys.length,
          timeline_keys: timelineKeys.length,
        };
      }

      // Fallback se Redis client não estiver disponível
      this.logger.warn('Redis client não disponível para estatísticas');
      return {
        total_keys: 0,
        tracking_data_keys: 0,
        timeline_keys: 0,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao obter estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return {
        total_keys: 0,
        tracking_data_keys: 0,
        timeline_keys: 0,
      };
    }
  }

  /**
   * Publica evento de invalidação para outros nós (pub/sub)
   */
  async publishCacheInvalidation(deliveryId: string): Promise<void> {
    try {
      const redisClient = this.redisService.getRedisClient();

      if (redisClient) {
        await redisClient.publish(
          'nexus:tracking:invalidation',
          JSON.stringify({ delivery_id: deliveryId, timestamp: new Date().toISOString() }),
        );

        this.logger.debug(`Evento de invalidação publicado para entrega: ${deliveryId}`);
      }
    } catch (error) {
      this.logger.error(
        `Erro ao publicar invalidação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Subscreve ao canal de invalidação de cache (pub/sub)
   */
  async subscribeToCacheInvalidation(
    callback: (deliveryId: string) => void | Promise<void>,
  ): Promise<void> {
    try {
      const redisClient = this.redisService.getRedisClient();

      if (redisClient) {
        await redisClient.subscribe('nexus:tracking:invalidation', async message => {
          try {
            const data = JSON.parse(message) as { delivery_id: string; timestamp: string };
            this.logger.debug(`Recebido evento de invalidação para entrega: ${data.delivery_id}`);
            await callback(data.delivery_id);
          } catch (error) {
            this.logger.error(
              `Erro ao processar evento de invalidação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            );
          }
        });

        this.logger.log('Inscrito no canal de invalidação de cache');
      }
    } catch (error) {
      this.logger.error(
        `Erro ao subscrever invalidação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }
}
