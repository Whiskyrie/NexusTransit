import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { Logger } from '@nestjs/common';
import { Customer } from '../entities/customer.entity';
import { CustomerStatus } from '../enums/customer-status.enum';
import { CustomerType } from '../enums/customer-type.enum';

/**
 * Subscriber para auditoria de operações com Customer
 *
 * Monitora mudanças de status e operações críticas
 * Implementa regras de negócio específicas para clientes
 *
 * @class CustomerSubscriber
 */
@EventSubscriber()
export class CustomerSubscriber implements EntitySubscriberInterface<Customer> {
  private readonly logger = new Logger(CustomerSubscriber.name);

  /**
   * Define qual entidade este subscriber monitora
   */
  listenTo(): typeof Customer {
    return Customer;
  }

  /**
   * Antes de inserir um novo cliente
   */
  beforeInsert(event: InsertEvent<Customer>): void {
    const entity = event.entity;

    this.logger.debug(
      `Before insert: ${JSON.stringify({
        id: entity.id,
        name: entity.name,
        email: entity.email,
        type: entity.type,
        status: entity.status,
      })}`,
    );

    // Validações de negócio antes da inserção
    this.validateCustomerData(entity);

    // Normalização de dados
    this.normalizeCustomerData(entity);
  }

  /**
   * Após inserir um novo cliente
   */
  afterInsert(event: InsertEvent<Customer>): void {
    const entity = event.entity;

    this.logger.log(`Customer created: ${entity.id} - ${entity.name} (${entity.email})`);

    // Log de negócio específico
    if (entity.type === CustomerType.CORPORATE) {
      this.logger.log(`Business customer registered: ${entity.taxId}`);
    }

    // Verificar se é cliente prospect para ações de marketing
    if (entity.status === CustomerStatus.PROSPECT) {
      this.logger.log(`New prospect customer: ${entity.id} - actions may be required`);
    }
  }

  /**
   * Antes de atualizar um cliente
   */
  beforeUpdate(event: UpdateEvent<Customer>): void {
    const entity = event.entity as Customer;
    const databaseEntity = event.databaseEntity;

    if (!entity || !databaseEntity) {
      return;
    }

    this.logger.debug(`Before update: ${entity.id}`);

    // Monitorar mudanças críticas
    this.monitorCriticalChanges(entity, databaseEntity);

    // Validar regras de negócio
    this.validateUpdateRules(entity, databaseEntity);
  } /**
   * Após atualizar um cliente
   */
  afterUpdate(event: UpdateEvent<Customer>): void {
    const entity = event.entity as Customer;
    const databaseEntity = event.databaseEntity;

    if (!entity || !databaseEntity) {
      return;
    }

    this.logger.log(`Customer updated: ${entity.id}`);

    // Log de mudanças de status
    if (entity.status !== databaseEntity.status) {
      this.logger.log(
        `Customer status changed: ${databaseEntity.status} → ${entity.status} (${entity.id})`,
      );

      // Ações baseadas no novo status
      this.handleStatusChange(entity, databaseEntity.status);
    }

    // Log de mudança de categoria
    if (entity.category !== databaseEntity.category) {
      this.logger.log(
        `Customer category changed: ${databaseEntity.category} → ${entity.category} (${entity.id})`,
      );
    }
  }

  /**
   * Antes de remover (soft delete) um cliente
   */
  beforeSoftRemove(event: SoftRemoveEvent<Customer>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    this.logger.debug(`Before soft remove: ${entity.id}`);

    // Verificar se cliente pode ser removido
    this.validateCustomerRemoval(entity);
  }

  /**
   * Após remover (soft delete) um cliente
   */
  afterSoftRemove(event: SoftRemoveEvent<Customer>): void {
    const entity = event.entity;

    if (!entity) {
      return;
    }

    this.logger.log(`Customer soft removed: ${entity.id} - ${entity.name}`);

    // Log para compliance
    this.logger.warn(`Customer data retention: ${entity.id} marked for deletion`);
  }

