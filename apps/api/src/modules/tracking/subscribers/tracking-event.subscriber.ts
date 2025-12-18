import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  SoftRemoveEvent,
  Repository,
} from 'typeorm';
import { Logger, Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TrackingEvent } from '../entities/tracking-event.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { EventType } from '../enums/event-type.enum';
import { EventStatus } from '../enums/event-status.enum';
import { TrackingCacheService } from '../services/tracking-cache.service';
import { TrackingCalculationService } from '../services/tracking-calculation.service';

/**
 * Subscriber para eventos de rastreamento
 *
 * Responsável por:
 * - Validar dados antes de inserir/atualizar
 * - Invalidar cache após mudanças
 * - Gerar eventos automáticos baseados em regras de negócio
 */
@EventSubscriber()
@Injectable()
export class TrackingEventSubscriber implements EntitySubscriberInterface<TrackingEvent> {
  private readonly logger = new Logger(TrackingEventSubscriber.name);

  constructor(
    @Inject(forwardRef(() => TrackingCacheService))
    private readonly trackingCacheService: TrackingCacheService,
    @Inject(forwardRef(() => TrackingCalculationService))
    private readonly trackingCalculationService: TrackingCalculationService,
    @InjectRepository(TrackingEvent)
    private readonly trackingEventRepository: Repository<TrackingEvent>,
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
  ) {}

  listenTo(): typeof TrackingEvent {
    return TrackingEvent;
  }

  /**
   * Executado antes de inserir um evento
   */
  beforeInsert(event: InsertEvent<TrackingEvent>): void {
    const entity = event.entity;

    this.logger.debug(`Before insert: ${entity.event_type} para entrega ${entity.delivery_id}`);

    // Validar coordenadas se fornecidas
    if (entity.location) {
      this.validateLocation(entity);
    }

    // Validar timestamp
    if (entity.timestamp && entity.timestamp > new Date()) {
      this.logger.warn(`Timestamp futuro detectado: ${entity.timestamp.toISOString()}`);
    }

    // Validar precisão GPS
    if (entity.accuracy && entity.accuracy > 100) {
      this.logger.warn(`Baixa precisão GPS detectada: ${entity.accuracy}m`);
    }
  }

  /**
   * Executado após inserir um evento
   */
  afterInsert(event: InsertEvent<TrackingEvent>): void {
    const entity = event.entity;

    this.logger.log(
      `Evento de rastreamento inserido: ${entity.event_id} (${entity.event_type}) - Entrega: ${entity.delivery_id}`,
    );

    // Invalidar cache da entrega
    this.invalidateCache(entity.delivery_id);

    // Verificar se deve gerar eventos automáticos
    this.checkAutomaticEvents(entity);
  }

  /**
   * Executado antes de atualizar um evento
   */
  beforeUpdate(event: UpdateEvent<TrackingEvent>): void {
    const entity = event.entity as TrackingEvent;

    if (!entity) {
      return;
    }

    this.logger.debug(`Before update: ${entity.event_id}`);

    // Validar se não está alterando campos críticos
    if (event.databaseEntity) {
      const original = event.databaseEntity;

      // Alertar se tipo de evento foi alterado
      if (entity.event_type && entity.event_type !== original.event_type) {
        this.logger.warn(`Tipo de evento alterado: ${original.event_type} -> ${entity.event_type}`);
      }

      // Alertar se timestamp foi alterado
      if (entity.timestamp && entity.timestamp.getTime() !== original.timestamp.getTime()) {
        this.logger.warn(
          `Timestamp alterado: ${original.timestamp.toISOString()} -> ${entity.timestamp.toISOString()}`,
        );
      }
    }
  }

  /**
   * Executado após atualizar um evento
   */
  afterUpdate(event: UpdateEvent<TrackingEvent>): void {
    const entity = event.entity as TrackingEvent;

    if (!entity) {
      return;
    }

    this.logger.log(`Evento de rastreamento atualizado: ${entity.event_id}`);

    // Invalidar cache da entrega
    this.invalidateCache(entity.delivery_id);
  }

  /**
   * Executado antes de soft delete
   */
  beforeSoftRemove(event: SoftRemoveEvent<TrackingEvent>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    this.logger.debug(`Before soft remove: ${entity.event_id}`);
  }

  /**
   * Executado após soft delete
   */
  afterSoftRemove(event: SoftRemoveEvent<TrackingEvent>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    this.logger.log(`Evento de rastreamento removido: ${entity.event_id}`);

    // Invalidar cache da entrega
    this.invalidateCache(entity.delivery_id);
  }

