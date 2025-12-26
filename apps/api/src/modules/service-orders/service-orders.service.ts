import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, ILike } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GoogleMapsService } from '@nexus/geo-services';
import { ServiceOrder } from './entities/service-order.entity';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { ServiceOrderFilterDto } from './dto/service-order-filter.dto';
import { ServiceOrderResponseDto } from './dto/service-order-response.dto';
import { PaginatedResponseDto } from '@nexus/common';
import { OrderStatus, FinalOrderStatuses } from './enums/service_order-status';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { DeliveryResponseDto } from '../deliveries/dto/delivery-response.dto';
import { GenerateDeliveryFromServiceOrderDto } from './dto/generate-delivery-from-service-order.dto';
import {
  ServiceOrderCreatedEvent,
  ServiceOrderScheduledEvent,
  ServiceOrderStartedEvent,
  ServiceOrderCompletedEvent,
  ServiceOrderCancelledEvent,
  DeliveryGeneratedEvent,
  ServiceOrderStatusChangedEvent,
} from './events';
import { ServiceOrderWorkflowService } from './services/service-order-workflow.service';
import { ServiceOrderValidationService } from './services/service-order-validation.service';
import { ServiceOrderPricingService } from './services/service-order-pricing.service';
import { ServiceOrderToDeliveryMapper } from './mappers/service-order-to-delivery.mapper';
import { InvoiceDto } from './dto/invoice.dto';
import { QuotationDto } from './dto/quotation.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus } from './enums/payment-status.enum';

@Injectable()
export class ServiceOrdersService {
  private readonly logger = new Logger(ServiceOrdersService.name);

  constructor(
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    private readonly deliveriesService: DeliveriesService,
    private readonly eventEmitter: EventEmitter2,
    private readonly workflowService: ServiceOrderWorkflowService,
    private readonly validationService: ServiceOrderValidationService,
    private readonly pricingService: ServiceOrderPricingService,
    private readonly deliveryMapper: ServiceOrderToDeliveryMapper,
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  /**
   * Cria uma nova ordem de serviço
   */
  async create(createDto: CreateServiceOrderDto): Promise<ServiceOrderResponseDto> {
    // Gera número único da ordem
    const orderNumber = await this.generateOrderNumber();

    // Valida veículo e motorista se fornecidos
    if (createDto.vehicle_id && createDto.driver_id) {
      this.logger.log(
        `Criando ordem com veículo ${createDto.vehicle_id} e motorista ${createDto.driver_id}`,
      );
    }

    const serviceOrderData = {
      ...createDto,
      order_number: orderNumber,
      status: createDto.status ?? OrderStatus.PENDING,
      estimated_cost: createDto.estimated_cost ?? 0,
      ...(createDto.scheduled_date && { scheduled_date: new Date(createDto.scheduled_date) }),
    };

    const serviceOrder = this.serviceOrderRepository.create(serviceOrderData);
    const saved = await this.serviceOrderRepository.save(serviceOrder);

    this.logger.log(`Ordem de serviço criada: ${saved.order_number}`);

    // Emitir evento de criação
    this.eventEmitter.emit(
      'service-order.created',
      new ServiceOrderCreatedEvent(
        saved.id,
        saved.order_number,
        saved.created_by,
        saved.service_type,
        saved.priority,
        saved.created_by,
      ),
    );

    return this.mapToResponseDto(saved);
  }

  /**
   * Lista ordens de serviço com filtros e paginação
   */
  async findAll(
    filterDto: ServiceOrderFilterDto,
  ): Promise<PaginatedResponseDto<ServiceOrderResponseDto>> {
    const { page = 1, limit = 10, search, ...filters } = filterDto;

    const where: FindOptionsWhere<ServiceOrder> = {};

    // Aplicar filtros
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.service_type) {
      where.service_type = filters.service_type;
    }

    if (filters.vehicle_id) {
      where.vehicle_id = filters.vehicle_id;
    }

    if (filters.driver_id) {
      where.driver_id = filters.driver_id;
    }

    if (filters.created_by) {
      where.created_by = filters.created_by;
    }

    // Filtro de busca por texto
    if (search) {
      where.title = ILike(`%${search}%`);
    }

    // Filtro de data agendada
    if (filters.scheduled_date_start && filters.scheduled_date_end) {
      where.scheduled_date = Between(
        new Date(filters.scheduled_date_start),
        new Date(filters.scheduled_date_end),
      );
    }

    const [serviceOrders, total] = await this.serviceOrderRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
      relations: ['vehicle', 'driver'],
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: serviceOrders.map(so => this.mapToResponseDto(so)),
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
   * Busca uma ordem de serviço por ID
   */
  async findOne(id: string): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.serviceOrderRepository.findOne({
      where: { id },
      relations: ['vehicle', 'driver', 'customer', 'pickup_address', 'delivery_address'],
    });

    if (!serviceOrder) {
      throw new NotFoundException(`Ordem de serviço com ID ${id} não encontrada`);
    }

    return this.mapToResponseDto(serviceOrder);
  }

