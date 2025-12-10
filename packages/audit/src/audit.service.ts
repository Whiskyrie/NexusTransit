import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogEntity } from "./entities/audit-log.entity";
import { AuditAction, AuditCategory } from "./enums";

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>
  ) {}

  async create(data: Partial<AuditLogEntity>): Promise<AuditLogEntity> {
    try {
      const log = this.auditLogRepository.create(data);
      return await this.auditLogRepository.save(log);
    } catch (error) {
      this.logger.error("Failed to create audit log", error);
      throw error;
    }
  }

  async logAction(params: {
    action: AuditAction;
    category: AuditCategory;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    resourceType: string;
    resourceId?: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.create({
        ...params,
        resourceId: params.resourceId || null,
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        userRole: params.userRole || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        description: params.description || null,
        metadata: params.metadata || null,
        oldValues: params.oldValues || null,
        newValues: params.newValues || null,
      });
    } catch (error) {
      // Don't throw error to avoid breaking the main flow
      this.logger.error("Failed to log audit action", error);
    }
  }
}
