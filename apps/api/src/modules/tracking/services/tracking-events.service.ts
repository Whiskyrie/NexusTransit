import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, In, Between } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TrackingEvent } from '../entities/tracking-event.entity';
import { CreateTrackingEventDto } from '../dto/create-tracking-event.dto';
import { UpdateTrackingEventDto } from '../dto/update-tracking-event.dto';
import { TrackingEventFilterDto } from '../dto/tracking-event-filter.dto';
import { TrackingEventResponseDto, PaginatedResponseDto } from '../dto/tracking-event-response.dto';
import { BatchTrackingEventsDto } from '../dto/batch-tracking-events.dto';
import { EventType, EventTypeTransitions } from '../enums/event-type.enum';

/**
 * Service para gerenciamento de eventos de rastreamento
 */
@Injectable()
export class TrackingEventsService {
  private readonly logger = new Logger(TrackingEventsService.name);

  constructor(
    @InjectRepository(TrackingEvent)
    private readonly trackingEventRepository: Repository<TrackingEvent>,
  ) {}

  /**
   * Cria um novo evento de rastreamento
   */
  async create(createDto: CreateTrackingEventDto): Promise<TrackingEventResponseDto> {
    // Validar timestamp
    const timestamp = new Date(createDto.timestamp);
    if (timestamp > new Date()) {
      throw new BadRequestException('Timestamp não pode ser futuro');
    }

    // Validar sequência de eventos
    await this.validateEventSequence(createDto.delivery_id, createDto.event_type);

    // Validar coordenadas se fornecidas
    if (createDto.location) {
      this.validateCoordinates(createDto.location.latitude, createDto.location.longitude);
    }

    // Preparar dados do evento
    const eventData: Partial<TrackingEvent> = {
      event_id: uuidv4(),
      delivery_id: createDto.delivery_id,
      route_id: createDto.route_id,
      driver_id: createDto.driver_id,
      event_type: createDto.event_type,
      event_status: createDto.event_status,
      timestamp,
      location_address: createDto.location_address,
      accuracy: createDto.accuracy,
      speed: createDto.speed,
      battery_level: createDto.battery_level,
      notes: createDto.notes,
      metadata: createDto.metadata,
      is_automatic: createDto.is_automatic,
      created_by_user_id: createDto.created_by_user_id,
    };

    // Definir localização PostGIS
    if (createDto.location) {
      eventData.location = `POINT(${createDto.location.longitude} ${createDto.location.latitude})`;
    }

    // Criar e salvar evento
    const event = this.trackingEventRepository.create(eventData);
    const saved = await this.trackingEventRepository.save(event);

    this.logger.log(`Evento de rastreamento criado: ${saved.event_id} (${saved.event_type})`);

    return this.mapToResponseDto(saved);
  }