  /**
   * Busca uma ordem por número
   */
  async findByOrderNumber(orderNumber: string): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.serviceOrderRepository.findOne({
      where: { order_number: orderNumber },
      relations: ['vehicle', 'driver', 'customer', 'pickup_address', 'delivery_address'],
    });

    if (!serviceOrder) {
      throw new NotFoundException(`Ordem ${orderNumber} não encontrada`);
    }

    return this.mapToResponseDto(serviceOrder);
  }

  /**
   * Busca uma ordem de serviço por ID (lança exceção se não encontrar)
   */
  private async findServiceOrderOrFail(id: string, withRelations = false): Promise<ServiceOrder> {
    const serviceOrder = await this.serviceOrderRepository.findOne({
      where: { id },
      relations: withRelations
        ? ['vehicle', 'driver', 'customer', 'pickup_address', 'delivery_address']
        : [],
    });

    if (!serviceOrder) {
      throw new NotFoundException(`Ordem de serviço com ID ${id} não encontrada`);
    }

    return serviceOrder;
  }

  /**
   * Atualiza uma ordem de serviço
   */
  async update(id: string, updateDto: UpdateServiceOrderDto): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id, true);

    // Valida transição de status se fornecida
    if (updateDto.status && updateDto.status !== serviceOrder.status) {
      await this.validateStatusTransition(
        serviceOrder.status,
        updateDto.status,
        updateDto as unknown as Record<string, unknown>,
      );
    }

    // Impede alterações em ordens finalizadas
    if (FinalOrderStatuses.includes(serviceOrder.status)) {
      throw new BadRequestException(
        `Ordem ${serviceOrder.order_number} está finalizada e não pode ser alterada`,
      );
    }

    // Captura status anterior para evento
    const previousStatus = serviceOrder.status;

    // Atualiza campos
    Object.assign(serviceOrder, updateDto);

    const updated = await this.serviceOrderRepository.save(serviceOrder);

    this.logger.log(`Ordem ${updated.order_number} atualizada`);

    // Emitir evento se houve mudança de status
    if (updateDto.status && updateDto.status !== previousStatus) {
      // Evento genérico de mudança de status
      this.eventEmitter.emit(
        'service-order.status-changed',
        new ServiceOrderStatusChangedEvent(
          updated.id,
          updated.order_number,
          previousStatus,
          updated.status,
          new Date(),
          updated.updated_by,
        ),
      );

      // Eventos específicos para cada tipo de transição
      this.emitStatusSpecificEvents(updated);

      this.logger.debug(`Eventos de transição emitidos: ${previousStatus} -> ${updated.status}`);
    }

    return this.mapToResponseDto(updated);
  }

  /**
   * Inicia a execução de uma ordem
   */
  async startOrder(id: string, userId?: string): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id, true);

    if (serviceOrder.status !== OrderStatus.SCHEDULED) {
      throw new BadRequestException(
        `Ordem deve estar agendada para ser iniciada. Status atual: ${serviceOrder.status}`,
      );
    }

    serviceOrder.status = OrderStatus.IN_PROGRESS;
    serviceOrder.started_at = new Date();
    if (userId) {
      serviceOrder.updated_by = userId;
    }

    const updated = await this.serviceOrderRepository.save(serviceOrder);

    this.logger.log(`Ordem ${updated.order_number} iniciada`);

    // Emitir evento de início
    this.eventEmitter.emit(
      'service-order.started',
      new ServiceOrderStartedEvent(
        updated.id,
        updated.order_number,
        updated.started_at ?? new Date(),
        updated.driver_id,
        updated.vehicle_id,
      ),
    );

    return this.mapToResponseDto(updated);
  }

  /**
   * Completa uma ordem de serviço
   */
  async completeOrder(
    id: string,
    completionData?: { report?: string; actual_cost?: number; userId?: string },
  ): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id, true);

    if (serviceOrder.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Ordem deve estar em execução para ser concluída. Status atual: ${serviceOrder.status}`,
      );
    }

    serviceOrder.status = OrderStatus.DELIVERED;
    serviceOrder.completed_at = new Date();
    if (completionData?.report !== undefined) {
      serviceOrder.completion_report = completionData.report;
    }
    if (completionData?.actual_cost !== undefined) {
      serviceOrder.actual_cost = completionData.actual_cost;
    }

    // Calcula duração real se houver data de início
    if (serviceOrder.started_at) {
      const duration = Math.floor(
        (serviceOrder.completed_at.getTime() - serviceOrder.started_at.getTime()) / 1000 / 60,
      );
      serviceOrder.actual_duration_minutes = duration;
    }

    if (completionData?.userId) {
      serviceOrder.updated_by = completionData.userId;
    }

    const updated = await this.serviceOrderRepository.save(serviceOrder);

    this.logger.log(`Ordem ${updated.order_number} concluída`);

    // Emitir evento de conclusão
    this.eventEmitter.emit(
      'service-order.completed',
      new ServiceOrderCompletedEvent(
        updated.id,
        updated.order_number,
        updated.completed_at ?? new Date(),
        updated.actual_cost,
        updated.actual_duration_minutes,
        updated.completion_report,
      ),
    );

    return this.mapToResponseDto(updated);
  }

  /**
   * Cancela uma ordem de serviço
   */
  async cancelOrder(id: string, reason: string, userId?: string): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id, true);

    if (FinalOrderStatuses.includes(serviceOrder.status)) {
      throw new BadRequestException(`Ordem ${serviceOrder.order_number} já está finalizada`);
    }

    serviceOrder.status = OrderStatus.CANCELLED;
    serviceOrder.cancelled_at = new Date();
    serviceOrder.cancellation_reason = reason;

    if (userId) {
      serviceOrder.updated_by = userId;
    }

    const updated = await this.serviceOrderRepository.save(serviceOrder);

    this.logger.log(`Ordem ${updated.order_number} cancelada: ${reason}`);

    // Emitir evento de cancelamento
    this.eventEmitter.emit(
      'service-order.cancelled',
      new ServiceOrderCancelledEvent(
        updated.id,
        updated.order_number,
        updated.cancelled_at ?? new Date(),
        reason,
        userId,
      ),
    );

    return this.mapToResponseDto(updated);
  }

  /**
   * Pausa uma ordem de serviço em execução
   */
  async pauseOrder(id: string, reason?: string, userId?: string): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id, true);

    if (serviceOrder.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Ordem deve estar em execução para ser pausada. Status atual: ${serviceOrder.status}`,
      );
    }

    const previousStatus = serviceOrder.status;
    serviceOrder.status = OrderStatus.ON_HOLD;

    if (userId) {
      serviceOrder.updated_by = userId;
    }

    // Armazenar motivo da pausa nos metadados
    serviceOrder.metadata = {
      ...serviceOrder.metadata,
      pause_reason: reason,
      paused_at: new Date().toISOString(),
      paused_by: userId,
    };

    const updated = await this.serviceOrderRepository.save(serviceOrder);

    this.logger.log(
      `Ordem ${updated.order_number} pausada: ${reason ?? 'Sem motivo especificado'}`,
    );

    // Emitir evento de mudança de status
    this.eventEmitter.emit(
      'service-order.status-changed',
      new ServiceOrderStatusChangedEvent(
        updated.id,
        updated.order_number,
        previousStatus,
        updated.status,
        new Date(),
        userId,
      ),
    );

    return this.mapToResponseDto(updated);
  }

  /**
   * Retoma uma ordem de serviço pausada
   */
  async resumeOrder(id: string, userId?: string): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id, true);

    if (serviceOrder.status !== OrderStatus.ON_HOLD) {
      throw new BadRequestException(
        `Ordem deve estar pausada para ser retomada. Status atual: ${serviceOrder.status}`,
      );
    }

    const previousStatus = serviceOrder.status;
    serviceOrder.status = OrderStatus.IN_PROGRESS;

    if (userId) {
      serviceOrder.updated_by = userId;
    }

    // Registrar retomada nos metadados
    serviceOrder.metadata = {
      ...serviceOrder.metadata,
      resumed_at: new Date().toISOString(),
      resumed_by: userId,
    };

    const updated = await this.serviceOrderRepository.save(serviceOrder);

    this.logger.log(`Ordem ${updated.order_number} retomada`);

    // Emitir evento de mudança de status
    this.eventEmitter.emit(
      'service-order.status-changed',
      new ServiceOrderStatusChangedEvent(
        updated.id,
        updated.order_number,
        previousStatus,
        updated.status,
        new Date(),
        userId,
      ),
    );

    return this.mapToResponseDto(updated);
  }

  /**
   * Remove uma ordem de serviço (soft delete)
   */
  async remove(id: string): Promise<void> {
    const serviceOrder = await this.findServiceOrderOrFail(id);

    await this.serviceOrderRepository.softRemove(serviceOrder);

    this.logger.log(`Ordem ${serviceOrder.order_number} removida`);
  }

  /**
   * Gera uma entrega automática a partir de uma ordem de serviço
   *
   * Utilizado quando uma OS do tipo PICKUP ou DELIVERY precisa gerar
   * uma entrega automaticamente no sistema de logística
   */
  async generateDeliveryFromServiceOrder(
    serviceOrderId: string,
    deliveryData: GenerateDeliveryFromServiceOrderDto,
  ): Promise<DeliveryResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(serviceOrderId);

    // Valida se a ordem está em status válido para gerar entrega
    const validStatusesForDelivery = [
      OrderStatus.PENDING,
      OrderStatus.SCHEDULED,
      OrderStatus.IN_PROGRESS,
    ];

    if (!validStatusesForDelivery.includes(serviceOrder.status)) {
      throw new BadRequestException(
        `Ordem ${serviceOrder.order_number} está em status ${serviceOrder.status} e não pode gerar entrega`,
      );
    }

    // Verifica se já existe entrega gerada
    const existingDeliveryId = serviceOrder.metadata?.generated_delivery_id as string | undefined;
    if (existingDeliveryId) {
      throw new BadRequestException(
        `Ordem ${serviceOrder.order_number} já possui entrega gerada (ID: ${existingDeliveryId})`,
      );
    }

    // Valida dados obrigatórios
    this.deliveryMapper.validateDeliveryData(deliveryData);

    // Usa o mapper para converter OS em DTO de delivery
    const createDeliveryDto = this.deliveryMapper.mapToCreateDeliveryDto(
      serviceOrder,
      deliveryData,
    );

    this.logger.log(`Gerando entrega para OS ${serviceOrder.order_number} usando mapper`);

    // Cria a entrega
    const delivery = await this.deliveriesService.create(createDeliveryDto);

    // Atualiza a OS com referência à entrega gerada
    serviceOrder.metadata = {
      ...serviceOrder.metadata,
      generated_delivery_id: delivery.id,
      generated_delivery_tracking_code: delivery.tracking_code,
      delivery_generated_at: new Date().toISOString(),
    };

    await this.serviceOrderRepository.save(serviceOrder);

    this.logger.log(
      `Entrega gerada para OS ${serviceOrder.order_number}: ${delivery.tracking_code}`,
    );

    // Emitir evento de entrega gerada
    this.eventEmitter.emit(
      'delivery.generated',
      new DeliveryGeneratedEvent(
        serviceOrder.id,
        serviceOrder.order_number,
        delivery.id,
        delivery.tracking_code,
        new Date(),
      ),
    );

    return delivery;
  }

  // Métodos privados auxiliares

  private async validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    context?: Record<string, unknown>,
  ): Promise<void> {
    const canTransition = await this.workflowService.canTransition(
      currentStatus,
      newStatus,
      context,
    );

    if (!canTransition) {
      throw new BadRequestException(
        `Transição de status inválida: ${currentStatus} -> ${newStatus}`,
      );
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.serviceOrderRepository.count();
    const nextNumber = (count + 1).toString().padStart(5, '0');
    return `OS-${year}-${nextNumber}`;
  }

  private mapToResponseDto(serviceOrder: ServiceOrder): ServiceOrderResponseDto {
    const dto = new ServiceOrderResponseDto();
    Object.assign(dto, serviceOrder);
    return dto;
  }

  /**
   * Emite eventos específicos baseados na transição de status
   */
  private emitStatusSpecificEvents(serviceOrder: ServiceOrder): void {
    switch (serviceOrder.status) {
      case OrderStatus.SCHEDULED:
        if (serviceOrder.scheduled_date) {
          this.eventEmitter.emit(
            'service-order.scheduled',
            new ServiceOrderScheduledEvent(
              serviceOrder.id,
              serviceOrder.order_number,
              serviceOrder.scheduled_date,
              serviceOrder.driver_id,
              serviceOrder.vehicle_id,
            ),
          );
          this.logger.debug(
            `Evento service-order.scheduled emitido para OS ${serviceOrder.order_number}`,
          );
        }
        break;

      case OrderStatus.IN_PROGRESS:
        this.eventEmitter.emit(
          'service-order.started',
          new ServiceOrderStartedEvent(
            serviceOrder.id,
            serviceOrder.order_number,
            new Date(),
            serviceOrder.driver_id,
            serviceOrder.vehicle_id,
          ),
        );
        this.logger.debug(
          `Evento service-order.started emitido para OS ${serviceOrder.order_number}`,
        );
        break;

      case OrderStatus.DELIVERED:
        this.eventEmitter.emit(
          'service-order.completed',
          new ServiceOrderCompletedEvent(
            serviceOrder.id,
            serviceOrder.order_number,
            new Date(),
            serviceOrder.actual_cost ?? serviceOrder.estimated_cost,
          ),
        );
        this.logger.log(
          `Evento service-order.completed emitido para OS ${serviceOrder.order_number}`,
        );
        break;

      case OrderStatus.CANCELLED:
        this.eventEmitter.emit(
          'service-order.cancelled',
          new ServiceOrderCancelledEvent(
            serviceOrder.id,
            serviceOrder.order_number,
            new Date(),
            serviceOrder.cancellation_reason ?? 'Não informado',
            serviceOrder.updated_by,
          ),
        );
        this.logger.log(
          `Evento service-order.cancelled emitido para OS ${serviceOrder.order_number}`,
        );
        break;

      default:
        // Outros status não têm eventos específicos
        this.logger.debug(`Status ${serviceOrder.status} não possui evento específico`);
    }
  }

  // Métodos de aprovação

  /**
   * Aprova uma ordem de serviço
   */
  async approveOrder(id: string, approvedByUserId?: string): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id, true);

    // Validar se está em PENDING
    if (serviceOrder.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Ordem está com status ${serviceOrder.status}. Apenas ordens PENDING podem ser aprovadas`,
      );
    }

    // Verificar aprovação automática
    const canAutoApprove = await this.validationService.canAutoApprove(
      serviceOrder.customer_id,
      serviceOrder.estimated_cost,
    );

    if (!canAutoApprove && !approvedByUserId) {
      throw new BadRequestException('Ordem requer aprovação manual. Informe o usuário aprovador.');
    }

    // Atualizar status para SCHEDULED
    serviceOrder.status = OrderStatus.SCHEDULED;
    serviceOrder.approved_by_user_id = approvedByUserId;

    const updated = await this.serviceOrderRepository.save(serviceOrder);

    this.logger.log(`Ordem ${updated.order_number} aprovada por ${approvedByUserId}`);

    // Emitir evento de mudança de status
    this.eventEmitter.emit(
      'service-order.status-changed',
      new ServiceOrderStatusChangedEvent(
        updated.id,
        updated.order_number,
        OrderStatus.PENDING,
        OrderStatus.SCHEDULED,
        new Date(),
        approvedByUserId,
      ),
    );

    return this.mapToResponseDto(updated);
  }

  /**
   * Rejeita uma ordem de serviço
   */
  async rejectOrder(id: string, reason: string): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id, true);

    // Validar se está em PENDING
    if (serviceOrder.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Ordem está com status ${serviceOrder.status}. Apenas ordens PENDING podem ser rejeitadas`,
      );
    }

    // Atualizar status para CANCELLED
    serviceOrder.status = OrderStatus.CANCELLED;
    serviceOrder.cancellation_reason = reason;
    serviceOrder.cancelled_at = new Date();

    const updated = await this.serviceOrderRepository.save(serviceOrder);

    this.logger.log(`Ordem ${updated.order_number} rejeitada: ${reason}`);

    // Emitir evento de cancelamento
    this.eventEmitter.emit(
      'service-order.cancelled',
      new ServiceOrderCancelledEvent(
        updated.id,
        updated.order_number,
        new Date(),
        reason,
        updated.updated_by,
      ),
    );

    return this.mapToResponseDto(updated);
  }

  // Métodos financeiros

  /**
   * Gera uma cotação para a ordem
   */
  async getQuotation(id: string): Promise<QuotationDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id, true);

    // Calcular distância entre endereços usando GeoServices
    let distance_km = 10; // Valor padrão se não for possível calcular

    try {
      if (serviceOrder.pickup_address && serviceOrder.delivery_address) {
        const pickupAddress = serviceOrder.pickup_address;
        const deliveryAddress = serviceOrder.delivery_address;

        // Construir endereços completos para o cálculo
        const originAddress = `${pickupAddress.street}, ${pickupAddress.number}, ${pickupAddress.neighborhood}, ${pickupAddress.city}, ${pickupAddress.state}, ${pickupAddress.zipCode}`;
        const destinationAddress = `${deliveryAddress.street}, ${deliveryAddress.number}, ${deliveryAddress.neighborhood}, ${deliveryAddress.city}, ${deliveryAddress.state}, ${deliveryAddress.zipCode}`;

        const distanceMatrix = await this.googleMapsService.getDistanceMatrix(
          [originAddress],
          [destinationAddress],
        );

        // O valor está em metros, converter para km
        if (distanceMatrix.rows[0]?.elements[0]?.distance?.value) {
          distance_km = distanceMatrix.rows[0].elements[0].distance.value / 1000;
        }

        this.logger.log(`Distância calculada: ${distance_km.toFixed(2)} km`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.warn(
        `Não foi possível calcular distância real, usando valor padrão: ${errorMessage}`,
      );
    }

    // Obter categoria do cliente
    const customer_category = serviceOrder.customer?.category;

    const quotation = this.pricingService.generateQuotation({
      order_type: serviceOrder.order_type,
      total_weight: serviceOrder.total_weight,
      total_volume: serviceOrder.total_volume,
      package_count: serviceOrder.package_count,
      distance_km,
      priority: serviceOrder.priority,
      requires_insurance: serviceOrder.requires_insurance,
      insurance_value: serviceOrder.insurance_value,
      customer_category,
    });

    this.logger.log(`Cotação gerada para OS ${serviceOrder.order_number}: R$ ${quotation.total}`);

    return QuotationDto.fromPricingResult(quotation);
  }

  /**
   * Obtém detalhes financeiros da ordem
   */
  async getFinancialDetails(id: string): Promise<{
    estimated_cost: number;
    actual_cost?: number;
    payment_status: string;
    payment_method?: string;
    invoice_number?: string;
    insurance_value?: number;
    total: number;
  }> {
    const serviceOrder = await this.findServiceOrderOrFail(id, true);

    return {
      estimated_cost: serviceOrder.estimated_cost,
      actual_cost: serviceOrder.actual_cost,
      payment_status: serviceOrder.payment_status,
      payment_method: serviceOrder.payment_method,
      invoice_number: serviceOrder.invoice_number,
      insurance_value: serviceOrder.insurance_value,
      total: serviceOrder.actual_cost ?? serviceOrder.estimated_cost,
    };
  }

  /**
   * Gera nota fiscal para a ordem
   */
  async generateInvoice(id: string, invoiceDto: InvoiceDto): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id);

    // Validar se ordem permite nota fiscal
    if (serviceOrder.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Ordens canceladas não podem ter nota fiscal');
    }

    // Atualizar dados da nota fiscal
    serviceOrder.invoice_number = invoiceDto.invoice_number;
    serviceOrder.payment_method = invoiceDto.payment_method ?? serviceOrder.payment_method;

    const updated = await this.serviceOrderRepository.save(serviceOrder);

    this.logger.log(
      `Nota fiscal ${invoiceDto.invoice_number} gerada para OS ${updated.order_number}`,
    );

    return this.mapToResponseDto(updated);
  }

  /**
   * Atualiza informações de pagamento
   */
  async updatePayment(id: string, paymentDto: UpdatePaymentDto): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id, true);

    // Validar se ordem permite atualização de pagamento
    if (serviceOrder.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Ordens canceladas não podem ter pagamento atualizado');
    }

    // Atualizar dados de pagamento
    if (paymentDto.payment_status) {
      serviceOrder.payment_status = paymentDto.payment_status;
    }

    if (paymentDto.payment_method) {
      serviceOrder.payment_method = paymentDto.payment_method;
    }

    if (paymentDto.amount_paid !== undefined) {
      serviceOrder.actual_cost = paymentDto.amount_paid;
    }

    const updated = await this.serviceOrderRepository.save(serviceOrder);

    this.logger.log(
      `Pagamento atualizado para OS ${updated.order_number}: ${paymentDto.payment_status}`,
    );

    return this.mapToResponseDto(updated);
  }

  /**
   * Lista ordens não pagas
   */
  async getUnpaidOrders(
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponseDto<ServiceOrderResponseDto>> {
    const where: FindOptionsWhere<ServiceOrder> = {
      payment_status: PaymentStatus.PENDING,
    };

    const [orders, total] = await this.serviceOrderRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: orders.map(o => this.mapToResponseDto(o)),
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
   * Lista ordens aguardando aprovação
   */
  async getPendingApprovalOrders(
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponseDto<ServiceOrderResponseDto>> {
    const where: FindOptionsWhere<ServiceOrder> = {
      status: OrderStatus.PENDING,
    };

    const [orders, total] = await this.serviceOrderRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: orders.map(o => this.mapToResponseDto(o)),
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
   * Lista ordens por cliente
   */
  async getOrdersByCustomer(
    customerId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponseDto<ServiceOrderResponseDto>> {
    const where: FindOptionsWhere<ServiceOrder> = {
      customer_id: customerId,
    };

    const [orders, total] = await this.serviceOrderRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: orders.map(o => this.mapToResponseDto(o)),
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
}
