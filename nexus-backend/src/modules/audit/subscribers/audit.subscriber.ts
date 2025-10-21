import {
  EventSubscriber,
  type EntitySubscriberInterface,
  type InsertEvent,
  type UpdateEvent,
  type RemoveEvent,
  type SoftRemoveEvent,
} from 'typeorm';
import { Injectable, Logger, Optional } from '@nestjs/common';
import type { ClsService } from 'nestjs-cls';
import { Reflector } from '@nestjs/core';
import { AuditLogService } from '../audit-log.service';
import { AuditAction, AuditCategory } from '../enums';
import type { CreateAuditLogDto } from '../dto';
import type { IAuditableOptions } from '../interfaces/audit-options.interface';
import type { BaseEntity } from '../../../database/entities/base.entity';
import { AUDIT_EXCLUDED_FIELDS } from '../constants/audit.constants';

/**
 * Chaves para metadados de entidades auditáveis
 */
const AUDITABLE_ENTITY_KEYS = [
  'auditable_entity',
  'auditable_delivery_entity',
  'auditable_driver_entity',
  'auditable_vehicle_entity',
  'AUDITABLE_ENTITY',
];

/**
 * Interface para contexto de auditoria do CLS
 */
interface AuditContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
}

/**
 * Subscriber global de auditoria
 *
 * Intercepta operações de CRUD em entidades marcadas com @Auditable
 * e registra logs de auditoria automaticamente
 *
 * @class AuditSubscriber
 */