  /**
   * Cria múltiplos eventos em lote (sincronização offline)
   */
  async createBatch(batchDto: BatchTrackingEventsDto): Promise<TrackingEventResponseDto[]> {
    const results: TrackingEventResponseDto[] = [];
    const errors: { index: number; error: string }[] = [];

    for (let i = 0; i < batchDto.events.length; i++) {
      try {
        const result = await this.create(batchDto.events[i]);
        results.push(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(`Erro ao processar evento em lote [${i}]: ${errorMessage}`, errorStack);
        errors.push({
          index: i,
          error: errorMessage,
        });
      }
    }

    if (errors.length > 0) {
      this.logger.warn(`${errors.length} eventos falharam no processamento em lote`, errors);
    }

    this.logger.log(
      `Processamento em lote concluído: ${results.length} sucessos, ${errors.length} falhas`,
    );

    return results;
  }

  /**
   * Lista eventos com filtros e paginação
   */
  async findAll(
    filterDto: TrackingEventFilterDto,
  ): Promise<PaginatedResponseDto<TrackingEventResponseDto>> {
    const {
      page = 1,
      limit = 10,
      search,
      delivery_id,
      route_id,
      driver_id,
      event_type,
      event_status,
      start_date,
      end_date,
      is_automatic,
    } = filterDto;

    const where: FindOptionsWhere<TrackingEvent> = {};

    // Aplicar filtros
    if (search) {
      where.location_address = ILike(`%${search}%`);
    }

    if (delivery_id) {
      where.delivery_id = delivery_id;
    }

    if (route_id) {
      where.route_id = route_id;
    }

    if (driver_id) {
      where.driver_id = driver_id;
    }

    if (event_type) {
      where.event_type = event_type;
    }

    if (event_status) {
      where.event_status = event_status;
    }

    if (is_automatic !== undefined) {
      where.is_automatic = is_automatic;
    }

    // Filtro de data
    if (start_date || end_date) {
      const startTimestamp = start_date ? new Date(start_date) : new Date(0);
      const endTimestamp = end_date ? new Date(end_date) : new Date();
      where.timestamp = Between(startTimestamp, endTimestamp);
    }

    // Executar query com paginação
    const [events, total] = await this.trackingEventRepository.findAndCount({
      where,
      take: Math.min(limit, 100), // Máximo 100 itens
      skip: (page - 1) * limit,
      order: { timestamp: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: events.map(e => this.mapToResponseDto(e)),
      meta: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_previous: page > 1,
        has_next: page < totalPages,
      },
    };
  }

  /**
   * Busca evento por ID
   */
  async findOne(id: string): Promise<TrackingEventResponseDto> {
    const event = await this.trackingEventRepository.findOne({
      where: { event_id: id },
    });

    if (!event) {
      throw new NotFoundException(`Evento de rastreamento com ID ${id} não encontrado`);
    }

    return this.mapToResponseDto(event);
  }

  /**
   * Busca todos os eventos de uma entrega
   */
  async findByDelivery(deliveryId: string): Promise<TrackingEventResponseDto[]> {
    const events = await this.trackingEventRepository.find({
      where: { delivery_id: deliveryId },
      order: { timestamp: 'ASC' },
    });

    return events.map(e => this.mapToResponseDto(e));
  }

  /**
   * Busca o último evento de uma entrega
   */
  async findLatestByDelivery(deliveryId: string): Promise<TrackingEventResponseDto> {
    const event = await this.trackingEventRepository.findOne({
      where: { delivery_id: deliveryId },
      order: { timestamp: 'DESC' },
    });

    if (!event) {
      throw new NotFoundException(`Nenhum evento encontrado para a entrega ${deliveryId}`);
    }

    return this.mapToResponseDto(event);
  }

  /**
   * Busca entregas em trânsito
   */
  async findActiveDeliveries(): Promise<TrackingEventResponseDto[]> {
    const activeStatuses = [
      EventType.IN_TRANSIT,
      EventType.NEAR_DESTINATION,
      EventType.PICKUP_STARTED,
      EventType.ARRIVED,
    ];

    // Subconsulta para pegar apenas o último evento de cada entrega
    const events = await this.trackingEventRepository
      .createQueryBuilder('event')
      .where('event.event_type IN (:...types)', { types: activeStatuses })
      .andWhere(qb => {
        const subQuery = qb
          .subQuery()
          .select('MAX(e2.timestamp)')
          .from(TrackingEvent, 'e2')
          .where('e2.delivery_id = event.delivery_id')
          .getQuery();
        return `event.timestamp = ${subQuery}`;
      })
      .orderBy('event.timestamp', 'DESC')
      .getMany();

    return events.map(e => this.mapToResponseDto(e));
  }

  /**
   * Busca localização atual de um motorista
   */
  async findDriverCurrentLocation(driverId: string): Promise<TrackingEventResponseDto> {
    const event = await this.trackingEventRepository.findOne({
      where: {
        driver_id: driverId,
        event_type: In([EventType.IN_TRANSIT, EventType.NEAR_DESTINATION, EventType.ARRIVED]),
      },
      order: { timestamp: 'DESC' },
    });

    if (!event) {
      throw new NotFoundException(`Localização atual não encontrada para o motorista ${driverId}`);
    }

    return this.mapToResponseDto(event);
  }

  /**
   * Busca progresso de uma rota
   */
  async findRouteProgress(routeId: string): Promise<TrackingEventResponseDto[]> {
    const events = await this.trackingEventRepository.find({
      where: { route_id: routeId },
      order: { timestamp: 'ASC' },
    });

    return events.map(e => this.mapToResponseDto(e));
  }

  /**
   * Atualiza um evento de rastreamento
   */
  async update(id: string, updateDto: UpdateTrackingEventDto): Promise<TrackingEventResponseDto> {
    const event = await this.findEventOrFail(id);

    // Validar timestamp se fornecido
    if (updateDto.timestamp) {
      const timestamp = new Date(updateDto.timestamp);
      if (timestamp > new Date()) {
        throw new BadRequestException('Timestamp não pode ser futuro');
      }
      event.timestamp = timestamp;
    }

    // Validar sequência se tipo de evento mudou
    if (updateDto.event_type && updateDto.event_type !== event.event_type) {
      await this.validateEventSequence(event.delivery_id, updateDto.event_type);
      event.event_type = updateDto.event_type;
    }

    // Atualizar localização se fornecida
    if (updateDto.location) {
      this.validateCoordinates(updateDto.location.latitude, updateDto.location.longitude);
      event.location = `POINT(${updateDto.location.longitude} ${updateDto.location.latitude})`;
    }

    // Atualizar outros campos explicitamente
    if (updateDto.event_status !== undefined) {
      event.event_status = updateDto.event_status;
    }
    if (updateDto.location_address !== undefined) {
      event.location_address = updateDto.location_address;
    }
    if (updateDto.accuracy !== undefined) {
      event.accuracy = updateDto.accuracy;
    }
    if (updateDto.speed !== undefined) {
      event.speed = updateDto.speed;
    }
    if (updateDto.battery_level !== undefined) {
      event.battery_level = updateDto.battery_level;
    }
    if (updateDto.notes !== undefined) {
      event.notes = updateDto.notes;
    }
    if (updateDto.metadata !== undefined) {
      event.metadata = updateDto.metadata;
    }
    if (updateDto.is_automatic !== undefined) {
      event.is_automatic = updateDto.is_automatic;
    }

    const updated = await this.trackingEventRepository.save(event);

    this.logger.log(`Evento de rastreamento atualizado: ${id}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Remove um evento de rastreamento (soft delete)
   */
  async remove(id: string): Promise<void> {
    const event = await this.findEventOrFail(id);

    await this.trackingEventRepository.softRemove(event);

    this.logger.log(`Evento de rastreamento removido: ${id}`);
  }

  // Métodos auxiliares privados

  private async findEventOrFail(id: string): Promise<TrackingEvent> {
    const event = await this.trackingEventRepository.findOne({ where: { event_id: id } });

    if (!event) {
      throw new NotFoundException(`Evento de rastreamento com ID ${id} não encontrado`);
    }

    return event;
  }

  private async validateEventSequence(deliveryId: string, newEventType: EventType): Promise<void> {
    const lastEvent = await this.trackingEventRepository.findOne({
      where: { delivery_id: deliveryId },
      order: { timestamp: 'DESC' },
    });

    // Se não há eventos anteriores, validar evento inicial
    if (!lastEvent) {
      if (![EventType.CREATED, EventType.ASSIGNED].includes(newEventType)) {
        throw new BadRequestException(
          `Primeiro evento deve ser ${EventType.CREATED} ou ${EventType.ASSIGNED}`,
        );
      }
      return;
    }

    // Validar transição de evento
    const allowedTransitions = EventTypeTransitions[lastEvent.event_type];
    if (!allowedTransitions.includes(newEventType)) {
      throw new BadRequestException(
        `Transição inválida de ${lastEvent.event_type} para ${newEventType}`,
      );
    }
  }

  private validateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw new BadRequestException(`Latitude inválida: ${latitude}. Deve estar entre -90 e 90`);
    }

    if (longitude < -180 || longitude > 180) {
      throw new BadRequestException(
        `Longitude inválida: ${longitude}. Deve estar entre -180 e 180`,
      );
    }
  }

  private mapToResponseDto(event: TrackingEvent): TrackingEventResponseDto {
    const dto = new TrackingEventResponseDto();
    Object.assign(dto, event);

    // Extrair coordenadas do Point
    const coordinates = event.getCoordinates();
    if (coordinates) {
      dto.latitude = coordinates.latitude;
      dto.longitude = coordinates.longitude;
    }

    return dto;
  }

  /**
   * Busca eventos de rastreamento por tracking_code da entrega
   *
   * @param trackingCode - Código de rastreamento da entrega
   * @returns Lista de eventos ordenados por timestamp
   */
  async findByTrackingCode(trackingCode: string): Promise<TrackingEvent[]> {
    const events = await this.trackingEventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.delivery', 'delivery')
      .where('delivery.tracking_code = :trackingCode', { trackingCode })
      .orderBy('event.timestamp', 'ASC')
      .getMany();

    if (!events || events.length === 0) {
      throw new NotFoundException(
        `Nenhum evento encontrado para o código de rastreamento: ${trackingCode}`,
      );
    }

    return events;
  }

  /**
   * Busca o último evento de rastreamento por tracking_code
   *
   * @param trackingCode - Código de rastreamento da entrega
   * @returns Último evento registrado
   */
  async findLatestByTrackingCode(trackingCode: string): Promise<TrackingEvent> {
    const event = await this.trackingEventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.delivery', 'delivery')
      .where('delivery.tracking_code = :trackingCode', { trackingCode })
      .orderBy('event.timestamp', 'DESC')
      .getOne();

    if (!event) {
      throw new NotFoundException(
        `Nenhum evento encontrado para o código de rastreamento: ${trackingCode}`,
      );
    }

    return event;
  }

  /**
   * Busca eventos com coordenadas para construir rota no mapa
   *
   * @param trackingCode - Código de rastreamento da entrega
   * @returns Lista de eventos com localização ordenados por timestamp
   */
  async findRoutePointsByTrackingCode(trackingCode: string): Promise<TrackingEvent[]> {
    const events = await this.trackingEventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.delivery', 'delivery')
      .where('delivery.tracking_code = :trackingCode', { trackingCode })
      .andWhere('event.location IS NOT NULL')
      .orderBy('event.timestamp', 'ASC')
      .getMany();

    return events;
  }
}
