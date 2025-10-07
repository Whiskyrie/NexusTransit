import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../entities/delivery.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { NotificationType, type DeliveryNotification } from '../interfaces/notification.interface';
import type { NotificationOptions } from '../interfaces/notification-recipient.interface';

/**
 * Serviço de notificações de entregas
 *
 * Responsabilidades:
 * - Enviar notificações de mudança de status
 * - Notificar clientes e motoristas
 * - Agendar notificações futuras
 * - Gerenciar templates de notificação
 *
 * @class DeliveryNotificationService
 */
@Injectable()
export class DeliveryNotificationService {
  private readonly logger = new Logger(DeliveryNotificationService.name);

  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
  ) {}

  /**
   * Notifica sobre mudança de status de entrega
   *
   * @param deliveryId - ID da entrega
   * @param oldStatus - Status anterior
   * @param newStatus - Novo status
   * @param options - Opções de notificação
   *
   * @example
   * ```typescript
   * await service.notifyStatusChange(
   *   'delivery-123',
   *   DeliveryStatus.PENDING,
   *   DeliveryStatus.IN_TRANSIT,
   *   { sendEmail: true, sendSms: true }
   * );
   * ```
   */
  async notifyStatusChange(
    deliveryId: string,
    oldStatus: DeliveryStatus,
    newStatus: DeliveryStatus,
    options: NotificationOptions = {},
  ): Promise<void> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
      relations: ['customer', 'driver'],
    });

    if (!delivery) {
      this.logger.warn(`Entrega ${deliveryId} não encontrada para notificação`);
      return;
    }

    const notification: DeliveryNotification = {
      type: NotificationType.STATUS_CHANGE,
      deliveryId: delivery.id,
      trackingCode: delivery.tracking_code,
      status: newStatus,
      previousStatus: oldStatus,
      message: this.getStatusChangeMessage(oldStatus, newStatus),
      timestamp: new Date(),
      ...(delivery.customer_id && { customerId: delivery.customer_id }),
      ...(delivery.driver_id && { driverId: delivery.driver_id }),
    };

    this.sendNotification(notification, options);
  }

  /**
   * Notifica o cliente sobre um evento de entrega
   *
   * @param deliveryId - ID da entrega
   * @param type - Tipo de notificação
   * @param message - Mensagem personalizada (opcional)
   * @param options - Opções de notificação
   *
   * @example
   * ```typescript
   * await service.notifyCustomer(
   *   'delivery-123',
   *   NotificationType.DELIVERY_COMPLETED,
   *   'Sua entrega foi concluída com sucesso!',
   *   { sendEmail: true }
   * );
   * ```
   */
  async notifyCustomer(
    deliveryId: string,
    type: NotificationType,
    message?: string,
    options: NotificationOptions = {},
  ): Promise<void> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
      relations: ['customer'],
    });

    if (!delivery) {
      this.logger.warn(`Entrega ${deliveryId} não encontrada para notificação ao cliente`);
      return;
    }

    const notification: DeliveryNotification = {
      type,
      deliveryId: delivery.id,
      trackingCode: delivery.tracking_code,
      customerId: delivery.customer_id ?? undefined,
      status: delivery.status,
      message: message ?? this.getDefaultMessage(type),
      timestamp: new Date(),
    };

    this.sendNotification(notification, {
      ...options,
      sendEmail: options.sendEmail ?? true,
    });
  }

  /**
   * Notifica o motorista sobre um evento de entrega
   *
   * @param deliveryId - ID da entrega
   * @param type - Tipo de notificação
   * @param message - Mensagem personalizada (opcional)
   * @param options - Opções de notificação
   *
   * @example
   * ```typescript
   * await service.notifyDriver(
   *   'delivery-123',
   *   NotificationType.DELIVERY_ASSIGNED,
   *   'Nova entrega atribuída a você',
   *   { sendPush: true }
   * );
   * ```
   */
  async notifyDriver(
    deliveryId: string,
    type: NotificationType,
    message?: string,
    options: NotificationOptions = {},
  ): Promise<void> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
      relations: ['driver'],
    });

    if (!delivery?.driver_id) {
      this.logger.warn(`Entrega ${deliveryId} não encontrada ou sem motorista para notificação`);
      return;
    }

    const notification: DeliveryNotification = {
      type,
      deliveryId: delivery.id,
      trackingCode: delivery.tracking_code,
      driverId: delivery.driver_id,
      status: delivery.status,
      message: message ?? this.getDefaultMessage(type),
      timestamp: new Date(),
    };

    this.sendNotification(notification, {
      ...options,
      sendPush: options.sendPush ?? true,
    });
  }

  /**
   * Agenda uma notificação para ser enviada em uma data futura
   *
   * @param deliveryId - ID da entrega
   * @param type - Tipo de notificação
   * @param scheduledFor - Data e hora para envio
   * @param recipient - Destinatário (customer ou driver)
   * @param message - Mensagem opcional
   *
   * @example
   * ```typescript
   * const tomorrow = new Date();
   * tomorrow.setDate(tomorrow.getDate() + 1);
   *
   * await service.scheduleNotification(
   *   'delivery-123',
   *   NotificationType.DELIVERY_SCHEDULED,
   *   tomorrow,
   *   'customer',
   *   'Sua entrega está agendada para amanhã'
   * );
   * ```
   */
  async scheduleNotification(
    deliveryId: string,
    type: NotificationType,
    scheduledFor: Date,
    recipient: 'customer' | 'driver',
    message?: string,
  ): Promise<void> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
    });

    if (!delivery) {
      this.logger.warn(`Entrega ${deliveryId} não encontrada para agendamento de notificação`);
      return;
    }

    const notification: DeliveryNotification = {
      type,
      deliveryId: delivery.id,
      trackingCode: delivery.tracking_code,
      status: delivery.status,
      message: message ?? this.getDefaultMessage(type),
      timestamp: new Date(),
      ...(recipient === 'customer' && delivery.customer_id && { customerId: delivery.customer_id }),
      ...(recipient === 'driver' && delivery.driver_id && { driverId: delivery.driver_id }),
    };

    // TODO: Implementar lógica de agendamento (ex: usar queue com delay)
    this.logger.log(
      `Notificação agendada para ${scheduledFor.toISOString()}: ${JSON.stringify(notification)}`,
    );
  }

  /**
   * Envia uma notificação através dos canais configurados
   *
   * @param notification - Dados da notificação
   * @param options - Opções de envio
   * @private
   */
  private sendNotification(notification: DeliveryNotification, options: NotificationOptions): void {
    if (options.immediate === false && options.scheduledFor) {
      // TODO: Agendar para envio futuro
      this.logger.log(`Notificação agendada para ${options.scheduledFor.toISOString()}`);
      return;
    }

    // TODO: Integrar com serviços de email/SMS/push
    if (options.sendEmail) {
      this.logger.log(`Enviando email: ${notification.message}`);
    }

    if (options.sendSms) {
      this.logger.log(`Enviando SMS: ${notification.message}`);
    }

    if (options.sendPush) {
      this.logger.log(`Enviando push notification: ${notification.message}`);
    }

    this.logger.log(`Notificação enviada: ${JSON.stringify(notification)}`);
  }

  /**
   * Obtém mensagem padrão para mudança de status
   *
   * @param oldStatus - Status anterior
   * @param newStatus - Novo status
   * @returns Mensagem de notificação
   * @private
   */
  private getStatusChangeMessage(oldStatus: DeliveryStatus, newStatus: DeliveryStatus): string {
    const messages: Partial<Record<DeliveryStatus, string>> = {
      [DeliveryStatus.PENDING]: 'Sua entrega foi criada e está aguardando processamento',
      [DeliveryStatus.ASSIGNED]: 'Um motorista foi atribuído à sua entrega',
      [DeliveryStatus.PICKED_UP]: 'Sua entrega foi coletada',
      [DeliveryStatus.IN_TRANSIT]: 'Sua entrega está a caminho',
      [DeliveryStatus.OUT_FOR_DELIVERY]: 'Sua entrega está saindo para entrega',
      [DeliveryStatus.DELIVERED]: 'Sua entrega foi concluída com sucesso',
      [DeliveryStatus.FAILED]: 'Houve um problema com sua entrega',
      [DeliveryStatus.CANCELLED]: 'Sua entrega foi cancelada',
    };

    return messages[newStatus] ?? `Status alterado de ${oldStatus} para ${newStatus}`;
  }

  /**
   * Obtém mensagem padrão para tipo de notificação
   *
   * @param type - Tipo de notificação
   * @returns Mensagem padrão
   * @private
   */
  private getDefaultMessage(type: NotificationType): string {
    const messages: Record<NotificationType, string> = {
      [NotificationType.STATUS_CHANGE]: 'O status da sua entrega foi alterado',
      [NotificationType.DELIVERY_CREATED]: 'Sua entrega foi criada com sucesso',
      [NotificationType.DELIVERY_ASSIGNED]: 'Sua entrega foi atribuída a um motorista',
      [NotificationType.DELIVERY_COMPLETED]: 'Sua entrega foi concluída',
      [NotificationType.DELIVERY_FAILED]: 'Houve um problema com sua entrega',
      [NotificationType.DELIVERY_CANCELLED]: 'Sua entrega foi cancelada',
      [NotificationType.ASSIGNMENT]: '',
    };

    return messages[type] ?? 'Notificação de entrega';
  }
}
