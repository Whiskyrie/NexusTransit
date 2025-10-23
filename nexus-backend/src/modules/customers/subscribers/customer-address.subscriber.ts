import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { Logger } from '@nestjs/common';
import { CustomerAddress } from '../entities/customer-address.entity';
import { AddressType } from '../enums/address-type.enum';

/**
 * Subscriber para auditoria de operações com CustomerAddress
 *
 * Monitora mudanças em endereços de clientes
 * Valida regras específicas para endereços
 *
 * @class CustomerAddressSubscriber
 */
@EventSubscriber()
export class CustomerAddressSubscriber implements EntitySubscriberInterface<CustomerAddress> {
  private readonly logger = new Logger(CustomerAddressSubscriber.name);

  /**
   * Define qual entidade este subscriber monitora
   */
  listenTo(): typeof CustomerAddress {
    return CustomerAddress;
  }

  /**
   * Antes de inserir um novo endereço
   */
  beforeInsert(event: InsertEvent<CustomerAddress>): void {
    const entity = event.entity;

    this.logger.debug(
      `Before insert address: ${JSON.stringify({
        customerId: entity.customerId,
        type: entity.type,
        city: entity.city,
        state: entity.state,
      })}`,
    );

    // Validações de negócio
    this.validateAddressData(entity);

    // Normalização de dados
    this.normalizeAddressData(entity);
  }

  /**
   * Após inserir um novo endereço
   */
  afterInsert(event: InsertEvent<CustomerAddress>): void {
    const entity = event.entity;

    this.logger.log(`Address created: ${entity.id} for customer: ${entity.customerId}`);

    // Log de negócio específico
    if (entity.type === AddressType.BILLING) {
      this.logger.log(`Billing address set for customer: ${entity.customerId}`);
    }

    if (entity.isPrimary) {
      this.logger.log(`Primary address updated for customer: ${entity.customerId}`);
    }
  }

  /**
   * Antes de atualizar um endereço
   */
  beforeUpdate(event: UpdateEvent<CustomerAddress>): void {
    const entity = event.entity as CustomerAddress;
    const databaseEntity = event.databaseEntity;

    if (!entity || !databaseEntity) {
      return;
    }

    this.logger.debug(`Before update address: ${entity.id}`);

    // Monitorar mudanças críticas
    this.monitorCriticalChanges(entity, databaseEntity);
  }

  /**
   * Após atualizar um endereço
   */
  afterUpdate(event: UpdateEvent<CustomerAddress>): void {
    const entity = event.entity as CustomerAddress;
    const databaseEntity = event.databaseEntity;

    if (!entity || !databaseEntity) {
      return;
    }

    this.logger.log(`Address updated: ${entity.id}`);

    // Log de mudança de endereço principal
    if (entity.isPrimary !== databaseEntity.isPrimary && entity.isPrimary) {
      this.logger.log(`Address set as primary: ${entity.id} for customer: ${entity.customerId}`);
    }

    // Log de mudança de tipo
    if (entity.type !== databaseEntity.type) {
      this.logger.log(
        `Address type changed: ${databaseEntity.type} → ${entity.type} (${entity.id})`,
      );
    }
  }

  /**
   * Antes de remover (soft delete) um endereço
   */
  beforeSoftRemove(event: SoftRemoveEvent<CustomerAddress>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    this.logger.debug(`Before soft remove address: ${entity.id}`);

    // Verificar se endereço pode ser removido
    this.validateAddressRemoval(entity);
  }

  /**
   * Após remover (soft delete) um endereço
   */
  afterSoftRemove(event: SoftRemoveEvent<CustomerAddress>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    this.logger.log(`Address soft removed: ${entity.id} for customer: ${entity.customerId}`);

    // Verificar se era endereço principal
    if (entity.isPrimary) {
      this.logger.warn(
        `Primary address removed for customer: ${entity.customerId} - action may be required`,
      );
    }
  }

  /**
   * Valida dados do endereço
   */
  private validateAddressData(address: CustomerAddress): void {
    // Validação de CEP
    if (!address.zipCode || address.zipCode.trim().length === 0) {
      throw new Error('Postal code is required');
    }

    // Validação de rua
    if (!address.street || address.street.trim().length < 5) {
      throw new Error('Street must be at least 5 characters long');
    }

    // Validação de cidade
    if (!address.city || address.city.trim().length < 2) {
      throw new Error('City is required');
    }

    // Validação de estado
    if (!address.state || address.state.trim().length !== 2) {
      throw new Error('State must be exactly 2 characters');
    }

    // Validação de cliente
    if (!address.customerId) {
      throw new Error('Customer ID is required');
    }
  }

  /**
   * Normaliza dados do endereço
   */
  private normalizeAddressData(address: CustomerAddress): void {
    // Normalizar CEP
    if (address.zipCode) {
      address.zipCode = address.zipCode.replace(/\D/g, '');
    }

    // Normalizar texto
    if (address.street) {
      address.street = address.street.trim();
    }

    if (address.city) {
      address.city = address.city.trim();
    }

    if (address.state) {
      address.state = address.state.toUpperCase().trim();
    }
  }

  /**
   * Monitora mudanças críticas no endereço
   */
  private monitorCriticalChanges(
    updatedAddress: CustomerAddress,
    originalAddress: CustomerAddress,
  ): void {
    // Mudança de CEP é crítica
    if (updatedAddress.zipCode !== originalAddress.zipCode) {
      this.logger.warn(
        `Address postal code changed: ${originalAddress.zipCode} → ${updatedAddress.zipCode} (${updatedAddress.id})`,
      );
    }

    // Mudança de cliente é crítica
    if (updatedAddress.customerId !== originalAddress.customerId) {
      this.logger.warn(
        `CRITICAL: Address customer changed: ${originalAddress.customerId} → ${updatedAddress.customerId} (${updatedAddress.id})`,
      );
    }
  }

  /**
   * Valida se endereço pode ser removido
   */
  private validateAddressRemoval(address: CustomerAddress): void {
    // Não permitir remover endereço principal se houver outros endereços
    if (address.isPrimary) {
      this.logger.warn(
        `Attempting to remove primary address: ${address.id} - ensure customer has alternative address`,
      );
    }

    // Verificar se é endereço de cobrança
    if (address.type === AddressType.BILLING) {
      this.logger.warn(
        `Attempting to remove billing address: ${address.id} - ensure customer has alternative billing address`,
      );
    }
  }
}
