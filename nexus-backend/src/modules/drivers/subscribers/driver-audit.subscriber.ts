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
import { Driver } from '../entities/driver.entity';

/**
 * TypeORM Subscriber para auditoria de motoristas
 *
 * Registra automaticamente todas as operações CRUD realizadas
 * na entidade Driver no sistema de auditoria
 *
 * @class DriverAuditSubscriber
 */
@Injectable()
@EventSubscriber()
export class DriverAuditSubscriber implements EntitySubscriberInterface<Driver> {
  private readonly logger = new Logger(DriverAuditSubscriber.name);

  constructor(
    @Optional() private readonly clsService?: ClsService,
    @Optional() private readonly auditLogService?: AuditLogService,
  ) {}

  /**
   * Indica qual entidade este subscriber monitora
   */
  listenTo(): typeof Driver {
    return Driver;
  }

  /**
   * Called after entity insertion.
   */
  afterInsert(event: InsertEvent<Driver>): Promise<void> | void {
    return this.logAuditEvent('CREATE', event.entity, event, null);
  }

  /**
   * Called after entity update.
   */
  afterUpdate(event: UpdateEvent<Driver>): Promise<void> | void {
    // Get changed columns
    const changedColumns = event.updatedColumns?.map(col => col.propertyName) || [];
    const oldValues = event.databaseEntity ? { ...event.databaseEntity } : null;

    return this.logAuditEvent('UPDATE', event.entity as Driver, event, {
      changedColumns,
      oldValues,
    });
  }

  /**
   * Called before entity removal.
   */
  beforeRemove(event: RemoveEvent<Driver>): Promise<void> | void {
    return this.logAuditEvent('DELETE', event.entity, event, null);
  }

  private async logAuditEvent(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: Driver | undefined,
    event: InsertEvent<Driver> | UpdateEvent<Driver> | RemoveEvent<Driver>,
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
          driverCpf: entity.cpf,
          driverName: entity.full_name,
        },
      };

      // Only add optional fields if they have values
      if (metadata?.oldValues) {
        auditLogData.oldValues = this.sanitizeOldValues(metadata.oldValues);
      }

      if (action !== 'DELETE') {
        auditLogData.newValues = this.sanitizeNewValues({ ...entity } as Record<string, unknown>);
      }

      if (context.userId) {
        auditLogData.userId = context.userId;
      }

      if (context.ipAddress) {
        auditLogData.ipAddress = context.ipAddress;
      }

      if (context.userAgent) {
        auditLogData.userAgent = context.userAgent;
      }

      // Log audit event if service is available
      if (this.auditLogService) {
        await this.auditLogService.createLog(auditLogData as CreateAuditLogDto);
        this.logger.debug(
          `Auditoria registrada: ${action} em motorista ${entityId} por ${context.userId ?? 'SYSTEM'}`,
        );
      } else {
        this.logger.debug(`Evento de auditoria: ${action} em motorista ${entityId}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao registrar auditoria para ${action}:`, error);
      // Não propaga o erro para não afetar a operação principal
    }
  }

  /**
   * Obtém o contexto de auditoria do CLS
   */
  private getAuditContext(): AuditContext {
    if (!this.clsService) {
      return {};
    }

    return ClsAuditUtils.getAuditContext(this.clsService);
  }

  /**
   * Remove campos sensíveis dos valores antigos
   */
  private sanitizeOldValues(oldValues: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...oldValues };
    // Remove campos sensíveis para segurança
    delete sanitized.cpf;
    delete sanitized.email;
    delete sanitized.phone;
    return sanitized;
  }

  /**
   * Remove campos sensíveis dos valores novos
   */
  private sanitizeNewValues(newValues: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...newValues };
    // Remove campos sensíveis para segurança
    delete sanitized.cpf;
    delete sanitized.email;
    delete sanitized.phone;
    return sanitized;
  }
}
