import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

/**
 * Audit Module Stub
 * TODO: Replace with full audit implementation
 */
@Module({
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}
