import { Injectable, Logger, Inject } from "@nestjs/common";
import { Repository, DataSource } from "typeorm";
import { randomUUID } from "crypto";
import { ISeed } from "../interfaces/seed.interface";

/**
 * Enums para Tracking - Valores válidos do banco de dados
 */
enum EventType {
  CREATED = "CREATED",
  ASSIGNED = "ASSIGNED",
  PICKUP_STARTED = "PICKUP_STARTED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  NEAR_DESTINATION = "NEAR_DESTINATION",
  ARRIVED = "ARRIVED",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  CANCELED = "CANCELED",
  DELAYED = "DELAYED",
  RESCHEDULED = "RESCHEDULED",
}

enum EventStatus {
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
  INFO = "INFO",
}

/**
 * Interface para TrackingEvent Entity no seed
 */
export interface TrackingEventEntity {
  event_id: string;
  delivery_id: string;
  driver_id: string;
  route_id?: string;
  event_type: EventType;
  event_status: EventStatus;
  timestamp: Date;
  location_address?: string;
  notes?: string;
}

/**
 * Interface para Delivery Entity no seed
 */
export interface DeliveryEntity {
  id: string;
  tracking_code: string;
  status: string;
  driver_id?: string;
}

/**
 * Interface para Driver Entity no seed
 */
export interface DriverEntity {
  id: string;
  full_name: string;
}

/**
 * Seed de eventos de tracking
 *
 * Cria eventos de rastreamento para as entregas existentes
 * Volume: ~3000-5000 eventos de tracking
 */
@Injectable()
export class TrackingSeed implements ISeed {
  private readonly logger = new Logger(TrackingSeed.name);

  constructor(
    @Inject("TRACKING_EVENT_REPOSITORY")
    private readonly trackingEventRepository: Repository<TrackingEventEntity>,
    @Inject("DELIVERY_REPOSITORY")
    private readonly deliveryRepository: Repository<DeliveryEntity>,
    @Inject("DRIVER_REPOSITORY")
    private readonly driverRepository: Repository<DriverEntity>,
    @Inject("DATA_SOURCE")
    private readonly dataSource: DataSource,
  ) {}