  /**
   * Valida localização do evento
   */
  private validateLocation(entity: TrackingEvent): void {
    if (!entity.location) {
      return;
    }

    const coords = entity.getCoordinates();

    if (!coords) {
      this.logger.error(`Não foi possível extrair coordenadas do evento ${entity.event_id}`);
      return;
    }

    // Validar ranges de latitude e longitude
    if (coords.latitude < -90 || coords.latitude > 90) {
      this.logger.error(`Latitude inválida: ${coords.latitude}`);
    }

    if (coords.longitude < -180 || coords.longitude > 180) {
      this.logger.error(`Longitude inválida: ${coords.longitude}`);
    }

    this.logger.debug(`Localização validada: ${coords.latitude}, ${coords.longitude}`);
  }

  /**
   * Verifica se deve gerar evento automático NEAR_DESTINATION
   *
   * Gera evento quando entrega está a menos de 2km do destino
   */
  private async shouldGenerateNearDestinationEvent(entity: TrackingEvent): Promise<boolean> {
    try {
      // 1. Verificar se já existe evento NEAR_DESTINATION ou posterior para esta entrega
      const existingEvent = await this.trackingEventRepository.findOne({
        where: {
          delivery_id: entity.delivery_id,
          event_type: EventType.NEAR_DESTINATION,
        },
        order: { timestamp: 'DESC' },
      });

      if (existingEvent) {
        this.logger.debug(`Evento NEAR_DESTINATION já existe para entrega ${entity.delivery_id}`);
        return false;
      }

      // 2. Buscar dados da entrega
      const delivery = await this.deliveryRepository.findOne({
        where: { id: entity.delivery_id },
      });

      if (!delivery?.delivery_address?.latitude || !delivery?.delivery_address?.longitude) {
        this.logger.debug(`Dados de destino incompletos para entrega ${entity.delivery_id}`);
        return false;
      }

      // 3. Verificar se tem localização no evento
      if (!entity.location) {
        return false;
      }

      // 4. Calcular distância até destino usando TrackingCalculationService
      const isNear = await this.trackingCalculationService.isNearDestination(
        entity.delivery_id,
        delivery.delivery_address.latitude,
        delivery.delivery_address.longitude,
      );

      return isNear;
    } catch (error) {
      this.logger.error(`Erro ao verificar proximidade do destino:`, error);
      return false;
    }
  }

  /**
   * Verifica se deve gerar evento automático DELAYED
   *
   * Gera evento quando ETA excede SLA + tolerância
   */
  private async shouldGenerateDelayedEvent(entity: TrackingEvent): Promise<boolean> {
    try {
      // 1. Verificar se já existe evento DELAYED recente (últimas 2 horas)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const recentDelayedEvent = await this.trackingEventRepository.findOne({
        where: {
          delivery_id: entity.delivery_id,
          event_type: EventType.DELAYED,
        },
        order: { timestamp: 'DESC' },
      });

      if (recentDelayedEvent && recentDelayedEvent.timestamp > twoHoursAgo) {
        this.logger.debug(`Evento DELAYED recente já existe para entrega ${entity.delivery_id}`);
        return false;
      }

      // 2. Buscar dados da entrega para obter SLA
      const delivery = await this.deliveryRepository.findOne({
        where: { id: entity.delivery_id },
      });

      if (
        !delivery?.scheduled_delivery_at ||
        !delivery?.delivery_address?.latitude ||
        !delivery?.delivery_address?.longitude
      ) {
        this.logger.debug(`Dados de SLA incompletos para entrega ${entity.delivery_id}`);
        return false;
      }

      // 3. Detectar atraso usando TrackingCalculationService
      const delayResult = await this.trackingCalculationService.detectDelay(
        entity.delivery_id,
        delivery.scheduled_delivery_at,
        delivery.delivery_address.latitude,
        delivery.delivery_address.longitude,
      );

