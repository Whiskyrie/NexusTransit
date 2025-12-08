import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, AuditCategory } from './enums';

/**
 * Simplified Audit Log Service Stub
 * TODO: Replace with full audit implementation when audit-service is ready
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  /**
   * Log audit action (new method)
   */
  async logAction(params: {
    action: AuditAction;
    category: AuditCategory;
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    this.logger.log(
      `[AUDIT] ${params.category} - ${params.action}: ${params.description || 'No description'}`,
      {
        userId: params.userId,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        metadata: params.metadata,
      },
    );
  }

  /**
   * Create audit log (legacy method for backward compatibility)
   */
  async createLog(params: {
    action: AuditAction;
    category: AuditCategory;
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // Delegate to logAction for backward compatibility
    return this.logAction(params);
  }
}
