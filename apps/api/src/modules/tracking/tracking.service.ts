import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, ILike } from 'typeorm';
import { Tracking } from './entities/tracking.entity';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { TrackingFilterDto } from './dto/tracking-filter.dto';
import { TrackingResponseDto } from './dto/tracking-response.dto';
import { PaginatedResponseDto } from '@nexus/common';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectRepository(Tracking)
    private readonly trackingRepository: Repository<Tracking>,
  ) {}

  /**
   * Cria um novo registro de rastreamento
   */
  async create(createDto: CreateTrackingDto): Promise<TrackingResponseDto> {
    const tracking = new Tracking();
    tracking.delivery_id = createDto.delivery_id;
    tracking.status = createDto.status;
    tracking.event_type = createDto.event_type;

    if (createDto.latitude !== undefined) {
      tracking.latitude = createDto.latitude;
    }
    if (createDto.longitude !== undefined) {
      tracking.longitude = createDto.longitude;
    }
    if (createDto.location_address !== undefined) {
      tracking.location_address = createDto.location_address;
    }
    if (createDto.city !== undefined) {
      tracking.city = createDto.city;
    }
    if (createDto.state !== undefined) {
      tracking.state = createDto.state;
    }
    if (createDto.description !== undefined) {
      tracking.description = createDto.description;
    }
    if (createDto.driver_name !== undefined) {
      tracking.driver_name = createDto.driver_name;
    }
    if (createDto.vehicle_plate !== undefined) {
      tracking.vehicle_plate = createDto.vehicle_plate;
    }
    if (createDto.metadata !== undefined) {
      tracking.metadata = createDto.metadata;
    }
    if (createDto.hub_name !== undefined) {
      tracking.hub_name = createDto.hub_name;
    }
    if (createDto.delivery_attempt !== undefined) {
      tracking.delivery_attempt = createDto.delivery_attempt;
    }
    if (createDto.failure_reason !== undefined) {
      tracking.failure_reason = createDto.failure_reason;
    }
    if (createDto.received_by !== undefined) {
      tracking.received_by = createDto.received_by;
    }
    if (createDto.proof_url !== undefined) {
      tracking.proof_url = createDto.proof_url;
    }

    tracking.event_timestamp = createDto.event_timestamp
      ? new Date(createDto.event_timestamp)
      : new Date();
    tracking.is_critical = createDto.is_critical ?? false;

    if (createDto.estimated_delivery) {
      tracking.estimated_delivery = new Date(createDto.estimated_delivery);
    }

    const saved = await this.trackingRepository.save(tracking);

    this.logger.log(
      `Evento de rastreamento criado: ${saved.event_type} para entrega ${saved.delivery_id}`,
    );

    return this.mapToResponseDto(saved);
  }

  /**
   * Lista todos os registros de rastreamento com filtros e paginação
   */
  async findAll(filterDto: TrackingFilterDto): Promise<PaginatedResponseDto<TrackingResponseDto>> {
    const {
      page = 1,
      limit = 10,
      search,
      delivery_id,
      status,
      event_type,
      city,
      state,
      event_from,
      event_to,
      hub_name,
      is_critical,
    } = filterDto;

    const where: FindOptionsWhere<Tracking> = {};

    if (delivery_id) {
      where.delivery_id = delivery_id;
    }

    if (status) {
      where.status = status;
    }

    if (event_type) {
      where.event_type = event_type;
    }

    if (city) {
      where.city = ILike(`%${city}%`);
    }

    if (state) {
      where.state = state;
    }

    if (hub_name) {
      where.hub_name = ILike(`%${hub_name}%`);
    }

    if (is_critical !== undefined) {
      where.is_critical = is_critical;
    }

    if (event_from || event_to) {
      const startDate = event_from ? new Date(event_from) : new Date('1970-01-01');
      const endDate = event_to ? new Date(event_to) : new Date('2099-12-31');
      where.event_timestamp = Between(startDate, endDate);
    }

    if (search) {
      // Para busca por texto, precisamos usar queryBuilder
      const queryBuilder = this.trackingRepository.createQueryBuilder('tracking');

      queryBuilder.where(
        '(tracking.description ILIKE :search OR tracking.location_address ILIKE :search OR tracking.driver_name ILIKE :search)',
        { search: `%${search}%` },
      );

      // Aplicar outros filtros
      if (delivery_id) {
        queryBuilder.andWhere('tracking.delivery_id = :delivery_id', { delivery_id });
      }
      if (status) {
        queryBuilder.andWhere('tracking.status = :status', { status });
      }
      if (event_type) {
        queryBuilder.andWhere('tracking.event_type = :event_type', { event_type });
      }
      if (city) {
        queryBuilder.andWhere('tracking.city ILIKE :city', { city: `%${city}%` });
      }
      if (state) {
        queryBuilder.andWhere('tracking.state = :state', { state });
      }
      if (hub_name) {
        queryBuilder.andWhere('tracking.hub_name ILIKE :hub_name', { hub_name: `%${hub_name}%` });
      }
      if (is_critical !== undefined) {
        queryBuilder.andWhere('tracking.is_critical = :is_critical', { is_critical });
      }

      if (event_from || event_to) {
        const startDate = event_from ? new Date(event_from) : new Date('1970-01-01');
        const endDate = event_to ? new Date(event_to) : new Date('2099-12-31');
        queryBuilder.andWhere('tracking.event_timestamp BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      }

      queryBuilder
        .take(limit)
        .skip((page - 1) * limit)
        .orderBy('tracking.event_timestamp', 'DESC');

      const [trackings, total] = await queryBuilder.getManyAndCount();
      const totalPages = Math.ceil(total / limit);

      return {
        data: trackings.map(t => this.mapToResponseDto(t)),
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

    // Busca simples sem texto
    const [trackings, total] = await this.trackingRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { event_timestamp: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: trackings.map(t => this.mapToResponseDto(t)),
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
   * Busca um registro de rastreamento por ID
   */
  async findOne(id: string): Promise<TrackingResponseDto> {
    const tracking = await this.trackingRepository.findOne({
      where: { id },
      relations: ['delivery'],
    });

    if (!tracking) {
      throw new NotFoundException(`Registro de rastreamento com ID ${id} não encontrado`);
    }

    return this.mapToResponseDto(tracking);
  }

  /**
   * Busca todos os registros de uma entrega específica
   */
  async findByDelivery(deliveryId: string): Promise<TrackingResponseDto[]> {
    const trackings = await this.trackingRepository.find({
      where: { delivery_id: deliveryId },
      order: { event_timestamp: 'DESC' },
    });

    return trackings.map(t => this.mapToResponseDto(t));
  }

  /**
   * Atualiza um registro de rastreamento
   */
  async update(id: string, updateDto: UpdateTrackingDto): Promise<TrackingResponseDto> {
    const tracking = await this.findTrackingOrFail(id);

    const { event_timestamp, estimated_delivery, ...rest } = updateDto;

    Object.assign(tracking, rest);

    if (event_timestamp) {
      tracking.event_timestamp = new Date(event_timestamp);
    }
    if (estimated_delivery) {
      tracking.estimated_delivery = new Date(estimated_delivery);
    }

    const updated = await this.trackingRepository.save(tracking);

    this.logger.log(`Registro de rastreamento atualizado: ${id}`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Remove um registro de rastreamento (soft delete)
   */
  async remove(id: string): Promise<void> {
    const tracking = await this.findTrackingOrFail(id);

    await this.trackingRepository.softRemove(tracking);

    this.logger.log(`Registro de rastreamento removido: ${id}`);
  }

  /**
   * Obtém o último evento de uma entrega
   */
  async getLatestEvent(deliveryId: string): Promise<TrackingResponseDto | null> {
    const tracking = await this.trackingRepository.findOne({
      where: { delivery_id: deliveryId },
      order: { event_timestamp: 'DESC' },
    });

    return tracking ? this.mapToResponseDto(tracking) : null;
  }

  /**
   * Métodos auxiliares privados
   */
  private async findTrackingOrFail(id: string): Promise<Tracking> {
    const tracking = await this.trackingRepository.findOne({ where: { id } });

    if (!tracking) {
      throw new NotFoundException(`Registro de rastreamento com ID ${id} não encontrado`);
    }

    return tracking;
  }

  private mapToResponseDto(tracking: Tracking): TrackingResponseDto {
    const dto = new TrackingResponseDto();
    Object.assign(dto, tracking);
    return dto;
  }
}
