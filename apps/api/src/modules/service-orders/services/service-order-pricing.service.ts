import { Injectable, Logger } from '@nestjs/common';
import { OrderType } from '../enums/order-type.enum';
import { OrderPriority } from '../enums/service_order-priority';
import { CustomerCategory } from '../../customers/enums/customer-category.enum';

/**
 * Contexto para cálculo de preço
 */
export interface PricingContext {
  order_type: OrderType;
  total_weight?: number;
  total_volume?: number;
  package_count?: number;
  distance_km?: number;
  priority?: OrderPriority;
  requires_insurance?: boolean;
  insurance_value?: number;
  customer_category?: CustomerCategory;
}

/**
 * Resultado do cálculo de preço
 */
export interface PricingResult {
  base_price: number;
  weight_fee: number;
  volume_fee: number;
  distance_fee: number;
  priority_fee: number;
  insurance_fee: number;
  subtotal: number;
  discount: number;
  discount_percentage: number;
  total: number;
  breakdown: {
    description: string;
    amount: number;
  }[];
}

/**
 * Resultado da cotação
 */
export interface QuotationResult extends PricingResult {
  estimated_delivery_hours: number;
  suggested_vehicle?: string;
  sla_hours: number;
  valid_until: Date;
}

/**
 * Serviço de Precificação para Service Orders
 *
 * Responsável por calcular valores de serviço, aplicar descontos e taxas,
 * calcular seguro e gerar cotações
 */
@Injectable()
export class ServiceOrderPricingService {
  private readonly logger = new Logger(ServiceOrderPricingService.name);

  // Taxas base por tipo de serviço
  private readonly BASE_PRICES: Record<OrderType, number> = {
    [OrderType.PICKUP_DELIVERY]: 50.0,
    [OrderType.DELIVERY_ONLY]: 30.0,
    [OrderType.RETURN]: 40.0,
    [OrderType.TRANSFER]: 35.0,
  };

  // Taxas por peso (R$ por kg)
  private readonly WEIGHT_RATE = 0.5;

  // Taxas por volume (R$ por m³)
  private readonly VOLUME_RATE = 15.0;

  // Taxas por distância (R$ por km)
  private readonly DISTANCE_RATE = 1.5;

  // Taxas por prioridade (multiplicador)
  private readonly PRIORITY_MULTIPLIERS: Record<OrderPriority, number> = {
    LOW: 0.9,
    NORMAL: 1.0,
    HIGH: 1.3,
    URGENT: 1.5,
  };

  // Taxa de seguro (percentual sobre o valor segurado)
  private readonly INSURANCE_RATE = 0.02; // 2%

  // Descontos por categoria de cliente
  private readonly CUSTOMER_DISCOUNTS: Record<CustomerCategory, number> = {
    [CustomerCategory.STANDARD]: 0,
    [CustomerCategory.VIP]: 0.15, // 15% de desconto
    [CustomerCategory.PREMIUM]: 0.1, // 10% de desconto
  };

  // SLA mínimo por tipo de serviço (horas)
  private readonly MIN_SLA: Record<OrderType, number> = {
    [OrderType.PICKUP_DELIVERY]: 24,
    [OrderType.DELIVERY_ONLY]: 12,
    [OrderType.RETURN]: 24,
    [OrderType.TRANSFER]: 48,
  };

  /**
   * Calcula o preço do serviço
   */
  calculatePrice(context: PricingContext): PricingResult {
    this.logger.debug(`Calculando preço para tipo ${context.order_type}`);

    // Preço base
    const base_price = this.BASE_PRICES[context.order_type];

    // Taxa de peso
    const weight_fee = context.total_weight ? context.total_weight * this.WEIGHT_RATE : 0;

    // Taxa de volume
    const volume_fee = context.total_volume ? context.total_volume * this.VOLUME_RATE : 0;

    // Taxa de distância
    const distance_fee = context.distance_km ? context.distance_km * this.DISTANCE_RATE : 0;

    // Multiplicador de prioridade
    const priority_multiplier = context.priority
      ? this.PRIORITY_MULTIPLIERS[context.priority]
      : 1.0;

    // Subtotal antes da prioridade
    const subtotal_before_priority = base_price + weight_fee + volume_fee + distance_fee;

    // Taxa de prioridade
    const priority_fee = subtotal_before_priority * (priority_multiplier - 1);

    // Subtotal
    const subtotal = subtotal_before_priority + priority_fee;

    // Taxa de seguro
    const insurance_fee =
      context.requires_insurance && context.insurance_value
        ? context.insurance_value * this.INSURANCE_RATE
        : 0;

    // Desconto
    const discount_percentage = context.customer_category
      ? this.CUSTOMER_DISCOUNTS[context.customer_category]
      : 0;
    const discount = subtotal * discount_percentage;

    // Total
    const total = subtotal + insurance_fee - discount;

    // Breakdown detalhado
    const breakdown = [
      { description: 'Taxa base', amount: base_price },
      { description: 'Taxa de peso', amount: weight_fee },
      { description: 'Taxa de volume', amount: volume_fee },
      { description: 'Taxa de distância', amount: distance_fee },
      { description: 'Taxa de prioridade', amount: priority_fee },
      { description: 'Taxa de seguro', amount: insurance_fee },
      { description: 'Desconto', amount: -discount },
    ].filter(item => item.amount !== 0);

    return {
      base_price,
      weight_fee,
      volume_fee,
      distance_fee,
      priority_fee,
      insurance_fee,
      subtotal,
      discount,
      discount_percentage,
      total,
      breakdown,
    };
  }

