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
import type { CreateAuditLogDto } from '../../audit/dto/auditDto';
import { ClsAuditUtils, type AuditContext } from '../utils/cls-audit.util';

/**
 * Interface para entidades auditáveis
 */
interface AuditableEntity {
  id: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface para metadados de auditoria
 */
interface AuditMetadata {
  changedColumns?: string[];
  oldValues?: Record<string, unknown> | null;
}

/**
 * Subscriber para auditoria automática de entregas
 *
 * Registra automaticamente todas as operações de:
 * - Criação (INSERT)
 * - Atualização (UPDATE)
 * - Remoção (DELETE)
 *
 * Integra com AuditLogService e ClsService para contexto completo
 */
@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  private readonly logger = new Logger(AuditSubscriber.name);

  constructor(
    @Optional() private readonly clsService?: ClsService,
    @Optional() private readonly auditLogService?: AuditLogService,
  ) {}

  /**
   * Called after entity insertion.
   */
  afterInsert(event: InsertEvent<AuditableEntity>): Promise<void> | void {
    return this.logAuditEvent('CREATE', event.entity, event, null);
  }

  /**
   * Called after entity update.
   */
  afterUpdate(event: UpdateEvent<AuditableEntity>): Promise<void> | void {
    // Get changed columns
    const changedColumns = event.updatedColumns?.map(col => col.propertyName) || [];
    const oldValues = event.databaseEntity ? { ...event.databaseEntity } : null;

    return this.logAuditEvent('UPDATE', event.entity as AuditableEntity, event, {
      changedColumns,
      oldValues,
    });
  }

  /**
   * Called before entity removal.
   */
  beforeRemove(event: RemoveEvent<AuditableEntity>): Promise<void> | void {
    return this.logAuditEvent('DELETE', event.entity, event, null);
  }

  private async logAuditEvent(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: AuditableEntity | undefined,
    event:
      | InsertEvent<AuditableEntity>
      | UpdateEvent<AuditableEntity>
      | RemoveEvent<AuditableEntity>,
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
        },
      };

      // Only add optional fields if they have values
      if (metadata?.oldValues) {
        auditLogData.oldValues = metadata.oldValues;
      }

      if (action !== 'DELETE') {
        auditLogData.newValues = { ...entity } as Record<string, unknown>;
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

      // Log audit entry
      if (this.auditLogService) {
        await this.auditLogService.createLog(auditLogData as CreateAuditLogDto);
      }

      this.logger.debug(
        `Auditoria registrada: ${action} em ${entityName} (${entityId}) por usuário ${context.userId ?? 'SYSTEM'}`,
      );
    } catch (error) {
      this.logger.error(`Erro ao registrar auditoria para ${action}:`, error);
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
}
