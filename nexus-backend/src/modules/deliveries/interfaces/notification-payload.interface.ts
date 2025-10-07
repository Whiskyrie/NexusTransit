import type { NotificationType } from './notification.interface';

/**
 * Interface para payload de notificação
 */
export interface NotificationPayload {
  type: NotificationType;
  deliveryId?: string;
  userId?: string;
  customerId?: string;
  driverId?: string;
  metadata?: Record<string, unknown>;
}
