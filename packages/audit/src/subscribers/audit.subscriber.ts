import {
  EventSubscriber,
  type EntitySubscriberInterface,
  type InsertEvent,
  type UpdateEvent,
  type RemoveEvent,
  type SoftRemoveEvent,
} from "typeorm";
import { Injectable, Logger, Optional } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ClsService } from "nestjs-cls";
import { AuditService } from "../audit.service";
import { AuditAction, AuditCategory } from "../enums";
import { IAuditableOptions, AuditContext } from "../interfaces/audit-options.interface";
import { BaseEntity } from "@nexus/common";
import { AUDIT_EXCLUDED_FIELDS, AUDITABLE_ENTITY_KEY } from "../constants/audit.constants";

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<BaseEntity> {
  private readonly logger = new Logger(AuditSubscriber.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
    @Optional() private readonly cls?: ClsService,
  ) {}

  /**
   * Listen to all entities that extend BaseEntity
   * Filtering will be done in the event handlers based on metadata
   */
  listenTo() {
    return BaseEntity;
  }

  async afterInsert(event: InsertEvent<BaseEntity>): Promise<void> {
    try {
      const options = this.getAuditableOptions(event.entity);
      if (!options || options.trackCreation === false) return;

      const context = this.getAuditContext();
      const entityName = options.entityDisplayName || event.metadata.name;

      await this.auditService.logAction({
        action: AuditAction.CREATE,
        category: options.auditCategory || AuditCategory.SYSTEM,
        resourceType: entityName,
        resourceId: event.entity.id,
        newValues: this.filterValues(event.entity, options.excludeFields),
        description: `Created new ${entityName}`,
        ...context,
      });
    } catch (error) {
      this.logger.error("Error in afterInsert audit", error);
    }
  }

  async afterUpdate(event: UpdateEvent<BaseEntity>): Promise<void> {
    try {
      if (!event.entity) return;

      const options = this.getAuditableOptions(event.entity as BaseEntity);
      if (!options || options.trackUpdates === false) return;

      const context = this.getAuditContext();
      const entityName = options.entityDisplayName || event.metadata.name;

      // Calculate changes
      const oldValues = options.trackOldValues
        ? this.filterValues(event.databaseEntity, options.excludeFields)
        : undefined;
      const newValues = this.filterValues(event.entity, options.excludeFields);

      await this.auditService.logAction({
        action: AuditAction.UPDATE,
        category: options.auditCategory || AuditCategory.SYSTEM,
        resourceType: entityName,
        resourceId: event.entity.id,
        oldValues,
        newValues,
        description: `Updated ${entityName}`,
        ...context,
      });
    } catch (error) {
      this.logger.error("Error in afterUpdate audit", error);
    }
  }

  async afterRemove(event: RemoveEvent<BaseEntity>): Promise<void> {
    try {
      if (!event.entity) return;

      const options = this.getAuditableOptions(event.entity);
      if (!options || options.trackDeletion === false) return;

      const context = this.getAuditContext();
      const entityName = options.entityDisplayName || event.metadata.name;

      await this.auditService.logAction({
        action: AuditAction.DELETE,
        category: options.auditCategory || AuditCategory.SYSTEM,
        resourceType: entityName,
        resourceId: event.entity.id,
        oldValues: options.trackOldValues
          ? this.filterValues(event.entity, options.excludeFields)
          : undefined,
        description: `Deleted ${entityName}`,
        ...context,
      });
    } catch (error) {
      this.logger.error("Error in afterRemove audit", error);
    }
  }

  async afterSoftRemove(event: SoftRemoveEvent<BaseEntity>): Promise<void> {
    try {
      if (!event.entity) return;

      const options = this.getAuditableOptions(event.entity);
      if (!options || options.trackDeletion === false) return;

      const context = this.getAuditContext();
      const entityName = options.entityDisplayName || event.metadata.name;

      await this.auditService.logAction({
        action: AuditAction.DELETE,
        category: options.auditCategory || AuditCategory.SYSTEM,
        resourceType: entityName,
        resourceId: event.entity.id,
        oldValues: options.trackOldValues
          ? this.filterValues(event.entity, options.excludeFields)
          : undefined,
        description: `Soft deleted ${entityName}`,
        ...context,
      });
    } catch (error) {
      this.logger.error("Error in afterSoftRemove audit", error);
    }
  }

  private getAuditableOptions(entity: unknown): IAuditableOptions | null {
    if (!entity) return null;
    return this.reflector.get<IAuditableOptions>(
      AUDITABLE_ENTITY_KEY,
      (entity as Record<string, unknown>).constructor,
    );
  }

  private getAuditContext(): AuditContext {
    if (!this.cls) return {};

    try {
      // Try to get user from CLS (assuming standard keys used in the app)
      const user = this.cls.get("user");
      const req = this.cls.get("request");

      return {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
        ipAddress: req?.ip || this.cls.get("ip"),
        userAgent: req?.headers?.["user-agent"] || this.cls.get("userAgent"),
        requestId: this.cls.getId(),
      };
    } catch (error) {
      this.logger.warn("Failed to get audit context from CLS", error);
      return {};
    }
  }

  private filterValues(entity: unknown, excludeFields: string[] = []): Record<string, unknown> {
    if (!entity || typeof entity !== "object") return {};

    const result: Record<string, unknown> = {};
    const allExcluded = [...AUDIT_EXCLUDED_FIELDS, ...excludeFields];
    const entityRecord = entity as Record<string, unknown>;

    for (const key in entityRecord) {
      if (Object.prototype.hasOwnProperty.call(entityRecord, key) && !allExcluded.includes(key)) {
        result[key] = entityRecord[key];
      }
    }
    return result;
  }
}