  async run(): Promise<void> {
    this.logger.log("Iniciando seed de tracking events...");

    // Verificar se já existem eventos suficientes
    const count = await this.trackingEventRepository.count();
    if (count >= 1000) {
      this.logger.log(`Já existem ${count} eventos de tracking no sistema. Pulando seed.`);
      return;
    }

    // Buscar entregas existentes
    const deliveries = await this.deliveryRepository.find({ take: 500 });
    if (deliveries.length === 0) {
      this.logger.warn("Nenhuma entrega encontrada. Execute o seed de entregas primeiro.");
      return;
    }

    // Buscar motoristas existentes
    const drivers = await this.driverRepository.find({ take: 50 });
    if (drivers.length === 0) {
      this.logger.warn("Nenhum motorista encontrado. Execute o seed de motoristas primeiro.");
      return;
    }

    this.logger.log(`Criando eventos de tracking para ${deliveries.length} entregas...`);

    let createdCount = 0;
    const now = new Date();

    for (const delivery of deliveries) {
      try {
        const events = this.generateTrackingEvents(delivery, drivers, now);

        for (const eventData of events) {
          // Usar SQL direto para inserir, pois a tabela usa event_id (não id)
          await this.dataSource.query(
            `INSERT INTO tracking_events (
              event_id, delivery_id, driver_id, event_type, event_status,
              timestamp, location_address, notes, is_automatic
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              eventData.event_id,
              eventData.delivery_id,
              eventData.driver_id,
              eventData.event_type,
              eventData.event_status,
              eventData.timestamp,
              eventData.location_address || null,
              eventData.notes || null,
              false, // is_automatic
            ],
          );
          createdCount++;
        }
      } catch (error) {
        this.logger.error(
          `Erro ao criar eventos para entrega ${delivery.tracking_code}: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        );
      }
    }

    this.logger.log(`Seed de tracking concluído. ${createdCount} eventos criados.`);
  }

  private generateTrackingEvents(
    delivery: DeliveryEntity,
    drivers: DriverEntity[],
    now: Date,
  ): Partial<TrackingEventEntity>[] {
    const events: Partial<TrackingEventEntity>[] = [];
    const driverId = delivery.driver_id || drivers[Math.floor(Math.random() * drivers.length)].id;

    // Definir a data base (1-30 dias atrás)
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const baseDate = new Date(now);
    baseDate.setDate(baseDate.getDate() - daysAgo);

    // Localizações brasileiras para os eventos
    const locations = [
      { address: "Centro de Distribuição - Av. das Nações, 1000, São Paulo, SP" },
      { address: "Hub Logístico - Rod. Anhanguera, km 45, Campinas, SP" },
      { address: "Base de Operações - Av. Brasil, 5000, Rio de Janeiro, RJ" },
      { address: "Terminal de Cargas - BR-116, km 120, Curitiba, PR" },
      { address: "Unidade de Triagem - Av. Contorno, 3000, Belo Horizonte, MG" },
    ];

    let eventDate = new Date(baseDate);

    // Evento 1: CREATED
    events.push({
      event_id: randomUUID(),
      delivery_id: delivery.id,
      driver_id: driverId,
      event_type: EventType.CREATED,
      event_status: EventStatus.SUCCESS,
      timestamp: new Date(eventDate),
      location_address: locations[0].address,
      notes: "Pedido criado no sistema",
    });

    // Evento 2: ASSIGNED (2-6 horas depois)
    eventDate = new Date(eventDate.getTime() + (2 + Math.random() * 4) * 60 * 60 * 1000);
    events.push({
      event_id: randomUUID(),
      delivery_id: delivery.id,
      driver_id: driverId,
      event_type: EventType.ASSIGNED,
      event_status: EventStatus.SUCCESS,
      timestamp: new Date(eventDate),
      location_address: locations[0].address,
      notes: "Entrega atribuída ao motorista",
    });

    // Verificar status da entrega para decidir quais eventos adicionar
    const status = delivery.status;

    if (
      ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "RETURNED"].includes(
        status,
      )
    ) {
      // Evento 3: PICKUP_STARTED
      eventDate = new Date(eventDate.getTime() + (1 + Math.random() * 2) * 60 * 60 * 1000);
      events.push({
        event_id: randomUUID(),
        delivery_id: delivery.id,
        driver_id: driverId,
        event_type: EventType.PICKUP_STARTED,
        event_status: EventStatus.SUCCESS,
        timestamp: new Date(eventDate),
        location_address: locations[1].address,
        notes: "Motorista a caminho da coleta",
      });

      // Evento 4: PICKED_UP
      eventDate = new Date(eventDate.getTime() + (0.5 + Math.random() * 1) * 60 * 60 * 1000);
      events.push({
        event_id: randomUUID(),
        delivery_id: delivery.id,
        driver_id: driverId,
        event_type: EventType.PICKED_UP,
        event_status: EventStatus.SUCCESS,
        timestamp: new Date(eventDate),
        location_address: locations[1].address,
        notes: "Carga coletada com sucesso",
      });
    }

    if (["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "RETURNED"].includes(status)) {
      // Evento 5: IN_TRANSIT
      eventDate = new Date(eventDate.getTime() + (0.5 + Math.random() * 0.5) * 60 * 60 * 1000);
      events.push({
        event_id: randomUUID(),
        delivery_id: delivery.id,
        driver_id: driverId,
        event_type: EventType.IN_TRANSIT,
        event_status: EventStatus.SUCCESS,
        timestamp: new Date(eventDate),
        location_address: locations[2].address,
        notes: "Mercadoria em trânsito",
      });

      // Adicionar alguns eventos DELAYED durante o trânsito (usando valor válido do enum)
      const numDelays = Math.floor(Math.random() * 2);
      for (let i = 0; i < numDelays; i++) {
        eventDate = new Date(eventDate.getTime() + (0.5 + Math.random() * 1) * 60 * 60 * 1000);
        const loc = locations[(i + 2) % locations.length];
        events.push({
          event_id: randomUUID(),
          delivery_id: delivery.id,
          driver_id: driverId,
          event_type: EventType.DELAYED,
          event_status: EventStatus.SUCCESS,
          timestamp: new Date(eventDate),
          location_address: loc.address,
          notes: `Atraso devido ao trânsito - atualização ${i + 1}`,
        });
      }
    }

    if (["OUT_FOR_DELIVERY", "DELIVERED", "FAILED"].includes(status)) {
      // Evento: NEAR_DESTINATION
      eventDate = new Date(eventDate.getTime() + (0.5 + Math.random() * 0.5) * 60 * 60 * 1000);
      events.push({
        event_id: randomUUID(),
        delivery_id: delivery.id,
        driver_id: driverId,
        event_type: EventType.NEAR_DESTINATION,
        event_status: EventStatus.SUCCESS,
        timestamp: new Date(eventDate),
        location_address: "Próximo ao destino final, Curitiba, PR",
        notes: "Entrega próxima ao destino (< 2km)",
      });

      // Evento: ARRIVED
      eventDate = new Date(eventDate.getTime() + (0.1 + Math.random() * 0.2) * 60 * 60 * 1000);
      events.push({
        event_id: randomUUID(),
        delivery_id: delivery.id,
        driver_id: driverId,
        event_type: EventType.ARRIVED,
        event_status: EventStatus.SUCCESS,
        timestamp: new Date(eventDate),
        location_address: "Endereço de entrega, Curitiba, PR",
        notes: "Motorista chegou ao local de entrega",
      });
    }

    if (status === "DELIVERED") {
      // Evento final: DELIVERED
      eventDate = new Date(eventDate.getTime() + (0.1 + Math.random() * 0.3) * 60 * 60 * 1000);
      events.push({
        event_id: randomUUID(),
        delivery_id: delivery.id,
        driver_id: driverId,
        event_type: EventType.DELIVERED,
        event_status: EventStatus.SUCCESS,
        timestamp: new Date(eventDate),
        location_address: "Endereço de entrega, Curitiba, PR",
        notes: "Entrega realizada com sucesso",
      });
    }

    if (status === "FAILED") {
      // Evento: ARRIVED seguido de FAILED (Cliente ausente)
      eventDate = new Date(eventDate.getTime() + (0.1 + Math.random() * 0.2) * 60 * 60 * 1000);
      events.push({
        event_id: randomUUID(),
        delivery_id: delivery.id,
        driver_id: driverId,
        event_type: EventType.ARRIVED,
        event_status: EventStatus.SUCCESS,
        timestamp: new Date(eventDate),
        location_address: "Endereço de entrega, Curitiba, PR",
        notes: "Motorista chegou - Cliente ausente",
      });

      // Evento final: FAILED
      eventDate = new Date(eventDate.getTime() + (0.1 + Math.random() * 0.1) * 60 * 60 * 1000);
      events.push({
        event_id: randomUUID(),
        delivery_id: delivery.id,
        driver_id: driverId,
        event_type: EventType.FAILED,
        event_status: EventStatus.ERROR,
        timestamp: new Date(eventDate),
        location_address: "Endereço de entrega, Curitiba, PR",
        notes: "Entrega não realizada - Será reagendada",
      });
    }

    if (status === "CANCELLED") {
      // Evento: CANCELED
      eventDate = new Date(eventDate.getTime() + (2 + Math.random() * 4) * 60 * 60 * 1000);
      events.push({
        event_id: randomUUID(),
        delivery_id: delivery.id,
        driver_id: driverId,
        event_type: EventType.CANCELED,
        event_status: EventStatus.WARNING,
        timestamp: new Date(eventDate),
        location_address: locations[0].address,
        notes: "Entrega cancelada pelo cliente ou sistema",
      });
    }

    return events;
  }
}
