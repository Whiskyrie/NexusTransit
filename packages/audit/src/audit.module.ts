import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClsModule } from "nestjs-cls";
import { Reflector } from "@nestjs/core";
import { AuditService } from "./audit.service";
import { AuditSubscriber } from "./subscribers/audit.subscriber";
import { AuditLogEntity } from "./entities/audit-log.entity";
import { AuditExportService } from "./services/audit-export.service";
import { AuditCleanupService } from "./services/audit-cleanup.service";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity]), ClsModule],
  providers: [AuditService, AuditExportService, AuditCleanupService, AuditSubscriber, Reflector],
  exports: [AuditService, AuditExportService, AuditCleanupService, TypeOrmModule],
})
export class AuditModule {}