      return delayResult.is_delayed;
    } catch (error) {
      this.logger.error(`Erro ao verificar atraso:`, error);
      return false;
    }
  }

  /**
   * Gera evento automático NEAR_DESTINATION
   */
  private async generateNearDestinationEvent(entity: TrackingEvent): Promise<void> {
    try {
      const nearDestinationEvent = this.trackingEventRepository.create({
        delivery_id: entity.delivery_id,
        driver_id: entity.driver_id,
        route_id: entity.route_id,
        event_type: EventType.NEAR_DESTINATION,
        event_status: EventStatus.INFO,
        timestamp: new Date(),
        location: entity.location,
        location_address: entity.location_address,
        accuracy: entity.accuracy,
        speed: entity.speed,
        battery_level: entity.battery_level,
        notes: 'Evento gerado automaticamente - entrega está próxima do destino (< 2km)',
        is_automatic: true,
        metadata: {
          triggered_by_event_id: entity.event_id,
          trigger_event_type: entity.event_type,
          auto_generated: true,
        },
      });

      await this.trackingEventRepository.save(nearDestinationEvent);

      this.logger.log(
        `Evento NEAR_DESTINATION gerado automaticamente para entrega ${entity.delivery_id}`,
      );
    } catch (error) {
      this.logger.error(`Erro ao gerar evento NEAR_DESTINATION:`, error);
    }
  }

  /**
   * Gera evento automático DELAYED
   */
  private async generateDelayedEvent(entity: TrackingEvent): Promise<void> {
    try {
      // Buscar dados da entrega
      const delivery = await this.deliveryRepository.findOne({
        where: { id: entity.delivery_id },
      });

      if (
        !delivery?.scheduled_delivery_at ||
        !delivery?.delivery_address?.latitude ||
        !delivery?.delivery_address?.longitude
      ) {
        this.logger.warn(
          `Dados insuficientes para gerar evento DELAYED para entrega ${entity.delivery_id}`,
        );
        return;
      }

      // Buscar informações de atraso
      const delayResult = await this.trackingCalculationService.detectDelay(
        entity.delivery_id,
        delivery.scheduled_delivery_at,
        delivery.delivery_address.latitude,
        delivery.delivery_address.longitude,
      );

      const delayedEvent = this.trackingEventRepository.create({
        delivery_id: entity.delivery_id,
        driver_id: entity.driver_id,
        route_id: entity.route_id,
        event_type: EventType.DELAYED,
        event_status: EventStatus.WARNING,
        timestamp: new Date(),
        location: entity.location,
        location_address: entity.location_address,
        accuracy: entity.accuracy,
        speed: entity.speed,
        battery_level: entity.battery_level,
        notes: `Atraso detectado: ${delayResult.delay_minutes} minutos. ETA: ${delayResult.estimated_arrival.toLocaleTimeString()}`,
        is_automatic: true,
        metadata: {
          triggered_by_event_id: entity.event_id,
          trigger_event_type: entity.event_type,
          delay_minutes: delayResult.delay_minutes,
          estimated_arrival: delayResult.estimated_arrival,
          expected_arrival: delayResult.expected_arrival,
          auto_generated: true,
        },
      });

      await this.trackingEventRepository.save(delayedEvent);

      this.logger.log(`Evento DELAYED gerado automaticamente para entrega ${entity.delivery_id}`);
    } catch (error) {
      this.logger.error(`Erro ao gerar evento DELAYED:`, error);
    }
  }

  /**
   * Invalida cache para uma entrega
   */
  private invalidateCache(deliveryId: string): void {
    try {
      void this.trackingCacheService.invalidateTrackingCache(deliveryId);
      this.logger.debug(`Cache invalidado para entrega: ${deliveryId}`);
    } catch (error) {
      this.logger.error(`Erro ao invalidar cache para entrega ${deliveryId}:`, error);
    }
  }

  /**
   * Verifica e agenda geração de eventos automáticos
   */
  private checkAutomaticEvents(entity: TrackingEvent): void {
    // Execução assíncrona para não bloquear a inserção
    setImmediate(() => {
      void (async () => {
        try {
          // Verificar se está em trânsito e perto do destino
          if (entity.event_type === EventType.IN_TRANSIT && entity.location) {
            const shouldGenerate = await this.shouldGenerateNearDestinationEvent(entity);
            if (shouldGenerate) {
              this.logger.log(`Gerando evento NEAR_DESTINATION para entrega ${entity.delivery_id}`);
              await this.generateNearDestinationEvent(entity);
            }
          }

          // Verificar atrasos
          if ([EventType.IN_TRANSIT, EventType.ARRIVED].includes(entity.event_type)) {
            const shouldGenerate = await this.shouldGenerateDelayedEvent(entity);
            if (shouldGenerate) {
              this.logger.log(`Gerando evento DELAYED para entrega ${entity.delivery_id}`);
              await this.generateDelayedEvent(entity);
            }
          }
        } catch (error) {
          this.logger.error(`Erro ao verificar eventos automáticos:`, error);
        }
      })();
    });
  }
}
