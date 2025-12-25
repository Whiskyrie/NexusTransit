import type { DeliveryPriority } from '../../deliveries/enums/delivery-priority.enum';

/**
 * Interface para dados de endereço formatados para entrega
 */
export interface DeliveryAddressData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Interface para dados de contato
 */
export interface DeliveryContactData {
  name: string;
  phone: string;
  email?: string;
}

/**
 * Interface completa para criação de Delivery a partir de ServiceOrder
 */
export interface DeliveryCreationData {
  customer_id: string;
  description: string;
  weight: number;
  declared_value: number;
  priority?: DeliveryPriority;
  pickup_address: DeliveryAddressData;
  delivery_address: DeliveryAddressData;
  pickup_contact: DeliveryContactData;
  delivery_contact: DeliveryContactData;
  scheduled_pickup_at: Date;
  scheduled_delivery_at: Date;
  notes?: string;
  service_order_id?: string;
}

/**
 * Interface para mapeamento direto de ServiceOrder para Delivery
 */
export interface ServiceOrderToDeliveryMapping {
  /** ID do cliente vinculado à ordem */
  customer_id: string;

  /** Tipo de serviço da OS (PICKUP, DELIVERY, MAINTENANCE, etc.) */
  service_type: string;

  /** Descrição do produto/entrega */
  description: string;

  /** Peso estimado para cálculo */
  estimated_weight?: number;

  /** Valor declarado para seguro */
  declared_value?: number;

  /** Prioridade herdada da OS */
  priority?: DeliveryPriority;

  /** Endereço de coleta (opcional, usa localização da OS se não fornecido) */
  pickup_address?: DeliveryAddressData;

  /** Endereço de entrega */
  delivery_address?: DeliveryAddressData;

  /** Data agendada para coleta */
  scheduled_pickup_at?: Date;

  /** Data agendada para entrega */
  scheduled_delivery_at?: Date;

  /** Observações adicionais */
  notes?: string;

  /** ID da ordem de serviço de origem */
  service_order_id: string;
}

/**
 * Resultado da geração de entrega
 */
export interface DeliveryGenerationResult {
  success: boolean;
  delivery_id?: string;
  tracking_code?: string;
  error_message?: string;
  warnings?: string[];
}
