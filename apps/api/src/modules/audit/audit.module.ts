import { Module } from '@nestjs/common';
import { AuditModule as AuditPackageModule } from '@nexus/audit';
import { AuditController } from './audit.controller';

@Module({
  imports: [AuditPackageModule],
  controllers: [AuditController],
})
export class AuditModule {}
