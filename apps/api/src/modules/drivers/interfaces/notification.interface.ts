import type { DriverStatus } from '../enums/driver-status.enum';

/**
 * Tipos de notificação para motoristas
 */
export enum DriverNotificationType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  CNH_EXPIRATION = 'CNH_EXPIRATION',
  CNH_EXPIRED = 'CNH_EXPIRED',
  CNH_RENEWED = 'CNH_RENEWED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  DOCUMENT_ACTIVATED = 'DOCUMENT_ACTIVATED',
  DOCUMENT_DEACTIVATED = 'DOCUMENT_DEACTIVATED',
  DELIVERY_ASSIGNED = 'DELIVERY_ASSIGNED',
  ROUTE_ASSIGNED = 'ROUTE_ASSIGNED',
  DRIVER_BLOCKED = 'DRIVER_BLOCKED',
  DRIVER_UNBLOCKED = 'DRIVER_UNBLOCKED',
}

/**
 * Interface para notificação de motorista
 */
export interface DriverNotification {
  type: DriverNotificationType;
  driverId: string;
  driverName?: string;
  status?: DriverStatus;
  previousStatus?: DriverStatus;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Interface para notificação de CNH
 */
export interface CNHNotification extends DriverNotification {
  type:
    | DriverNotificationType.CNH_EXPIRATION
    | DriverNotificationType.CNH_EXPIRED
    | DriverNotificationType.CNH_RENEWED;
  licenseNumber: string;
  expirationDate: Date;
  daysToExpiration?: number;
  category?: string;
}

/**
 * Interface para notificação de documento
 */
export interface DocumentNotification extends DriverNotification {
  type:
    | DriverNotificationType.DOCUMENT_UPLOADED
    | DriverNotificationType.DOCUMENT_APPROVED
    | DriverNotificationType.DOCUMENT_REJECTED
    | DriverNotificationType.DOCUMENT_ACTIVATED
    | DriverNotificationType.DOCUMENT_DEACTIVATED;
  documentId: string;
  documentType: string;
  documentName?: string;
  rejectionReason?: string;
}

/**
 * Interface para recipiente de notificação
 */
export interface NotificationRecipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferredChannel?: 'email' | 'sms' | 'push' | 'whatsapp';
}

/**
 * Interface para payload de notificação
 */
export interface NotificationPayload {
  recipients: NotificationRecipient[];
  notification: DriverNotification | CNHNotification | DocumentNotification;
  channels?: ('email' | 'sms' | 'push' | 'whatsapp')[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  sendAt?: Date;
}
