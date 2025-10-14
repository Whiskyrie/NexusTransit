import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { Logger, Injectable, Optional } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuditAction, AuditCategory } from '../../audit/enums/auditEnums';
import { CreateAuditLogDto } from '../../audit/dto/auditDto';
import type { AuditMetadata, AuditContext } from '../interfaces/auditable.interface';
import { ClsAuditUtils } from '../utils/cls-audit.util';
import { Customer } from '../entities/customer.entity';

/**
 * TypeORM Subscriber para auditoria de clientes
 *
 * Registra automaticamente todas as operações CRUD realizadas
 * na entidade Customer no sistema de auditoria
 *
 * @class CustomerAuditSubscriber
 */
@Injectable()
@EventSubscriber()
export class CustomerAuditSubscriber implements EntitySubscriberInterface<Customer> {
  private readonly logger = new Logger(CustomerAuditSubscriber.name);

  constructor(
    @Optional() private readonly clsService?: ClsService,
    @Optional() private readonly auditLogService?: AuditLogService,
  ) {}

  /**
   * Indica qual entidade este subscriber monitora
   */
  listenTo(): typeof Customer {
    return Customer;
  }

  /**
   * Called after entity insertion.
   */
  afterInsert(event: InsertEvent<Customer>): Promise<void> | void {
    return this.logAuditEvent('CREATE', event.entity, event, null);
  }

  /**
   * Called after entity update.
   */
  afterUpdate(event: UpdateEvent<Customer>): Promise<void> | void {
    // Get changed columns
    const changedColumns = event.updatedColumns?.map(col => col.propertyName) || [];
    const oldValues = event.databaseEntity ? { ...event.databaseEntity } : null;

    return this.logAuditEvent('UPDATE', event.entity as Customer, event, {
      changedColumns,
      oldValues,
    });
  }

  /**
   * Called before entity removal.
   */
  beforeRemove(event: RemoveEvent<Customer>): Promise<void> | void {
    return this.logAuditEvent('DELETE', event.entity, event, null);
  }

  private async logAuditEvent(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: Customer | undefined,
    event: InsertEvent<Customer> | UpdateEvent<Customer> | RemoveEvent<Customer>,
    metadata: AuditMetadata | null,
  ): Promise<void> {
    if (!entity) {
      this.logger.warn(`Tentativa de auditoria em entidade undefined para ação ${action}`);
      return;
    }

    try {
      // Get audit context from CLS (Continuation Local Storage)
      const context = this.getAuditContext();

      // Get entity metadata
      const entityName = event.metadata.name;
      const entityId = entity.id;

      // Create audit log entry
      const auditLogData: Partial<CreateAuditLogDto> = {
        action: action as AuditAction,
        category: AuditCategory.SYSTEM,
        resourceType: entityName,
        resourceId: entityId,
        metadata: {
          changedFields: metadata?.changedColumns ?? [],
          customerTaxId: entity.taxId,
          customerName: entity.name,
          customerType: entity.type,
          customerStatus: entity.status,
        },
      };

      if (context.userId) {
        auditLogData.userId = context.userId;
      }

      if (context.ipAddress) {
        auditLogData.ipAddress = context.ipAddress;
      }

      if (context.userAgent) {
        auditLogData.userAgent = context.userAgent;
      }

      if (this.auditLogService) {
        await this.auditLogService.create(auditLogData as CreateAuditLogDto);
        this.logger.debug(`Auditoria registrada: ${action} em ${entityName}#${entityId}`);
      }
    } catch (error) {
      this.logger.error(
        `Erro ao registrar auditoria: ${error}`,
        error instanceof Error ? error.stack : '',
      );
    }
  }

  private getAuditContext(): AuditContext {
    if (!this.clsService) {
      return {};
    }

    try {
      return ClsAuditUtils.getAuditContext(this.clsService);
    } catch (error) {
      this.logger.warn('Erro ao obter contexto de auditoria do CLS', error);
      return {};
    }
  }
}
