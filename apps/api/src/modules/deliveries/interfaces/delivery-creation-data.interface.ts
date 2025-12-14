import type { BrazilianAddress } from './address.interface';

/**
 * Interface para dados de criação de entrega
 * Usado pelo serviço de validação
 */
export interface DeliveryCreationData {
  weight: number;
  driverId?: string;
  vehicleId?: string;
  pickup_address: BrazilianAddress;
  delivery_address: BrazilianAddress;
  scheduled_delivery_at: Date;
}