@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<BaseEntity> {
  private readonly logger = new Logger(AuditSubscriber.name);

  constructor(
    @Optional() private readonly clsService?: ClsService,
    @Optional() private readonly auditLogService?: AuditLogService,
    private readonly reflector?: Reflector,
  ) {
    this.logger.debug('AuditSubscriber initialized');
  }

  /**
   * Chamado após inserção de entidade
   */
  async afterInsert(event: InsertEvent<BaseEntity>): Promise<void> {
    const options = this.getAuditOptions(event.entity);

    if (!options?.trackCreation) {
      return;
    }

    await this.logAuditEvent({
      action: AuditAction.CREATE,
      entity: event.entity,
      entityName: event.metadata.name,
      options,
    });
  }

  /**
   * Chamado após atualização de entidade
   */
  async afterUpdate(event: UpdateEvent<BaseEntity>): Promise<void> {
    if (!event.entity) {
      return;
    }

    const options = this.getAuditOptions(event.entity);

    if (!options?.trackUpdates) {
      return;
    }

    const changedColumns = event.updatedColumns?.map(col => col.propertyName) ?? [];
    const oldValues = event.databaseEntity
      ? this.sanitizeData(event.databaseEntity, options.excludeFields)
      : null;

    await this.logAuditEvent({
      action: AuditAction.UPDATE,
      entity: event.entity as BaseEntity,
      entityName: event.metadata.name,
      options,
      metadata: {
        changedColumns,
      },
      oldValues,
    });
  }

  /**
   * Chamado antes de remoção física de entidade
   */
  async beforeRemove(event: RemoveEvent<BaseEntity>): Promise<void> {
    if (!event.entity) {
      return;
    }

    const options = this.getAuditOptions(event.entity);

    if (!options?.trackDeletion) {
      return;
    }

    await this.logAuditEvent({
      action: AuditAction.DELETE,
      entity: event.entity,
      entityName: event.metadata.name,
      options,
      oldValues: this.sanitizeData(event.entity, options.excludeFields),
    });
  }

  /**
   * Chamado após soft delete de entidade
   */
  async afterSoftRemove(event: SoftRemoveEvent<BaseEntity>): Promise<void> {
    if (!event.entity) {
      return;
    }

    const options = this.getAuditOptions(event.entity);

    if (!options?.trackDeletion) {
      return;
    }

    await this.logAuditEvent({
      action: AuditAction.DELETE,
      entity: event.entity,
      entityName: event.metadata.name,
      options,
      metadata: {
        softDelete: true,
      },
      oldValues: this.sanitizeData(event.entity, options.excludeFields),
    });
  }

  /**
   * Registra evento de auditoria
   */
  private async logAuditEvent(params: {
    action: AuditAction;
    entity: BaseEntity;
    entityName: string;
    options: IAuditableOptions;
    metadata?: Record<string, unknown>;
    oldValues?: Record<string, unknown> | null;
  }): Promise<void> {
    const { action, entity, entityName, options, metadata, oldValues } = params;

    try {
      if (!this.auditLogService) {
        this.logger.debug('AuditLogService não disponível, pulando registro de auditoria');
        return;
      }

      const context = this.getAuditContext();
      const category = this.determineCategory(entityName, options);
      const newValues =
        action !== AuditAction.DELETE ? this.sanitizeData(entity, options.excludeFields) : null;

      const auditLogData: Partial<CreateAuditLogDto> = {
        action,
        category,
        resourceType: options.entityDisplayName ?? entityName,
        resourceId: entity.id,
        description: this.generateDescription(action, entityName, entity.id),
      };

      // Adicionar campos opcionais apenas se existirem
      if (context.userId) {
        auditLogData.userId = context.userId;
      }
      if (context.userEmail) {
        auditLogData.userEmail = context.userEmail;
      }
      if (context.userRole) {
        auditLogData.userRole = context.userRole;
      }
      if (context.ipAddress) {
        auditLogData.ipAddress = context.ipAddress;
      }
      if (context.userAgent) {
        auditLogData.userAgent = context.userAgent;
      }
      if (context.requestId) {
        auditLogData.correlationId = context.requestId;
      }
      if (context.sessionId) {
        auditLogData.sessionId = context.sessionId;
      }
      if (metadata) {
        auditLogData.metadata = metadata;
      }
      if (options.trackOldValues && oldValues) {
        auditLogData.oldValues = oldValues;
      }
      if (newValues) {
        auditLogData.newValues = newValues;
      }

      await this.auditLogService.createLog(auditLogData as CreateAuditLogDto);

      this.logger.debug(
        `Auditoria registrada: ${action} em ${entityName} (${entity.id}) por usuário ${context.userId ?? 'SYSTEM'}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao registrar auditoria para ${action} em ${entityName}:`,
        error instanceof Error ? error.message : String(error),
      );
      // Não lançar erro para não interromper a operação principal
    }
  }

  /**
   * Obtém opções de auditoria da entidade
   */
  private getAuditOptions(entity: object): IAuditableOptions | null {
    const constructor = entity.constructor;
    const reflector = this.reflector ?? new Reflector();

    for (const key of AUDITABLE_ENTITY_KEYS) {
      const options = reflector.get<IAuditableOptions>(key, constructor);
      if (options) {
        return {
          ...options,
          excludeFields: [...(options.excludeFields ?? []), ...AUDIT_EXCLUDED_FIELDS],
        };
      }
    }

    return null;
  }

  /**
   * Determina categoria de auditoria baseada no nome da entidade
   */
  private determineCategory(entityName: string, options: IAuditableOptions): AuditCategory {
    if (options.auditCategory) {
      return options.auditCategory;
    }

    const lowerName = entityName.toLowerCase();

    if (lowerName.includes('vehicle')) {
      return AuditCategory.VEHICLE_MANAGEMENT;
    }
    if (lowerName.includes('delivery') || lowerName.includes('deliveries')) {
      return AuditCategory.DELIVERY_MANAGEMENT;
    }
    if (lowerName.includes('driver')) {
      return AuditCategory.DRIVER_MANAGEMENT;
    }
    if (lowerName.includes('customer')) {
      return AuditCategory.CUSTOMER_MANAGEMENT;
    }
    if (lowerName.includes('route')) {
      return AuditCategory.ROUTE_MANAGEMENT;
    }
    if (lowerName.includes('incident')) {
      return AuditCategory.INCIDENT_MANAGEMENT;
    }
    if (lowerName.includes('user') || lowerName.includes('role')) {
      return AuditCategory.USER_MANAGEMENT;
    }

    return AuditCategory.SYSTEM;
  }

  /**
   * Gera descrição automática para o log
   */
  private generateDescription(action: AuditAction, entityName: string, entityId: string): string {
    const actionMap: Record<AuditAction, string> = {
      [AuditAction.CREATE]: 'criou',
      [AuditAction.UPDATE]: 'atualizou',
      [AuditAction.DELETE]: 'removeu',
      [AuditAction.READ]: 'leu',
      [AuditAction.LOGIN]: 'fez login',
      [AuditAction.LOGOUT]: 'fez logout',
      [AuditAction.PASSWORD_CHANGE]: 'alterou senha',
      [AuditAction.FAILED_LOGIN]: 'falhou ao fazer login',
      [AuditAction.ACCESS_DENIED]: 'teve acesso negado',
    };

    return `${actionMap[action]} ${entityName} com ID ${entityId}`;
  }

  /**
   * Remove campos sensíveis e excluídos dos dados
   */
  private sanitizeData(data: object, excludeFields: string[] = []): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const allExcludedFields = [...excludeFields, ...AUDIT_EXCLUDED_FIELDS];

    for (const [key, value] of Object.entries(data)) {
      if (!allExcludedFields.includes(key)) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Obtém contexto de auditoria do CLS
   */
  private getAuditContext(): AuditContext {
    if (!this.clsService) {
      return {};
    }

    try {
      return {
        userId: this.clsService.get('userId'),
        userEmail: this.clsService.get('userEmail'),
        userRole: this.clsService.get('userRole'),
        ipAddress: this.clsService.get('ipAddress'),
        userAgent: this.clsService.get('userAgent'),
        requestId: this.clsService.get('requestId'),
        sessionId: this.clsService.get('sessionId'),
      };
    } catch {
      return {};
    }
  }
}
