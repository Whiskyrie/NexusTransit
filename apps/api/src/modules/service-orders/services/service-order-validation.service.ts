import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatus } from '../enums/service_order-status';
import { Customer } from '../../customers/entities/customer.entity';
import { CustomerAddress } from '../../customers/entities/customer-address.entity';
import { CustomerStatus } from '../../customers/enums/customer-status.enum';
import { CustomerCategory } from '../../customers/enums/customer-category.enum';

/**
 * Contexto de validação para criação/atualização de ordem de serviço
 */
export interface ServiceOrderValidationContext {
  customer_id: string;
  pickup_address_id?: string;
  delivery_address_id?: string;
  requested_date?: Date;
  scheduled_date?: Date;
  total_weight?: number;
  total_volume?: number;
  package_count?: number;
  estimated_cost?: number;
  requires_insurance?: boolean;
  insurance_value?: number;
  sla_hours?: number;
}

/**
 * Resultado da validação
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Serviço de Validação para Service Orders
 *
 * Responsável por validar dados de ordens de serviço, verificar disponibilidade
 * de recursos, validar transições de status e verificar restrições de cliente
 */
@Injectable()
export class ServiceOrderValidationService {
  private readonly logger = new Logger(ServiceOrderValidationService.name);

  // Limites configuráveis
  private readonly MIN_SLA_HOURS = 4;
  private readonly MAX_INSURANCE_VALUE_WITHOUT_REQUIREMENT = 10000;
  private readonly MIN_WEIGHT_KG = 0.1;
  private readonly MIN_VOLUME_M3 = 0.001;
  private readonly MIN_PACKAGE_COUNT = 1;

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerAddress)
    private readonly customerAddressRepository: Repository<CustomerAddress>,
  ) {}

  /**
   * Valida dados para criação de ordem de serviço
   */
  async validateCreate(context: ServiceOrderValidationContext): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validar cliente
      await this.validateCustomer(context.customer_id, errors, warnings);

      // Validar endereços se fornecidos
      if (context.pickup_address_id) {
        await this.validateAddress(context.pickup_address_id, context.customer_id, errors);
      }

      if (context.delivery_address_id) {
        await this.validateAddress(context.delivery_address_id, context.customer_id, errors);
      }

      // Validar datas
      this.validateDates(context, errors, warnings);

      // Validar dados de carga
      this.validateCargoData(context, errors);

      // Validar seguro
      this.validateInsurance(context, errors, warnings);

      // Validar SLA
      this.validateSLA(context, errors);

      // Validar custo estimado
      this.validateEstimatedCost(context, warnings);

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro na validação: ${message}`);
      throw error;
    }
  }

  /**
   * Valida dados para atualização de ordem de serviço
   */
  async validateUpdate(
    _orderId: string,
    context: Partial<ServiceOrderValidationContext>,
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Se estiver atualizando cliente, validar
    if (context.customer_id) {
      await this.validateCustomer(context.customer_id, errors, warnings);
    }

    // Se estiver atualizando endereços, validar
    if (context.pickup_address_id && context.customer_id) {
      await this.validateAddress(context.pickup_address_id, context.customer_id, errors);
    }

    if (context.delivery_address_id && context.customer_id) {
      await this.validateAddress(context.delivery_address_id, context.customer_id, errors);
    }

    // Validar dados de carga se fornecidos
    this.validateCargoData(context, errors);

    // Validar seguro se fornecido
    this.validateInsurance(context, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida transição de status
   */
  validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    context?: {
      hasDeliveries?: boolean;
      allDeliveriesCompleted?: boolean;
      cancellationReason?: string;
    },
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Status finais não podem transitar
    if (currentStatus === OrderStatus.DELIVERED || currentStatus === OrderStatus.CANCELLED) {
      errors.push(`Ordem com status ${currentStatus} não pode ser alterada`);
      return { valid: false, errors, warnings };
    }

    // Validar transições específicas
    switch (newStatus) {
      case OrderStatus.IN_PROGRESS:
        if (!context?.hasDeliveries) {
          errors.push('Ordem deve ter pelo menos uma entrega para iniciar execução');
        }
        break;

      case OrderStatus.DELIVERED:
        if (!context?.allDeliveriesCompleted) {
          errors.push('Todas as entregas devem estar concluídas para finalizar a ordem');
        }
        break;

      case OrderStatus.CANCELLED:
        if (!context?.cancellationReason) {
          errors.push('Motivo do cancelamento é obrigatório');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida disponibilidade de recursos (veículos e motoristas)
   */
  validateResourceAvailability(
    vehicleId?: string,
    driverId?: string,
    scheduledDate?: Date,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // TODO: Implementar verificação real de disponibilidade
    // quando os módulos de veículos e motoristas estiverem completos

    if (vehicleId && !scheduledDate) {
      warnings.push('Veículo atribuído sem data de agendamento');
    }

    if (driverId && !scheduledDate) {
      warnings.push('Motorista atribuído sem data de agendamento');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida crédito do cliente
   */
  async validateCustomerCredit(customerId: string, _orderCost: number): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
      });

      if (!customer) {
        errors.push('Cliente não encontrado');
        return { valid: false, errors, warnings };
      }

      // Clientes VIP têm crédito ilimitado
      if (customer.category === CustomerCategory.VIP) {
        warnings.push('Cliente VIP - crédito não verificado');
        return { valid: true, errors, warnings };
      }

      // TODO: Implementar verificação real de crédito
      // quando o módulo de clientes tiver campo de crédito

      warnings.push('Verificação de crédito não implementada completamente');

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao validar crédito: ${message}`);
      throw error;
    }
  }

  /**
   * Valida se a ordem pode ser aprovada automaticamente
   */
  async canAutoApprove(customerId: string, orderCost: number): Promise<boolean> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
      });

      if (!customer) {
        return false;
      }

      // Cliente VIP - aprovação automática
      if (customer.category === CustomerCategory.VIP) {
        this.logger.log(`Cliente VIP ${customer.name} - aprovação automática`);
        return true;
      }

      // Valor abaixo do limite - aprovação automática
      if (orderCost < 500) {
        this.logger.log(`Valor ${orderCost} abaixo do limite - aprovação automática`);
        return true;
      }

      // TODO: Verificar crédito disponível

      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao verificar aprovação automática: ${message}`);
      return false;
    }
  }

  /**
   * Determina prioridade automática baseada no cliente e contexto
   */
  async determineAutoPriority(
    customerId: string,
    requestedDate?: Date,
    _isFirstOrder?: boolean,
  ): Promise<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
      });

      if (!customer) {
        return 'NORMAL';
      }

      // Cliente VIP - prioridade alta
      if (customer.category === CustomerCategory.VIP) {
        return 'HIGH';
      }

      // Prazo curto - prioridade alta ou urgente
      if (requestedDate) {
        const hoursUntilDelivery = (requestedDate.getTime() - Date.now()) / (1000 * 60 * 60);

        if (hoursUntilDelivery < 4) {
          return 'URGENT';
        }
        if (hoursUntilDelivery < 24) {
          return 'HIGH';
        }
      }

      return 'NORMAL';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao determinar prioridade: ${message}`);
      return 'NORMAL';
    }
  }

  // Métodos privados de validação

  private async validateCustomer(
    customerId: string,
    errors: string[],
    warnings: string[],
  ): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      errors.push('Cliente não encontrado');
      return;
    }

    if (customer.status !== CustomerStatus.ACTIVE) {
      errors.push(
        `Cliente está com status ${customer.status}. Apenas clientes ativos podem criar ordens`,
      );
    }

    if (customer.category === CustomerCategory.VIP) {
      warnings.push('Cliente VIP - prioridade alta será aplicada automaticamente');
    }
  }

  private async validateAddress(
    addressId: string,
    customerId: string,
    errors: string[],
  ): Promise<void> {
    const address = await this.customerAddressRepository.findOne({
      where: { id: addressId },
    });

    if (!address) {
      errors.push('Endereço não encontrado');
      return;
    }

    if (address.customerId !== customerId) {
      errors.push('Endereço não pertence ao cliente informado');
    }
  }

  private validateDates(
    context: ServiceOrderValidationContext,
    errors: string[],
    _warnings: string[],
  ): void {
    const now = new Date();

    if (context.requested_date && context.requested_date < now) {
      errors.push('Data solicitada não pode ser no passado');
    }

    if (context.scheduled_date && context.scheduled_date < now) {
      errors.push('Data agendada não pode ser no passado');
    }

    if (context.requested_date && context.scheduled_date) {
      if (context.scheduled_date < context.requested_date) {
        errors.push('Data agendada não pode ser anterior à data solicitada');
      }
    }
  }

  private validateCargoData(
    context: Partial<ServiceOrderValidationContext>,
    errors: string[],
  ): void {
    if (context.total_weight !== undefined && context.total_weight < this.MIN_WEIGHT_KG) {
      errors.push(`Peso total deve ser maior que ${this.MIN_WEIGHT_KG} kg`);
    }

    if (context.total_volume !== undefined && context.total_volume < this.MIN_VOLUME_M3) {
      errors.push(`Volume total deve ser maior que ${this.MIN_VOLUME_M3} m³`);
    }

    if (context.package_count !== undefined && context.package_count < this.MIN_PACKAGE_COUNT) {
      errors.push(`Quantidade de volumes deve ser maior que ${this.MIN_PACKAGE_COUNT}`);
    }
  }

  private validateInsurance(
    context: Partial<ServiceOrderValidationContext>,
    errors: string[],
    warnings: string[],
  ): void {
    if (
      context.insurance_value &&
      context.insurance_value > this.MAX_INSURANCE_VALUE_WITHOUT_REQUIREMENT
    ) {
      if (!context.requires_insurance) {
        warnings.push(
          `Valor do seguro (${context.insurance_value}) excede o limite de ${this.MAX_INSURANCE_VALUE_WITHOUT_REQUIREMENT}. Seguro obrigatório recomendado.`,
        );
      }
    }

    if (context.requires_insurance && !context.insurance_value) {
      errors.push('Valor do seguro é obrigatório quando seguro é requerido');
    }
  }

  private validateSLA(context: ServiceOrderValidationContext, errors: string[]): void {
    if (context.sla_hours !== undefined && context.sla_hours < this.MIN_SLA_HOURS) {
      errors.push(`SLA mínimo é de ${this.MIN_SLA_HOURS} horas`);
    }
  }

  private validateEstimatedCost(context: ServiceOrderValidationContext, warnings: string[]): void {
    if (context.estimated_cost === undefined || context.estimated_cost === 0) {
      warnings.push('Custo estimado não informado. Será calculado automaticamente.');
    }
  }
}
