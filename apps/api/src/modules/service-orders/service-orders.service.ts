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

@Injectable()
export class ServiceOrdersService {
  private readonly logger = new Logger(ServiceOrdersService.name);

  constructor(
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
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
