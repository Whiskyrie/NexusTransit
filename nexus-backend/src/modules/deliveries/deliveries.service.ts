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
import { Customer } from '../../modules/customers/entities/customer.entity';
import { Driver } from '../../modules/drivers/entities/driver.entity';
import { Vehicle } from '../../modules/vehicles/entities/vehicle.entity';
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

      // Gerar ID de sessão para rastreamento interno usando uuidv4
      const sessionId = uuidv4();

      // Criar entrega
      const delivery = new Delivery();
      Object.assign(delivery, {
        ...createDeliveryDto,
        tracking_code: trackingCode,
        status: DeliveryStatus.PENDING,
        priority: createDeliveryDto.priority ?? DeliveryPriority.NORMAL,
        scheduled_pickup_at: scheduledPickupAt,
        scheduled_delivery_at: scheduledDeliveryAt,
        customer_id: customer.id,
        driver_id: driver?.id ?? null,
        vehicle_id: vehicle?.id ?? null,
      });

      const savedDelivery = await queryRunner.manager.save(delivery);

      // Criar histórico de status inicial
      const statusHistory = new DeliveryStatusHistory();
      statusHistory.delivery_id = savedDelivery.id;
      // Não atribuir from_status quando é undefined - deixar a propriedade sem valor
      statusHistory.to_status = DeliveryStatus.PENDING;
      statusHistory.changed_at = new Date();
      statusHistory.automatic_change = true;
      statusHistory.reason = 'Entrega criada';
      statusHistory.context = {
        session_id: sessionId,
        source: 'API' as const,
      };

      await queryRunner.manager.save(statusHistory);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Entrega criada: ${trackingCode} (${savedDelivery.id}) - Session: ${sessionId}`,
      );

      // Buscar entrega completa com relacionamentos
      const completeDelivery = await this.findOneWithRelations(savedDelivery.id);
      return DeliveryResponseDto.fromEntity(completeDelivery);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Erro ao criar entrega:', error);

      // Lançar erro interno do servidor se for um erro inesperado
      if (!(error instanceof BadRequestException || error instanceof NotFoundException)) {
        throw new InternalServerErrorException(
          'Erro interno ao processar criação de entrega',
          error instanceof Error ? error.message : String(error),
        );
      }

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

    // Filtros de data usando Between para ranges completos
    if (created_from && created_to) {
      queryBuilder.andWhere('delivery.created_at BETWEEN :created_from AND :created_to', {
        created_from: new Date(created_from),
        created_to: new Date(created_to),
      });
    } else if (created_from) {
      queryBuilder.andWhere('delivery.created_at >= :created_from', {
        created_from: new Date(created_from),
      });
    } else if (created_to) {
      queryBuilder.andWhere('delivery.created_at <= :created_to', {
        created_to: new Date(created_to),
      });
    }

    if (scheduled_delivery_from && scheduled_delivery_to) {
      queryBuilder.andWhere(
        'delivery.scheduled_delivery_at BETWEEN :scheduled_delivery_from AND :scheduled_delivery_to',
        {
          scheduled_delivery_from: new Date(scheduled_delivery_from),
          scheduled_delivery_to: new Date(scheduled_delivery_to),
        },
      );
    } else if (scheduled_delivery_from) {
      queryBuilder.andWhere('delivery.scheduled_delivery_at >= :scheduled_delivery_from', {
        scheduled_delivery_from: new Date(scheduled_delivery_from),
      });
    } else if (scheduled_delivery_to) {
      queryBuilder.andWhere('delivery.scheduled_delivery_at <= :scheduled_delivery_to', {
        scheduled_delivery_to: new Date(scheduled_delivery_to),
      });
    }

    // Filtros de peso e valor usando Between
    if (weight_min !== undefined && weight_max !== undefined) {
      queryBuilder.andWhere('delivery.weight BETWEEN :weight_min AND :weight_max', {
        weight_min,
        weight_max,
      });
    } else if (weight_min !== undefined) {
      queryBuilder.andWhere('delivery.weight >= :weight_min', { weight_min });
    } else if (weight_max !== undefined) {
      queryBuilder.andWhere('delivery.weight <= :weight_max', { weight_max });
    }

    if (value_min !== undefined && value_max !== undefined) {
      queryBuilder.andWhere('delivery.declared_value BETWEEN :value_min AND :value_max', {
        value_min,
        value_max,
      });
    } else if (value_min !== undefined) {
      queryBuilder.andWhere('delivery.declared_value >= :value_min', { value_min });
    } else if (value_max !== undefined) {
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

    const total_pages = Math.ceil(total / limit);

    return {
      data: deliveries.map(delivery => DeliveryResponseDto.fromEntity(delivery)),
      meta: {
        total,
        page,
        limit,
        total_pages,
        has_next: page < total_pages,
        has_previous: page > 1,
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
   * Buscar entregas atrasadas usando LessThan
   */
  async findOverdueDeliveries(): Promise<DeliveryResponseDto[]> {
    try {
      const now = new Date();

      const deliveries = await this.deliveryRepository.find({
        where: {
          scheduled_delivery_at: LessThan(now),
          status: MoreThan(DeliveryStatus.PENDING),
        },
        relations: ['customer', 'driver', 'vehicle', 'attempts'],
      });

      this.logger.log(`Encontradas ${deliveries.length} entregas atrasadas`);

      return deliveries.map(delivery => DeliveryResponseDto.fromEntity(delivery));
    } catch (error) {
      this.logger.error('Erro ao buscar entregas atrasadas:', error);
      throw new InternalServerErrorException(
        'Erro ao buscar entregas atrasadas',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Buscar entregas futuras usando Between
   */
  async findFutureDeliveries(daysAhead = 7): Promise<DeliveryResponseDto[]> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const deliveries = await this.deliveryRepository.find({
        where: {
          scheduled_delivery_at: Between(now, futureDate),
          status: DeliveryStatus.PENDING,
        },
        relations: ['customer', 'driver', 'vehicle'],
        order: {
          scheduled_delivery_at: 'ASC',
        },
      });

      this.logger.log(
        `Encontradas ${deliveries.length} entregas agendadas para os próximos ${daysAhead} dias`,
      );

      return deliveries.map(delivery => DeliveryResponseDto.fromEntity(delivery));
    } catch (error) {
      this.logger.error('Erro ao buscar entregas futuras:', error);
      throw new InternalServerErrorException(
        'Erro ao buscar entregas futuras',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Buscar entregas por período usando Between
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<DeliveryResponseDto[]> {
    try {
      if (startDate >= endDate) {
        throw new BadRequestException('Data inicial deve ser anterior à data final');
      }

      const deliveries = await this.deliveryRepository.find({
        where: {
          scheduled_delivery_at: Between(startDate, endDate),
        },
        relations: ['customer', 'driver', 'vehicle', 'attempts'],
        order: {
          scheduled_delivery_at: 'ASC',
        },
      });

      this.logger.log(
        `Encontradas ${deliveries.length} entregas entre ${startDate.toISOString()} e ${endDate.toISOString()}`,
      );

      return deliveries.map(delivery => DeliveryResponseDto.fromEntity(delivery));
    } catch (error) {
      this.logger.error('Erro ao buscar entregas por período:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro ao buscar entregas por período',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Buscar comprovantes de uma entrega
   */
  async findDeliveryProofs(deliveryId: string): Promise<DeliveryProof[]> {
    try {
      const proofs = await this.deliveryProofRepository.find({
        where: { delivery_id: deliveryId },
        order: { created_at: 'DESC' },
      });

      this.logger.log(`Encontrados ${proofs.length} comprovantes para entrega ${deliveryId}`);

      return proofs;
    } catch (error) {
      this.logger.error('Erro ao buscar comprovantes:', error);
      throw new InternalServerErrorException(
        'Erro ao buscar comprovantes',
        error instanceof Error ? error.message : String(error),
      );
    }
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

      // Gerar ID de operação usando uuidv4
      const operationId = uuidv4();

      // Atualizar entrega
      Object.assign(delivery, updateDeliveryDto);
      await queryRunner.manager.save(delivery);

      // Se mudou o status, criar histórico
      if (updateDeliveryDto.status && updateDeliveryDto.status !== oldStatus) {
        const statusHistory = new DeliveryStatusHistory();
        statusHistory.delivery_id = delivery.id;
        statusHistory.from_status = oldStatus;
        statusHistory.to_status = updateDeliveryDto.status;
        statusHistory.changed_at = new Date();
        statusHistory.automatic_change = false;
        statusHistory.reason = 'Atualização manual';
        statusHistory.context = {
          request_id: operationId,
          source: 'API' as const,
        };

        await queryRunner.manager.save(statusHistory);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Entrega atualizada: ${delivery.tracking_code} (${delivery.id}) - Operation: ${operationId}`,
      );

      const completeDelivery = await this.findOneWithRelations(delivery.id);
      return DeliveryResponseDto.fromEntity(completeDelivery);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Erro ao atualizar entrega:', error);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno ao atualizar entrega',
        error instanceof Error ? error.message : String(error),
      );
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

    try {
      // Verificar se entrega pode ser cancelada
      if (!FinalDeliveryStatuses.includes(delivery.status)) {
        // Gerar ID de cancelamento usando uuidv4
        const cancellationId = uuidv4();

        // Cancelar entrega antes de remover
        const oldStatus = delivery.status;
        delivery.status = DeliveryStatus.CANCELLED;
        await this.deliveryRepository.save(delivery);

        // Criar histórico de cancelamento
        const statusHistory = new DeliveryStatusHistory();
        statusHistory.delivery_id = delivery.id;
        statusHistory.from_status = oldStatus;
        statusHistory.to_status = DeliveryStatus.CANCELLED;
        statusHistory.changed_at = new Date();
        statusHistory.automatic_change = true;
        statusHistory.reason = 'Entrega removida do sistema';
        statusHistory.context = {
          request_id: cancellationId,
          source: 'API' as const,
        };

        await this.deliveryStatusHistoryRepository.save(statusHistory);
      }

      await this.deliveryRepository.softDelete(id);

      this.logger.log(`Entrega removida: ${delivery.tracking_code} (${delivery.id})`);
    } catch (error) {
      this.logger.error('Erro ao remover entrega:', error);
      throw new InternalServerErrorException(
        'Erro interno ao remover entrega',
        error instanceof Error ? error.message : String(error),
      );
    }
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

      // Gerar ID de mudança de status usando uuidv4
      const statusChangeId = uuidv4();

      // Atualizar status
      delivery.status = newStatus;

      // Atualizar datas específicas do status
      if (newStatus === DeliveryStatus.PICKED_UP && changeStatusDto.status_data?.pickup_data) {
        delivery.actual_pickup_at = new Date(changeStatusDto.event_timestamp ?? Date.now());
      } else if (
        newStatus === DeliveryStatus.DELIVERED &&
        changeStatusDto.status_data?.delivery_data
      ) {
        delivery.actual_delivery_at = new Date(changeStatusDto.event_timestamp ?? Date.now());
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
      const statusHistory = new DeliveryStatusHistory();
      statusHistory.delivery_id = delivery.id;
      statusHistory.from_status = oldStatus;
      statusHistory.to_status = newStatus;
      statusHistory.changed_at = new Date(changeStatusDto.event_timestamp ?? Date.now());

      // Atribuir changed_by apenas se driver_id estiver presente
      if (changeStatusDto.driver_id) {
        statusHistory.changed_by = changeStatusDto.driver_id;
      }

      // Atribuir reason apenas se estiver presente
      if (changeStatusDto.reason) {
        statusHistory.reason = changeStatusDto.reason;
      }

      statusHistory.context = {
        source: 'API' as const,
        request_id: statusChangeId,
      };

      if (changeStatusDto.status_data) {
        // Criar objeto com conversão de tipos apropriada
        const statusMetadata: NonNullable<typeof statusHistory.status_metadata> = {};

        if (changeStatusDto.status_data.pickup_data) {
          statusMetadata.pickup_data = changeStatusDto.status_data.pickup_data;
        }

        if (changeStatusDto.status_data.transit_data) {
          statusMetadata.transit_data = {
            ...changeStatusDto.status_data.transit_data,
            estimated_arrival: changeStatusDto.status_data.transit_data.estimated_arrival
              ? new Date(changeStatusDto.status_data.transit_data.estimated_arrival)
              : undefined,
          };
        }

        if (changeStatusDto.status_data.delivery_data) {
          statusMetadata.delivery_data = changeStatusDto.status_data.delivery_data;
        }

        if (changeStatusDto.status_data.failure_data) {
          statusMetadata.failure_data = {
            failure_reason: changeStatusDto.status_data.failure_data.failure_reason,
            retry_attempt: changeStatusDto.status_data.failure_data.retry_attempt,
            next_retry_date: changeStatusDto.status_data.failure_data.next_retry_date
              ? new Date(changeStatusDto.status_data.failure_data.next_retry_date)
              : undefined,
            customer_notified: changeStatusDto.status_data.failure_data.customer_notified,
            additional_info: changeStatusDto.status_data.failure_data.additional_info,
          };
        }

        if (changeStatusDto.status_data.cancellation_data) {
          statusMetadata.cancellation_data = changeStatusDto.status_data.cancellation_data;
        }

        statusHistory.status_metadata = statusMetadata;
      }

      if (changeStatusDto.location) {
        statusHistory.location = changeStatusDto.location;
      }

      // Atribuir driver_data apenas se driver_id estiver presente
      if (changeStatusDto.driver_id) {
        const driverData: typeof statusHistory.driver_data = {
          driver_id: changeStatusDto.driver_id,
        };

        if (changeStatusDto.vehicle_id) {
          driverData.vehicle_id = changeStatusDto.vehicle_id;
        }

        statusHistory.driver_data = driverData;
      }

      statusHistory.automatic_change = false;

      // Atribuir internal_notes apenas se estiver presente
      if (changeStatusDto.internal_notes) {
        statusHistory.internal_notes = changeStatusDto.internal_notes;
      }

      await queryRunner.manager.save(statusHistory);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Status da entrega ${delivery.tracking_code} alterado: ${oldStatus} -> ${newStatus} (Change ID: ${statusChangeId})`,
      );

      const completeDelivery = await this.findOneWithRelations(delivery.id);
      return DeliveryResponseDto.fromEntity(completeDelivery);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Erro ao alterar status da entrega:', error);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno ao alterar status da entrega',
        error instanceof Error ? error.message : String(error),
      );
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

      // Gerar ID da tentativa usando uuidv4
      const attemptId = uuidv4();

      // Criar tentativa
      const attempt = new DeliveryAttempt();
      Object.assign(attempt, {
        ...createAttemptDto,
        delivery_id: deliveryId,
        started_at: new Date(createAttemptDto.started_at ?? Date.now()),
      });

      const savedAttempt = await queryRunner.manager.save(attempt);

      // Se falhou, atualizar status da entrega
      if (createAttemptDto.status === 'FAILED' && createAttemptDto.failure_reason) {
        delivery.status = DeliveryStatus.FAILED;
        await queryRunner.manager.save(delivery);

        // Criar histórico de status
        const statusHistory = new DeliveryStatusHistory();
        statusHistory.delivery_id = deliveryId;
        statusHistory.from_status = DeliveryStatus.OUT_FOR_DELIVERY;
        statusHistory.to_status = DeliveryStatus.FAILED;
        statusHistory.changed_at = new Date();
        statusHistory.changed_by = createAttemptDto.driver_id;
        statusHistory.reason = `Tentativa ${createAttemptDto.attempt_number} falhou: ${createAttemptDto.failure_reason}`;
        statusHistory.context = {
          request_id: attemptId,
          source: 'API' as const,
        };

        // Construir failure_data corretamente
        const failureData: NonNullable<typeof statusHistory.status_metadata>['failure_data'] = {
          failure_reason: createAttemptDto.failure_reason,
          retry_attempt: createAttemptDto.attempt_number,
          additional_info: createAttemptDto.failure_description ?? undefined,
          customer_notified: undefined,
          next_retry_date: createAttemptDto.next_action?.scheduled_at
            ? new Date(createAttemptDto.next_action.scheduled_at)
            : undefined,
        };

        statusHistory.status_metadata = {
          failure_data: failureData,
        };

        await queryRunner.manager.save(statusHistory);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Tentativa de entrega registrada: ${delivery.tracking_code} - Tentativa ${createAttemptDto.attempt_number} (Attempt ID: ${attemptId})`,
      );

      return savedAttempt;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Erro ao registrar tentativa de entrega:', error);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno ao registrar tentativa de entrega',
        error instanceof Error ? error.message : String(error),
      );
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
      return this.generateTrackingCode();
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
