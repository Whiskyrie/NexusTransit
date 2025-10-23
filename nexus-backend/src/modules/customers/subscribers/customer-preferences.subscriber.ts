import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { Logger } from '@nestjs/common';
import { CustomerPreferences } from '../entities/customer-preferences.entity';
import { DeliveryPreference } from '../enums/delivery-preference.enum';

/**
 * Subscriber para auditoria de operações com CustomerPreferences
 *
 * Monitora mudanças nas preferências de clientes
 * Valida regras específicas para preferências de entrega e notificação
 *
 * @class CustomerPreferencesSubscriber
 */
@EventSubscriber()
export class CustomerPreferencesSubscriber
  implements EntitySubscriberInterface<CustomerPreferences>
{
  private readonly logger = new Logger(CustomerPreferencesSubscriber.name);

  /**
   * Define qual entidade este subscriber monitora
   */
  listenTo(): typeof CustomerPreferences {
    return CustomerPreferences;
  }

  /**
   * Antes de inserir novas preferências
   */
  beforeInsert(event: InsertEvent<CustomerPreferences>): void {
    const entity = event.entity;

    this.logger.debug(
      `Before insert preferences: ${JSON.stringify({
        customerId: entity.customerId,
        deliveryPreference: entity.deliveryPreference,
        notificationChannel: entity.preferredNotificationChannel,
      })}`,
    );

    // Validações de negócio
    this.validatePreferencesData(entity);

    // Normalização de dados
    this.normalizePreferencesData(entity);
  }

  /**
   * Após inserir novas preferências
   */
  afterInsert(event: InsertEvent<CustomerPreferences>): void {
    const entity = event.entity;

    this.logger.log(`Preferences created: ${entity.id} for customer: ${entity.customerId}`);

    // Log de preferências específicas
    if (entity.deliveryPreference === DeliveryPreference.EXPRESS) {
      this.logger.log(`Express delivery preference set for customer: ${entity.customerId}`);
    }

    if (entity.requireSignature) {
      this.logger.log(`Signature required for customer: ${entity.customerId}`);
    }

    if (entity.allowWeekendDelivery) {
      this.logger.log(`Weekend delivery enabled for customer: ${entity.customerId}`);
    }
  }

  /**
   * Antes de atualizar preferências
   */
  beforeUpdate(event: UpdateEvent<CustomerPreferences>): void {
    const entity = event.entity as CustomerPreferences;
    const databaseEntity = event.databaseEntity;

    if (!entity || !databaseEntity) {
      return;
    }

    this.logger.debug(`Before update preferences: ${entity.id}`);

    // Monitorar mudanças críticas
    this.monitorCriticalChanges(entity, databaseEntity);
  }

  /**
   * Após atualizar preferências
   */
  afterUpdate(event: UpdateEvent<CustomerPreferences>): void {
    const entity = event.entity as CustomerPreferences;
    const databaseEntity = event.databaseEntity;

    if (!entity || !databaseEntity) {
      return;
    }

    this.logger.log(`Preferences updated: ${entity.id}`);

    // Log de mudança de preferência de entrega
    if (entity.deliveryPreference !== databaseEntity.deliveryPreference) {
      this.logger.log(
        `Delivery preference changed: ${databaseEntity.deliveryPreference} → ${entity.deliveryPreference} (${entity.id})`,
      );
    }

    // Log de mudança de canal de notificação
    if (entity.preferredNotificationChannel !== databaseEntity.preferredNotificationChannel) {
      this.logger.log(
        `Notification channel changed: ${databaseEntity.preferredNotificationChannel} → ${entity.preferredNotificationChannel} (${entity.id})`,
      );
    }

    // Log de mudança de assinatura obrigatória
    if (entity.requireSignature !== databaseEntity.requireSignature) {
      this.logger.log(
        `Signature requirement changed: ${databaseEntity.requireSignature} → ${entity.requireSignature} (${entity.id})`,
      );
    }

    // Log de mudança de entrega em fim de semana
    if (entity.allowWeekendDelivery !== databaseEntity.allowWeekendDelivery) {
      this.logger.log(
        `Weekend delivery changed: ${databaseEntity.allowWeekendDelivery} → ${entity.allowWeekendDelivery} (${entity.id})`,
      );
    }
  }

  /**
   * Antes de remover (soft delete) preferências
   */
  beforeSoftRemove(event: SoftRemoveEvent<CustomerPreferences>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    this.logger.debug(`Before soft remove preferences: ${entity.id}`);
  }

  /**
   * Após remover (soft delete) preferências
   */
  afterSoftRemove(event: SoftRemoveEvent<CustomerPreferences>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    this.logger.log(`Preferences soft removed: ${entity.id} for customer: ${entity.customerId}`);
  }

  /**
   * Valida dados das preferências
   */
  private validatePreferencesData(preferences: CustomerPreferences): void {
    // Validação de cliente
    if (!preferences.customerId) {
      throw new Error('Customer ID is required');
    }

    // Validação de janelas de tempo
    if (preferences.deliveryTimeWindows && preferences.deliveryTimeWindows.length > 0) {
      this.validateTimeWindows(preferences.deliveryTimeWindows);
    }

    // Validação de itens restritos
    if (preferences.restrictedItems && preferences.restrictedItems.length > 0) {
      this.validateRestrictedItems(preferences.restrictedItems);
    }
  }

  /**
   * Normaliza dados das preferências
   */
  private normalizePreferencesData(preferences: CustomerPreferences): void {
    // Validar que arrays tenham conteúdo válido
    if (preferences.deliveryTimeWindows) {
      preferences.deliveryTimeWindows = preferences.deliveryTimeWindows.filter(
        w => w && w.trim().length > 0,
      );
    }

    if (preferences.restrictedItems) {
      preferences.restrictedItems = preferences.restrictedItems.filter(
        i => i && i.trim().length > 0,
      );
    }

    if (preferences.specialInstructions) {
      preferences.specialInstructions = preferences.specialInstructions.filter(
        s => s && s.trim().length > 0,
      );
    }
  }

  /**
   * Valida janelas de tempo
   */
  private validateTimeWindows(timeWindows: string[]): void {
    // Validar formato de cada janela de tempo
    const timeWindowRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    for (const window of timeWindows) {
      if (!timeWindowRegex.test(window)) {
        throw new Error(`Invalid time window format: ${window}. Expected format: HH:MM-HH:MM`);
      }
    }
  }

  /**
   * Valida itens restritos
   */
  private validateRestrictedItems(items: string[]): void {
    // Validar que itens não sejam vazios
    for (const item of items) {
      if (!item || item.trim().length === 0) {
        throw new Error('Restricted items cannot be empty');
      }
    }
  }

  /**
   * Monitora mudanças críticas nas preferências
   */
  private monitorCriticalChanges(
    updatedPreferences: CustomerPreferences,
    originalPreferences: CustomerPreferences,
  ): void {
    // Mudança de preferência de entrega para EXPRESS é crítica
    if (
      updatedPreferences.deliveryPreference === DeliveryPreference.EXPRESS &&
      originalPreferences.deliveryPreference !== DeliveryPreference.EXPRESS
    ) {
      this.logger.warn(`Customer upgraded to EXPRESS delivery: ${updatedPreferences.customerId}`);
    }

    // Mudança de cliente é crítica
    if (updatedPreferences.customerId !== originalPreferences.customerId) {
      this.logger.warn(
        `CRITICAL: Preferences customer changed: ${originalPreferences.customerId} → ${updatedPreferences.customerId} (${updatedPreferences.id})`,
      );
    }

    // Mudança de canal de notificação
    if (
      updatedPreferences.preferredNotificationChannel !==
      originalPreferences.preferredNotificationChannel
    ) {
      this.logger.log(
        `Notification channel updated: ${originalPreferences.preferredNotificationChannel} → ${updatedPreferences.preferredNotificationChannel} (${updatedPreferences.customerId})`,
      );
    }
  }
}