  /**
   * Valida dados do cliente antes da inserção
   */
  private validateCustomerData(customer: Customer): void {
    // Validação de CPF/CNPJ
    if (!customer.taxId || customer.taxId.trim().length === 0) {
      throw new Error('Tax ID is required');
    }

    // Validação de email
    if (!customer.email?.includes('@')) {
      throw new Error('Valid email is required');
    }

    // Validação de nome
    if (!customer.name || customer.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
  }

  /**
   * Normaliza dados do cliente
   */
  private normalizeCustomerData(customer: Customer): void {
    // Normalizar email para lowercase
    if (customer.email) {
      customer.email = customer.email.toLowerCase().trim();
    }

    // Normalizar nome
    if (customer.name) {
      customer.name = customer.name.trim();
    }

    // Normalizar telefone
    if (customer.phone) {
      customer.phone = customer.phone.replace(/\D/g, '');
    }
  }

  /**
   * Monitora mudanças críticas nos dados do cliente
   */
  private monitorCriticalChanges(updatedCustomer: Customer, originalCustomer: Customer): void {
    // Mudança de CPF/CNPJ é crítica
    if (updatedCustomer.taxId !== originalCustomer.taxId) {
      this.logger.warn(
        `CRITICAL: Customer tax ID changed: ${originalCustomer.taxId} → ${updatedCustomer.taxId} (${updatedCustomer.id})`,
      );
    }

    // Mudança de email é crítica
    if (updatedCustomer.email !== originalCustomer.email) {
      this.logger.warn(
        `CRITICAL: Customer email changed: ${originalCustomer.email} → ${updatedCustomer.email} (${updatedCustomer.id})`,
      );
    }

    // Mudança de tipo (PF/PJ) é crítica
    if (updatedCustomer.type !== originalCustomer.type) {
      this.logger.warn(
        `CRITICAL: Customer type changed: ${originalCustomer.type} → ${updatedCustomer.type} (${updatedCustomer.id})`,
      );
    }
  }

  /**
   * Valida regras de negócio para atualização
   */
  private validateUpdateRules(updatedCustomer: Customer, originalCustomer: Customer): void {
    // Não permitir mudança de taxID se tiver entregas
    if (updatedCustomer.taxId !== originalCustomer.taxId) {
      // Aqui poderia verificar se há entregas associadas
      this.logger.warn(
        `Tax ID change attempted for customer with deliveries: ${updatedCustomer.id}`,
      );
    }

    // Validar transição de status
    if (updatedCustomer.status !== originalCustomer.status) {
      this.validateStatusTransition(originalCustomer.status, updatedCustomer.status);
    }
  }

  /**
   * Valida se transição de status é permitida
   */
  private validateStatusTransition(fromStatus: CustomerStatus, toStatus: CustomerStatus): void {
    const invalidTransitions: Record<CustomerStatus, CustomerStatus[]> = {
      [CustomerStatus.ACTIVE]: [CustomerStatus.PROSPECT],
      [CustomerStatus.INACTIVE]: [CustomerStatus.PROSPECT],
      [CustomerStatus.BLOCKED]: [CustomerStatus.PROSPECT],
      [CustomerStatus.PROSPECT]: [], // Prospect pode ir para qualquer status
    };

    if (invalidTransitions[fromStatus]?.includes(toStatus)) {
      throw new Error(`Invalid status transition: ${fromStatus} → ${toStatus}`);
    }
  }

  /**
   * Executa ações baseadas na mudança de status
   */
  private handleStatusChange(customer: Customer, previousStatus: CustomerStatus): void {
    switch (customer.status) {
      case CustomerStatus.ACTIVE:
        if (previousStatus === CustomerStatus.PROSPECT) {
          this.logger.log(`Customer converted from prospect: ${customer.id}`);
        }
        break;

      case CustomerStatus.BLOCKED:
        this.logger.warn(`Customer blocked: ${customer.id} - review required`);
        break;

      case CustomerStatus.INACTIVE:
        this.logger.log(`Customer deactivated: ${customer.id}`);
        break;
    }
  }

  /**
   * Valida se cliente pode ser removido
   */
  private validateCustomerRemoval(customer: Customer): void {
    // Verificar se há entregas ativas
    // Esta validação poderia ser mais complexa, verificando o banco de dados
    if (customer.status === CustomerStatus.ACTIVE) {
      this.logger.warn(
        `Attempting to remove active customer: ${customer.id} - check for active deliveries`,
      );
    }
  }
}
