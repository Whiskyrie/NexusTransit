/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, LessThan, MoreThan } from 'typeorm';
import { Delivery } from './entities/delivery.entity';
import { DeliveryAttempt } from './entities/delivery-attempt.entity';
import { DeliveryProof } from './entities/delivery-proof.entity';
import { DeliveryStatusHistory } from './entities/delivery-status-history.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { DeliveryFilterDto } from './dto/delivery-filter.dto';
import { DeliveryResponseDto } from './dto/delivery-response.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateDeliveryAttemptDto } from './dto/delivery-attempt.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import {
  DeliveryStatus,
  DeliveryStatusTransitions,
  FinalDeliveryStatuses,
} from './enums/delivery-status.enum';
import { DeliveryPriority } from './enums/delivery-priority.enum';
import { Customer } from '../../customers/entities/customer.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
    @InjectRepository(DeliveryAttempt)
    private readonly deliveryAttemptRepository: Repository<DeliveryAttempt>,
    @InjectRepository(DeliveryProof)
    private readonly deliveryProofRepository: Repository<DeliveryProof>,
    @InjectRepository(DeliveryStatusHistory)
    private readonly deliveryStatusHistoryRepository: Repository<DeliveryStatusHistory>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Criar nova entrega
   */
  async create(createDeliveryDto: CreateDeliveryDto): Promise<DeliveryResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validar cliente
      const customer = await this.customerRepository.findOne({
        where: { id: createDeliveryDto.customer_id },
      });

      if (!customer) {
        throw new BadRequestException(
          `Cliente com ID ${createDeliveryDto.customer_id} não encontrado`,
        );
      }

      // Validar motorista (se fornecido)
      let driver = null;
      if (createDeliveryDto.driver_id) {
        driver = await this.driverRepository.findOne({
          where: { id: createDeliveryDto.driver_id },
        });

        if (!driver) {
          throw new BadRequestException(
            `Motorista com ID ${createDeliveryDto.driver_id} não encontrado`,
          );
        }
      }

      // Validar veículo (se fornecido)
      let vehicle = null;
      if (createDeliveryDto.vehicle_id) {
        vehicle = await this.vehicleRepository.findOne({
          where: { id: createDeliveryDto.vehicle_id },
        });

        if (!vehicle) {
          throw new BadRequestException(
            `Veículo com ID ${createDeliveryDto.vehicle_id} não encontrado`,
          );
        }
      }

      // Validar datas
      const scheduledPickupAt = new Date(createDeliveryDto.scheduled_pickup_at);
      const scheduledDeliveryAt = new Date(createDeliveryDto.scheduled_delivery_at);
      const now = new Date();

      if (scheduledPickupAt < now) {
        throw new BadRequestException('Data de coleta não pode ser no passado');
      }

      if (scheduledDeliveryAt <= scheduledPickupAt) {
        throw new BadRequestException('Data de entrega deve ser posterior à data de coleta');
      }

      // Gerar código de rastreamento único
      const trackingCode = await this.generateTrackingCode();

      // Criar entrega
      const delivery = queryRunner.manager.create(Delivery, {
        ...createDeliveryDto,
        tracking_code: trackingCode,
        status: DeliveryStatus.PENDING,
        priority: createDeliveryDto.priority || DeliveryPriority.NORMAL,
        scheduled_pickup_at: scheduledPickupAt,
        scheduled_delivery_at: scheduledDeliveryAt,
        customer_id: customer.id,
        driver_id: driver?.id,
        vehicle_id: vehicle?.id,
      });

      const savedDelivery = await queryRunner.manager.save(delivery);

      // Criar histórico de status inicial
      const statusHistory = queryRunner.manager.create(DeliveryStatusHistory, {
        delivery_id: savedDelivery.id,
        from_status: null,
        to_status: DeliveryStatus.PENDING,
        changed_at: new Date(),
        automatic_change: true,
        reason: 'Entrega criada',
      });

      await queryRunner.manager.save(statusHistory);

      await queryRunner.commitTransaction();

      this.logger.log(`Entrega criada: ${trackingCode} (${savedDelivery.id})`);

      // Buscar entrega completa com relacionamentos
      const completeDelivery = await this.findOneWithRelations(savedDelivery.id);
      return DeliveryResponseDto.fromEntity(completeDelivery);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Erro ao criar entrega:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Listar entregas com filtros e paginação
   */
  async findAll(filterDto: DeliveryFilterDto): Promise<PaginatedResponseDto<DeliveryResponseDto>> {
    const {
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'DESC',
      tracking_code,
      status,
      statuses,
      priority,
      priorities,
      customer_id,
      driver_id,
      vehicle_id,
      description,
      delivery_city,
      delivery_state,
      delivery_postal_code,
      created_from,
      created_to,
      scheduled_delivery_from,
      scheduled_delivery_to,
      weight_min,
      weight_max,
      value_min,
      value_max,
      overdue,
      today,
      this_week,
      active_only,
      include_cancelled = true,
      unassigned_only,
      with_issues,
    } = filterDto;

    const queryBuilder = this.deliveryRepository
      .createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.customer', 'customer')
      .leftJoinAndSelect('delivery.driver', 'driver')
      .leftJoinAndSelect('delivery.vehicle', 'vehicle')
      .leftJoinAndSelect('delivery.attempts', 'attempts')
      .leftJoinAndSelect('delivery.proofs', 'proofs')
      .leftJoinAndSelect('delivery.statusHistory', 'statusHistory');

    // Aplicar filtros
    if (tracking_code) {
      queryBuilder.andWhere('delivery.tracking_code ILIKE :tracking_code', {
        tracking_code: `%${tracking_code}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('delivery.status = :status', { status });
    }

    if (statuses && statuses.length > 0) {
      queryBuilder.andWhere('delivery.status IN (:...statuses)', { statuses });
    }

    if (priority) {
      queryBuilder.andWhere('delivery.priority = :priority', { priority });
    }

    if (priorities && priorities.length > 0) {
      queryBuilder.andWhere('delivery.priority IN (:...priorities)', { priorities });
    }

    if (customer_id) {
      queryBuilder.andWhere('delivery.customer_id = :customer_id', { customer_id });
    }

    if (driver_id) {
      queryBuilder.andWhere('delivery.driver_id = :driver_id', { driver_id });
    }

    if (vehicle_id) {
      queryBuilder.andWhere('delivery.vehicle_id = :vehicle_id', { vehicle_id });
    }

    if (description) {
      queryBuilder.andWhere('delivery.description ILIKE :description', {
        description: `%${description}%`,
      });
    }

    if (delivery_city) {
      queryBuilder.andWhere("delivery.delivery_address->>'city' ILIKE :delivery_city", {
        delivery_city: `%${delivery_city}%`,
      });
    }

    if (delivery_state) {
      queryBuilder.andWhere("delivery.delivery_address->>'state' = :delivery_state", {
        delivery_state,
      });
    }

    if (delivery_postal_code) {
      queryBuilder.andWhere(
        "delivery.delivery_address->>'postal_code' ILIKE :delivery_postal_code",
        {
          delivery_postal_code: `%${delivery_postal_code}%`,
        },
      );
    }

    // Filtros de data
    if (created_from) {
      queryBuilder.andWhere('delivery.created_at >= :created_from', {
        created_from: new Date(created_from),
      });
    }

    if (created_to) {
      queryBuilder.andWhere('delivery.created_at <= :created_to', {
        created_to: new Date(created_to),
      });
    }

    if (scheduled_delivery_from) {
      queryBuilder.andWhere('delivery.scheduled_delivery_at >= :scheduled_delivery_from', {
        scheduled_delivery_from: new Date(scheduled_delivery_from),
      });
    }

    if (scheduled_delivery_to) {
      queryBuilder.andWhere('delivery.scheduled_delivery_at <= :scheduled_delivery_to', {
        scheduled_delivery_to: new Date(scheduled_delivery_to),
      });
    }

    // Filtros de peso e valor
    if (weight_min) {
      queryBuilder.andWhere('delivery.weight >= :weight_min', { weight_min });
    }

    if (weight_max) {
      queryBuilder.andWhere('delivery.weight <= :weight_max', { weight_max });
    }

    if (value_min) {
      queryBuilder.andWhere('delivery.declared_value >= :value_min', { value_min });
    }

    if (value_max) {
      queryBuilder.andWhere('delivery.declared_value <= :value_max', { value_max });
    }

    // Filtros especiais
    if (overdue) {
      queryBuilder.andWhere(
        'delivery.scheduled_delivery_at < :now AND delivery.status NOT IN (:...finalStatuses)',
        {
          now: new Date(),
          finalStatuses: FinalDeliveryStatuses,
        },
      );
    }

    if (today) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      queryBuilder.andWhere('delivery.scheduled_delivery_at BETWEEN :todayStart AND :todayEnd', {
        todayStart,
        todayEnd,
      });
    }

    if (this_week) {
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      queryBuilder.andWhere('delivery.scheduled_delivery_at BETWEEN :weekStart AND :weekEnd', {
        weekStart,
        weekEnd,
      });
    }

    if (active_only) {
      queryBuilder.andWhere('delivery.status NOT IN (:...finalStatuses)', {
        finalStatuses: FinalDeliveryStatuses,
      });
    }

    if (!include_cancelled) {
      queryBuilder.andWhere('delivery.status != :cancelled', {
        cancelled: DeliveryStatus.CANCELLED,
      });
    }

    if (unassigned_only) {
      queryBuilder.andWhere('delivery.driver_id IS NULL');
    }

    if (with_issues) {
      queryBuilder.andWhere(
        '(delivery.status = :failed OR (delivery.scheduled_delivery_at < :now AND delivery.status NOT IN (:...finalStatuses)))',
        {
          failed: DeliveryStatus.FAILED,
          now: new Date(),
          finalStatuses: FinalDeliveryStatuses,
        },
      );
    }

    // Ordenação
    queryBuilder.orderBy(`delivery.${sort_by}`, sort_order);

    // Paginação
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [deliveries, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: deliveries.map(delivery => DeliveryResponseDto.fromEntity(delivery)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Buscar entrega por ID
   */
  async findOne(id: string): Promise<DeliveryResponseDto> {
    const delivery = await this.findOneWithRelations(id);
    return DeliveryResponseDto.fromEntity(delivery);
  }

  /**
   * Atualizar entrega
   */
  async update(id: string, updateDeliveryDto: UpdateDeliveryDto): Promise<DeliveryResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const delivery = await this.findOneWithRelations(id);
      const oldStatus = delivery.status;

      // Validar motorista (se fornecido)
      if (updateDeliveryDto.driver_id) {
        const driver = await this.driverRepository.findOne({
          where: { id: updateDeliveryDto.driver_id },
        });

        if (!driver) {
          throw new BadRequestException(
            `Motorista com ID ${updateDeliveryDto.driver_id} não encontrado`,
          );
        }
      }

      // Validar veículo (se fornecido)
      if (updateDeliveryDto.vehicle_id) {
        const vehicle = await this.vehicleRepository.findOne({
          where: { id: updateDeliveryDto.vehicle_id },
        });

        if (!vehicle) {
          throw new BadRequestException(
            `Veículo com ID ${updateDeliveryDto.vehicle_id} não encontrado`,
          );
        }
      }

      // Validar mudança de status (se fornecida)
      if (updateDeliveryDto.status && updateDeliveryDto.status !== oldStatus) {
        this.validateStatusTransition(oldStatus, updateDeliveryDto.status);
      }

      // Atualizar entrega
      Object.assign(delivery, updateDeliveryDto);
      const updatedDelivery = await queryRunner.manager.save(delivery);

      // Se mudou o status, criar histórico
      if (updateDeliveryDto.status && updateDeliveryDto.status !== oldStatus) {
        const statusHistory = queryRunner.manager.create(DeliveryStatusHistory, {
          delivery_id: delivery.id,
          from_status: oldStatus,
          to_status: updateDeliveryDto.status,
          changed_at: new Date(),
          automatic_change: false,
          reason: 'Atualização manual',
        });

        await queryRunner.manager.save(statusHistory);
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Entrega atualizada: ${delivery.tracking_code} (${delivery.id})`);

      const completeDelivery = await this.findOneWithRelations(delivery.id);
      return DeliveryResponseDto.fromEntity(completeDelivery);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Erro ao atualizar entrega:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Remover entrega (soft delete)
   */
  async remove(id: string): Promise<void> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!delivery) {
      throw new NotFoundException(`Entrega com ID ${id} não encontrada`);
    }

    // Verificar se entrega pode ser cancelada
    if (!FinalDeliveryStatuses.includes(delivery.status)) {
      // Cancelar entrega antes de remover
      delivery.status = DeliveryStatus.CANCELLED;
      await this.deliveryRepository.save(delivery);

      // Criar histórico de cancelamento
      const statusHistory = this.deliveryStatusHistoryRepository.create({
        delivery_id: delivery.id,
        from_status: delivery.status,
        to_status: DeliveryStatus.CANCELLED,
        changed_at: new Date(),
        automatic_change: true,
        reason: 'Entrega removida do sistema',
      });

      await this.deliveryStatusHistoryRepository.save(statusHistory);
    }

    await this.deliveryRepository.softDelete(id);

    this.logger.log(`Entrega removida: ${delivery.tracking_code} (${delivery.id})`);
  }

  /**
   * Mudar status da entrega
   */
  async changeStatus(id: string, changeStatusDto: ChangeStatusDto): Promise<DeliveryResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const delivery = await this.findOneWithRelations(id);
      const oldStatus = delivery.status;
      const newStatus = changeStatusDto.new_status;

      // Validar transição de status
      if (!changeStatusDto.force_change) {
        this.validateStatusTransition(oldStatus, newStatus);
      }

      // Atualizar status
      delivery.status = newStatus;

      // Atualizar datas específicas do status
      if (newStatus === DeliveryStatus.PICKED_UP && changeStatusDto.status_data?.pickup_data) {
        delivery.actual_pickup_at = new Date(changeStatusDto.event_timestamp || Date.now());
      } else if (
        newStatus === DeliveryStatus.DELIVERED &&
        changeStatusDto.status_data?.delivery_data
      ) {
        delivery.actual_delivery_at = new Date(changeStatusDto.event_timestamp || Date.now());
      }

      // Atualizar motorista/veículo se fornecidos
      if (changeStatusDto.driver_id) {
        delivery.driver_id = changeStatusDto.driver_id;
      }

      if (changeStatusDto.vehicle_id) {
        delivery.vehicle_id = changeStatusDto.vehicle_id;
      }

      await queryRunner.manager.save(delivery);

      // Criar histórico de status
      const statusHistory = queryRunner.manager.create(DeliveryStatusHistory, {
        delivery_id: delivery.id,
        from_status: oldStatus,
        to_status: newStatus,
        changed_at: new Date(changeStatusDto.event_timestamp || Date.now()),
        changed_by: changeStatusDto.driver_id,
        reason: changeStatusDto.reason,
        context: {
          source: 'API',
          location: changeStatusDto.location,
        },
        status_metadata: changeStatusDto.status_data,
        driver_data: changeStatusDto.driver_id
          ? {
              driver_id: changeStatusDto.driver_id,
              vehicle_id: changeStatusDto.vehicle_id,
            }
          : undefined,
        automatic_change: false,
        internal_notes: changeStatusDto.internal_notes,
      });

      await queryRunner.manager.save(statusHistory);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Status da entrega ${delivery.tracking_code} alterado: ${oldStatus} -> ${newStatus}`,
      );

      const completeDelivery = await this.findOneWithRelations(delivery.id);
      return DeliveryResponseDto.fromEntity(completeDelivery);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Erro ao alterar status da entrega:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Registrar tentativa de entrega
   */
  async createAttempt(
    deliveryId: string,
    createAttemptDto: CreateDeliveryAttemptDto,
  ): Promise<DeliveryAttempt> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const delivery = await this.findOneWithRelations(deliveryId);

      // Validar motorista
      const driver = await this.driverRepository.findOne({
        where: { id: createAttemptDto.driver_id },
      });

      if (!driver) {
        throw new BadRequestException(
          `Motorista com ID ${createAttemptDto.driver_id} não encontrado`,
        );
      }

      // Validar número da tentativa
      const existingAttempts = await this.deliveryAttemptRepository.count({
        where: { delivery_id: deliveryId },
      });

      if (createAttemptDto.attempt_number !== existingAttempts + 1) {
        throw new BadRequestException(
          `Número da tentativa inválido. Próximo número esperado: ${existingAttempts + 1}`,
        );
      }

      // Criar tentativa
      const attempt = queryRunner.manager.create(DeliveryAttempt, {
        ...createAttemptDto,
        delivery_id: deliveryId,
        started_at: new Date(createAttemptDto.started_at || Date.now()),
      });

      const savedAttempt = await queryRunner.manager.save(attempt);

      // Se falhou, atualizar status da entrega
      if (createAttemptDto.status === 'FAILED' && createAttemptDto.failure_reason) {
        delivery.status = DeliveryStatus.FAILED;
        await queryRunner.manager.save(delivery);

        // Criar histórico de status
        const statusHistory = queryRunner.manager.create(DeliveryStatusHistory, {
          delivery_id: deliveryId,
          from_status: DeliveryStatus.OUT_FOR_DELIVERY,
          to_status: DeliveryStatus.FAILED,
          changed_at: new Date(),
          changed_by: createAttemptDto.driver_id,
          reason: `Tentativa ${createAttemptDto.attempt_number} falhou: ${createAttemptDto.failure_reason}`,
          status_metadata: {
            failure_data: {
              failure_reason: createAttemptDto.failure_reason,
              failure_description: createAttemptDto.failure_description,
              retry_attempt: createAttemptDto.attempt_number,
              next_retry_date: createAttemptDto.next_action?.scheduled_at,
            },
          },
        });

        await queryRunner.manager.save(statusHistory);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Tentativa de entrega registrada: ${delivery.tracking_code} - Tentativa ${createAttemptDto.attempt_number}`,
      );

      return savedAttempt;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Erro ao registrar tentativa de entrega:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Buscar entregas por motorista
   */
  async findByDriver(
    driverId: string,
    filterDto?: DeliveryFilterDto,
  ): Promise<DeliveryResponseDto[]> {
    const query = this.deliveryRepository
      .createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.customer', 'customer')
      .leftJoinAndSelect('delivery.vehicle', 'vehicle')
      .where('delivery.driver_id = :driverId', { driverId });

    if (filterDto?.status) {
      query.andWhere('delivery.status = :status', { status: filterDto.status });
    }

    const deliveries = await query.getMany();
    return deliveries.map(delivery => DeliveryResponseDto.fromEntity(delivery));
  }

  /**
   * Buscar entregas por cliente
   */
  async findByCustomer(
    customerId: string,
    filterDto?: DeliveryFilterDto,
  ): Promise<DeliveryResponseDto[]> {
    const query = this.deliveryRepository
      .createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.driver', 'driver')
      .leftJoinAndSelect('delivery.vehicle', 'vehicle')
      .where('delivery.customer_id = :customerId', { customerId });

    if (filterDto?.status) {
      query.andWhere('delivery.status = :status', { status: filterDto.status });
    }

    const deliveries = await query.getMany();
    return deliveries.map(delivery => DeliveryResponseDto.fromEntity(delivery));
  }

  /**
   * Gerar código de rastreamento único
   */
  private async generateTrackingCode(): Promise<string> {
    const prefix = 'NEX';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const trackingCode = `${prefix}${timestamp}${random}BR`;

    // Verificar se já existe
    const existing = await this.deliveryRepository.findOne({
      where: { tracking_code: trackingCode },
    });

    if (existing) {
      return this.generateTrackingCode(); // Recursivo se colidir
    }

    return trackingCode;
  }

  /**
   * Validar transição de status
   */
  private validateStatusTransition(currentStatus: DeliveryStatus, newStatus: DeliveryStatus): void {
    const allowedTransitions = DeliveryStatusTransitions[currentStatus];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Transição inválida: não é possível mudar de ${currentStatus} para ${newStatus}`,
      );
    }
  }

  /**
   * Buscar entrega com relacionamentos
   */
  private async findOneWithRelations(id: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id },
      relations: ['customer', 'driver', 'vehicle', 'attempts', 'proofs', 'statusHistory'],
    });

    if (!delivery) {
      throw new NotFoundException(`Entrega com ID ${id} não encontrada`);
    }

    return delivery;
  }
}
