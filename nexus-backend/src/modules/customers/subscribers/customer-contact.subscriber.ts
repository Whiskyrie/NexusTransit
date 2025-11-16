import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { Logger } from '@nestjs/common';
import { CustomerContact } from '../entities/customer-contact.entity';
import { ContactType } from '../enums/contact-type.enum';

/**
 * Subscriber para auditoria de operações com CustomerContact
 *
 * Monitora mudanças em contatos de clientes
 * Valida regras específicas para contatos
 *
 * @class CustomerContactSubscriber
 */
@EventSubscriber()
export class CustomerContactSubscriber implements EntitySubscriberInterface<CustomerContact> {
  private readonly logger = new Logger(CustomerContactSubscriber.name);

  /**
   * Define qual entidade este subscriber monitora
   */
  listenTo(): typeof CustomerContact {
    return CustomerContact;
  }

  /**
   * Antes de inserir um novo contato
   */
  beforeInsert(event: InsertEvent<CustomerContact>): void {
    const entity = event.entity;

    this.logger.debug(
      `Before insert contact: ${JSON.stringify({
        customerId: entity.customerId,
        type: entity.type,
        value: entity.value,
      })}`,
    );

    // Validações de negócio
    this.validateContactData(entity);

    // Normalização de dados
    this.normalizeContactData(entity);
  }

  /**
   * Após inserir um novo contato
   */
  afterInsert(event: InsertEvent<CustomerContact>): void {
    const entity = event.entity;

    this.logger.log(`Contact created: ${entity.id} for customer: ${entity.customerId}`);

    // Log de negócio específico
    if (entity.type === ContactType.PHONE) {
      this.logger.log(`Phone contact added for customer: ${entity.customerId}`);
    }

    if (entity.type === ContactType.EMAIL) {
      this.logger.log(`Email contact added for customer: ${entity.customerId}`);
    }
  }

  /**
   * Antes de atualizar um contato
   */
  beforeUpdate(event: UpdateEvent<CustomerContact>): void {
    const entity = event.entity as CustomerContact;
    const databaseEntity = event.databaseEntity;

    if (!entity || !databaseEntity) {
      return;
    }

    this.logger.debug(`Before update contact: ${entity.id}`);

    // Monitorar mudanças críticas
    this.monitorCriticalChanges(entity, databaseEntity);
  }

  /**
   * Após atualizar um contato
   */
  afterUpdate(event: UpdateEvent<CustomerContact>): void {
    const entity = event.entity as CustomerContact;
    const databaseEntity = event.databaseEntity;

    if (!entity || !databaseEntity) {
      return;
    }

    this.logger.log(`Contact updated: ${entity.id}`);

    // Log de mudança de tipo
    if (entity.type !== databaseEntity.type) {
      this.logger.log(
        `Contact type changed: ${databaseEntity.type} → ${entity.type} (${entity.id})`,
      );
    }

    // Log de mudança de valor
    if (entity.value !== databaseEntity.value) {
      this.logger.warn(
        `Contact value changed: ${databaseEntity.value} → ${entity.value} (${entity.id})`,
      );
    }
  }

  /**
   * Antes de remover (soft delete) um contato
   */
  beforeSoftRemove(event: SoftRemoveEvent<CustomerContact>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    this.logger.debug(`Before soft remove contact: ${entity.id}`);

    // Verificar se contato pode ser removido
    this.validateContactRemoval(entity);
  }

  /**
   * Após remover (soft delete) um contato
   */
  afterSoftRemove(event: SoftRemoveEvent<CustomerContact>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    this.logger.log(`Contact soft removed: ${entity.id} for customer: ${entity.customerId}`);

    // Verificar se era contato principal
    if (entity.type === ContactType.PHONE) {
      this.logger.warn(
        `Phone contact removed for customer: ${entity.customerId} - action may be required`,
      );
    }
  }

  /**
   * Valida dados do contato
   */
  private validateContactData(contact: CustomerContact): void {
    // Validação de valor
    if (!contact.value || contact.value.trim().length === 0) {
      throw new Error('Contact value is required');
    }

    // Validação de cliente
    if (!contact.customerId) {
      throw new Error('Customer ID is required');
    }

    // Validação específica por tipo
    this.validateContactByType(contact);
  }

  /**
   * Valida contato baseado no tipo
   */
  private validateContactByType(contact: CustomerContact): void {
    switch (contact.type) {
      case ContactType.EMAIL:
        this.validateEmail(contact.value);
        break;

      case ContactType.PHONE:
      case ContactType.MOBILE:
      case ContactType.WHATSAPP:
        this.validatePhone(contact.value);
        break;

      default:
        this.logger.warn(`Unknown contact type: ${contact.type}`);
    }
  }

  /**
   * Valida email
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * Valida telefone
   */
  private validatePhone(phone: string): void {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      throw new Error('Phone number must have 10 or 11 digits');
    }
  }

  /**
   * Normaliza dados do contato
   */
  private normalizeContactData(contact: CustomerContact): void {
    // Normalizar valor baseado no tipo
    switch (contact.type) {
      case ContactType.EMAIL:
        contact.value = contact.value.toLowerCase().trim();
        break;

      case ContactType.PHONE:
      case ContactType.MOBILE:
      case ContactType.WHATSAPP:
        contact.value = contact.value.replace(/\D/g, '');
        break;
    }
  }

  /**
   * Monitora mudanças críticas no contato
   */
  private monitorCriticalChanges(
    updatedContact: CustomerContact,
    originalContact: CustomerContact,
  ): void {
    // Mudança de cliente é crítica
    if (updatedContact.customerId !== originalContact.customerId) {
      this.logger.warn(
        `CRITICAL: Contact customer changed: ${originalContact.customerId} → ${updatedContact.customerId} (${updatedContact.id})`,
      );
    }

    // Mudança de tipo é crítica
    if (updatedContact.type !== originalContact.type) {
      this.logger.warn(
        `Contact type changed: ${originalContact.type} → ${updatedContact.type} (${updatedContact.id})`,
      );
    }
  }

  /**
   * Valida se contato pode ser removido
   */
  private validateContactRemoval(contact: CustomerContact): void {
    // Não permitir remover telefone principal se houver outros contatos
    if (contact.type === ContactType.PHONE) {
      this.logger.warn(
        `Attempting to remove phone contact: ${contact.id} - ensure customer has alternative contact`,
      );
    }

    // Verificar se é email principal
    if (contact.type === ContactType.EMAIL) {
      this.logger.warn(
        `Attempting to remove email contact: ${contact.id} - ensure customer has alternative email`,
      );
    }
  }
}
