import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from './entities/auditEntities';
import { AuditLogService } from './audit-log.service';
import { AuditInterceptor } from './interceptors/auditInterceptors';
import { AuditSubscriber } from '../vehicles/subscribers/audit.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  providers: [AuditLogService, AuditInterceptor, AuditSubscriber],
  exports: [AuditLogService, AuditInterceptor, AuditSubscriber],
})
export class AuditModule {}
