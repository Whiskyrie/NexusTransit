import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { Logger, Injectable } from '@nestjs/common';
import { Delivery } from '../entities/delivery.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { NotificationType, type DeliveryNotification } from '../interfaces/notification.interface';

/**
 * Subscriber para disparar notificações automáticas
 *
 * Dispara notificações em eventos importantes:
 * - Criação de entrega
 * - Mudança de status
 * - Atribuição a motorista
 * - Conclusão ou falha
 *
 * As notificações são enviadas para uma fila assíncrona para processamento
 */
@Injectable()
@EventSubscriber()
export class NotificationSubscriber implements EntitySubscriberInterface<Delivery> {
  private readonly logger = new Logger(NotificationSubscriber.name);

  /**
   * Indica que este subscriber é apenas para a entidade Delivery
   */
  listenTo(): typeof Delivery {
    return Delivery;
  }

  /**
   * Called after entity insertion.
   * Dispara notificação de criação de entrega
   */
  afterInsert(event: InsertEvent<Delivery>): void {
    try {
      const entity = event.entity;

      if (!entity) {
        return;
      }

      const notification: DeliveryNotification = {
        type: NotificationType.DELIVERY_CREATED,
        deliveryId: entity.id,
        trackingCode: entity.tracking_code,
        customerId: entity.customer_id,
        status: entity.status,
        message: `Nova entrega criada: ${entity.tracking_code}`,
        timestamp: new Date(),
      };

      this.sendNotification(notification);
    } catch (error) {
      this.logger.error('Erro ao enviar notificação de criação:', error);
    }
  }

  /**
   * Called after entity update.
   * Dispara notificações baseadas em mudanças
   */
  afterUpdate(event: UpdateEvent<Delivery>): void {
    try {
      const entity = event.entity as Delivery;
      const databaseEntity = event.databaseEntity as Delivery | undefined;

      if (!entity || !databaseEntity) {
        return;
      }

      // Detecta mudança de status
      if (entity.status !== databaseEntity.status) {
        this.handleStatusChange(entity, databaseEntity.status);
      }

      // Detecta atribuição a motorista
      if (entity.driver_id && entity.driver_id !== databaseEntity.driver_id) {
        this.handleDriverAssignment(entity);
      }
    } catch (error) {
      this.logger.error('Erro ao enviar notificação de atualização:', error);
    }
  }

  /**
   * Trata mudanças de status e envia notificações apropriadas
   */
  private handleStatusChange(entity: Delivery, previousStatus: DeliveryStatus): void {
    let notificationType: NotificationType;
    let message: string;

    switch (entity.status) {
      case DeliveryStatus.DELIVERED:
        notificationType = NotificationType.DELIVERY_COMPLETED;
        message = `Entrega ${entity.tracking_code} concluída com sucesso`;
        break;

      case DeliveryStatus.FAILED:
        notificationType = NotificationType.DELIVERY_FAILED;
        message = `Falha na entrega ${entity.tracking_code}`;
        break;

      case DeliveryStatus.CANCELLED:
        notificationType = NotificationType.DELIVERY_CANCELLED;
        message = `Entrega ${entity.tracking_code} cancelada`;
        break;

      default:
        notificationType = NotificationType.STATUS_CHANGE;
        message = `Status da entrega ${entity.tracking_code} alterado para ${entity.status}`;
    }

    const notification: DeliveryNotification = {
      type: notificationType,
      deliveryId: entity.id,
      trackingCode: entity.tracking_code,
      customerId: entity.customer_id,
      driverId: entity.driver_id ?? undefined,
      status: entity.status,
      previousStatus,
      message,
      timestamp: new Date(),
    };

    this.sendNotification(notification);
  }

  /**
   * Trata atribuição a motorista
   */
  private handleDriverAssignment(entity: Delivery): void {
    const notification: DeliveryNotification = {
      type: NotificationType.DELIVERY_ASSIGNED,
      deliveryId: entity.id,
      trackingCode: entity.tracking_code,
      customerId: entity.customer_id,
      driverId: entity.driver_id ?? undefined,
      status: entity.status,
      message: `Entrega ${entity.tracking_code} atribuída ao motorista`,
      timestamp: new Date(),
    };

    this.sendNotification(notification);
  }

  /**
   * Envia notificação (placeholder - será implementado com queue)
   * TODO: Integrar com sistema de filas (Bull, RabbitMQ, etc)
   */
  private sendNotification(notification: DeliveryNotification): void {
    // Log da notificação (será substituído por queue)
    this.logger.debug(
      `[NOTIFICAÇÃO] ${notification.type}: ${notification.message} (Entrega: ${notification.trackingCode})`,
    );

    // TODO: Adicionar à fila de notificações
    // await this.notificationQueue.add('send-notification', notification);

    // TODO: Implementar diferentes canais de notificação:
    // - Email
    // - SMS
    // - Push notification
    // - Webhook
  }
}
