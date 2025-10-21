import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from './entities';
import { AuditLogService } from './audit-log.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './interceptors';
import { AuditSubscriber } from './subscribers/audit.subscriber';
import { DataSource } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AuditController],
  providers: [
    AuditLogService,
    AuditInterceptor,
    AuditSubscriber,
    {
      provide: 'AUDIT_SUBSCRIBER_REGISTRATION',
      useFactory: (dataSource: DataSource, auditSubscriber: AuditSubscriber) => {
        // Registra o subscriber manualmente no DataSource
        if (dataSource?.subscribers && !dataSource.subscribers.includes(auditSubscriber)) {
          dataSource.subscribers.push(auditSubscriber);
        }
        return auditSubscriber;
      },
      inject: [DataSource, AuditSubscriber],
    },
  ],
  exports: [AuditLogService, AuditInterceptor, AuditSubscriber],
})
export class AuditModule {}
