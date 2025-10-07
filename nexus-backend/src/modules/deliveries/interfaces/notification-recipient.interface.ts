/**
 * Interface para destinatário de notificação
 */
export interface NotificationRecipient {
  id: string;
  email?: string | undefined;
  phone?: string | undefined;
  name: string;
}

/**
 * Interface para opções de notificação
 */
export interface NotificationOptions {
  sendEmail?: boolean;
  sendSms?: boolean;
  sendPush?: boolean;
  immediate?: boolean;
  scheduledFor?: Date | undefined;
}
