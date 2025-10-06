import type { DeliveryStatus } from '../enums/delivery-status.enum';

/**
 * Tipos de notificação
 */
export enum NotificationType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  DELIVERY_CREATED = 'DELIVERY_CREATED',
  DELIVERY_ASSIGNED = 'DELIVERY_ASSIGNED',
  DELIVERY_COMPLETED = 'DELIVERY_COMPLETED',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  DELIVERY_CANCELLED = 'DELIVERY_CANCELLED',
}

/**
 * Interface para notificação de entrega
 */
export interface DeliveryNotification {
  type: NotificationType;
  deliveryId: string;
  trackingCode: string;
  customerId?: string;
  driverId?: string | undefined;
  status: DeliveryStatus;
  previousStatus?: DeliveryStatus;
  message: string;
  timestamp: Date;
}