  /**
   * Gera uma cotação completa
   */
  generateQuotation(context: PricingContext): QuotationResult {
    this.logger.debug(`Gerando cotação para tipo ${context.order_type}`);

    const pricing = this.calculatePrice(context);

    // Calcular SLA
    const sla_hours = this.calculateSLA(context);

    // Estimar tempo de entrega
    const estimated_delivery_hours = this.estimateDeliveryTime(context, sla_hours);

    // Sugerir veículo
    const suggested_vehicle = this.suggestVehicle(context);

    // Validade da cotação (7 dias)
    const valid_until = new Date();
    valid_until.setDate(valid_until.getDate() + 7);

    return {
      ...pricing,
      estimated_delivery_hours,
      suggested_vehicle,
      sla_hours,
      valid_until,
    };
  }

  /**
   * Calcula o SLA baseado no tipo de serviço e prioridade
   */
  calculateSLA(context: PricingContext): number {
    const baseSLA = this.MIN_SLA[context.order_type];

    // Ajustar SLA baseado na prioridade
    const priorityMultiplier = context.priority ? this.PRIORITY_MULTIPLIERS[context.priority] : 1.0;

    // Prioridade alta reduz o SLA
    const sla_hours = baseSLA / priorityMultiplier;

    return Math.max(sla_hours, 4); // Mínimo de 4 horas
  }

  /**
   * Estima o tempo de entrega em horas
   */
  estimateDeliveryTime(context: PricingContext, sla_hours: number): number {
    let estimated_hours = sla_hours;

    // Adicionar tempo baseado na distância
    if (context.distance_km) {
      estimated_hours += context.distance_km / 50; // 50km/h média
    }

    // Adicionar tempo baseado no volume
    if (context.total_volume) {
      estimated_hours += context.total_volume * 2; // 2 horas por m³
    }

    return Math.round(estimated_hours);
  }

  /**
   * Sugere o veículo adequado baseado na carga
   */
  suggestVehicle(context: PricingContext): string | undefined {
    if (!context.total_weight && !context.total_volume) {
      return undefined;
    }

    const weight = context.total_weight ?? 0;
    const volume = context.total_volume ?? 0;

    // Lógica simples de sugestão de veículo
    // TODO: Integrar com módulo de veículos para sugestão real

    if (weight <= 500 && volume <= 2) {
      return 'Moto';
    }

    if (weight <= 1000 && volume <= 5) {
      return 'Van Pequena';
    }

    if (weight <= 3000 && volume <= 15) {
      return 'Van Média';
    }

    if (weight <= 5000 && volume <= 25) {
      return 'Caminhão Leve';
    }

    if (weight <= 10000 && volume <= 50) {
      return 'Caminhão Médio';
    }

    return 'Caminhão Pesado';
  }

  /**
   * Calcula o valor do seguro
   */
  calculateInsurance(insurance_value: number): number {
    return insurance_value * this.INSURANCE_RATE;
  }

  /**
   * Aplica desconto baseado na categoria do cliente
   */
  applyCustomerDiscount(amount: number, customer_category: CustomerCategory): number {
    const discount_percentage = this.CUSTOMER_DISCOUNTS[customer_category] ?? 0;
    return amount * (1 - discount_percentage);
  }

  /**
   * Calcula o valor mínimo para aprovação automática
   */
  getAutoApprovalThreshold(customer_category?: string): number {
    if (customer_category === 'VIP') {
      return 10000; // VIP: até R$ 10.000
    }
    if (customer_category === 'PREMIUM') {
      return 5000; // Premium: até R$ 5.000
    }
    return 500; // Standard: até R$ 500
  }

  /**
   * Verifica se o valor está dentro do limite para aprovação automática
   */
  isWithinAutoApprovalLimit(amount: number, customer_category?: string): boolean {
    const threshold = this.getAutoApprovalThreshold(customer_category);
    return amount <= threshold;
  }

  /**
   * Calcula o número estimado de entregas necessárias
   */
  estimateNumberOfDeliveries(context: PricingContext): number {
    // Se volume for pequeno, 1 entrega
    if (!context.total_volume || context.total_volume <= 5) {
      return 1;
    }

    // Se volume for médio, 2-3 entregas
    if (context.total_volume <= 15) {
      return Math.ceil(context.total_volume / 5);
    }

    // Se volume for grande, calcular baseado em capacidade
    return Math.ceil(context.total_volume / 10);
  }

  /**
   * Formata o breakdown para exibição
   */
  formatBreakdown(breakdown: { description: string; amount: number }[]): string {
    return breakdown
      .map(item => {
        const sign = item.amount >= 0 ? '+' : '-';
        return `${item.description}: ${sign} R$ ${Math.abs(item.amount).toFixed(2)}`;
      })
      .join('\n');
  }
}
