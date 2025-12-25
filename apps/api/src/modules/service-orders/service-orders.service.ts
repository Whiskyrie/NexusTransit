import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, ILike } from 'typeorm';
import { ServiceOrder } from './entities/service-order.entity';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { ServiceOrderFilterDto } from './dto/service-order-filter.dto';
import { ServiceOrderResponseDto } from './dto/service-order-response.dto';
import { PaginatedResponseDto } from '@nexus/common';
import {
  OrderStatus,
  isValidStatusTransition,
  FinalOrderStatuses,
} from './enums/service_order-status';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { CreateDeliveryDto } from '../deliveries/dto/create-delivery.dto';
import { DeliveryResponseDto } from '../deliveries/dto/delivery-response.dto';
import { GenerateDeliveryFromServiceOrderDto } from './dto/generate-delivery-from-service-order.dto';

@Injectable()
export class ServiceOrdersService {
  private readonly logger = new Logger(ServiceOrdersService.name);

  constructor(
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    private readonly deliveriesService: DeliveriesService,
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
      relations: ['vehicle', 'driver'],
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
      relations: ['vehicle', 'driver'],
    });

    if (!serviceOrder) {
      throw new NotFoundException(`Ordem ${orderNumber} não encontrada`);
    }

    return this.mapToResponseDto(serviceOrder);
  }

  /**
   * Atualiza uma ordem de serviço
   */
  async update(id: string, updateDto: UpdateServiceOrderDto): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id);

    // Valida transição de status se fornecida
    if (updateDto.status && updateDto.status !== serviceOrder.status) {
      this.validateStatusTransition(serviceOrder.status, updateDto.status);
    }

    // Impede alterações em ordens finalizadas
    if (FinalOrderStatuses.includes(serviceOrder.status)) {
      throw new BadRequestException(
        `Ordem ${serviceOrder.order_number} está finalizada e não pode ser alterada`,
      );
    }

    // Atualiza campos
    Object.assign(serviceOrder, updateDto);

    const updated = await this.serviceOrderRepository.save(serviceOrder);

    this.logger.log(`Ordem ${updated.order_number} atualizada`);

    return this.mapToResponseDto(updated);
  }

  /**
   * Inicia a execução de uma ordem
   */
  async startOrder(id: string, userId?: string): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id);

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

    return this.mapToResponseDto(updated);
  }

  /**
   * Completa uma ordem de serviço
   */
  async completeOrder(
    id: string,
    completionData?: { report?: string; actual_cost?: number; userId?: string },
  ): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id);

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

    return this.mapToResponseDto(updated);
  }

  /**
   * Cancela uma ordem de serviço
   */
  async cancelOrder(id: string, reason: string, userId?: string): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.findServiceOrderOrFail(id);

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
    if (serviceOrder.metadata?.generated_delivery_id) {
      throw new BadRequestException(
        `Ordem ${serviceOrder.order_number} já possui entrega gerada: ${serviceOrder.metadata.generated_delivery_id}`,
      );
    }

    // Constrói o DTO de criação de entrega
    const createDeliveryDto: CreateDeliveryDto = {
      customer_id: deliveryData.customer_id,
      priority: deliveryData.priority,
      description: deliveryData.description,
      weight: deliveryData.weight,
      declared_value: deliveryData.declared_value,
      pickup_address: {
        street:
          deliveryData.pickup_address?.street || serviceOrder.service_location || 'Endereço da OS',
        number: deliveryData.pickup_address?.number || 'S/N',
        complement: deliveryData.pickup_address?.complement,
        neighborhood: deliveryData.pickup_address?.neighborhood || '',
        city: deliveryData.pickup_address?.city || 'Cidade',
        state: deliveryData.pickup_address?.state || 'UF',
        postal_code: deliveryData.pickup_address?.postal_code || '00000-000',
        country: deliveryData.pickup_address?.country ?? 'Brasil',
        latitude: deliveryData.pickup_address?.latitude,
        longitude: deliveryData.pickup_address?.longitude,
      },
      delivery_address: {
        street: deliveryData.delivery_address.street,
        number: deliveryData.delivery_address.number,
        complement: deliveryData.delivery_address.complement,
        neighborhood: deliveryData.delivery_address.neighborhood,
        city: deliveryData.delivery_address.city,
        state: deliveryData.delivery_address.state,
        postal_code: deliveryData.delivery_address.postal_code,
        country: deliveryData.delivery_address.country ?? 'Brasil',
        latitude: deliveryData.delivery_address.latitude,
        longitude: deliveryData.delivery_address.longitude,
      },
      sender_contact: {
        name: deliveryData.pickup_contact.name,
        phone: deliveryData.pickup_contact.phone,
        email: deliveryData.pickup_contact.email,
      },
      recipient_contact: {
        name: deliveryData.delivery_contact.name,
        phone: deliveryData.delivery_contact.phone,
        email: deliveryData.delivery_contact.email,
      },
      scheduled_pickup_at: deliveryData.scheduled_pickup_at,
      scheduled_delivery_at: deliveryData.scheduled_delivery_at,
      notes: deliveryData.notes,
    };

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

    return delivery;
  }

  // Métodos privados auxiliares

  private async findServiceOrderOrFail(id: string): Promise<ServiceOrder> {
    const serviceOrder = await this.serviceOrderRepository.findOne({
      where: { id },
    });

    if (!serviceOrder) {
      throw new NotFoundException(`Ordem de serviço com ID ${id} não encontrada`);
    }

    return serviceOrder;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    if (!isValidStatusTransition(currentStatus, newStatus)) {
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
}
