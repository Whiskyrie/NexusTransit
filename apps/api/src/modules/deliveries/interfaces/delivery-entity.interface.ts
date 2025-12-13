import type { DeliveryPriority } from '../enums/delivery-priority.enum';
import type { DeliveryStatus } from '../enums/delivery-status.enum';
import type { AddressDto } from '../dto/address.dto';
import type { ContactDto } from '../dto/contact.dto';
import type { DimensionsDto } from '../dto/dimensions.dto';
import type { ProductInfoDto } from '../dto/product-info.dto';

/**
 * Interface principal da entidade Delivery
 */
export interface DeliveryEntity {
  id: string;
  customer_id: string;
  driver_id?: string;
  vehicle_id?: string;
  priority: DeliveryPriority;
  status: DeliveryStatus;
  description: string;
  weight: number;
  declared_value: number;
  dimensions?: DimensionsDto;
  product_info?: ProductInfoDto;
  pickup_address: AddressDto;
  delivery_address: AddressDto;
  sender_contact?: ContactDto;
  recipient_contact?: ContactDto;
  scheduled_pickup_at: Date;
  scheduled_delivery_at: Date;
  pickup_instructions?: string;
  delivery_instructions?: string;
  notes?: string;
  product_photos?: string[];
  items_list?: string[];
  settings?: DeliverySettings;
  payment_info?: PaymentInfo;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface para configurações especiais da entrega
 */
export interface DeliverySettings {
  requires_signature?: boolean;
  requires_photo?: boolean;
  requires_id?: boolean;
  allowed_attempt_count?: number;
  restricted_hours?: TimeRestriction[];
}

/**
 * Interface para restrições de tempo
 */
export interface TimeRestriction {
  start: string;
  end: string;
}

/**
 * Interface para informações de pagamento
 */
export interface PaymentInfo {
  method?: 'CASH' | 'CARD' | 'TRANSFER' | 'INVOICE';
  amount?: number;
}

/**
 * Interface para estatísticas da entrega
 */
export interface DeliveryStats {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  pending_deliveries: number;
  average_delivery_time: number;
  success_rate: number;
}
