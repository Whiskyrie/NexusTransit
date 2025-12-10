import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditService } from "./audit.service";
import { AuditSubscriber } from "./subscribers/audit.subscriber";
import { AuditLogEntity } from "./entities/audit-log.entity";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  providers: [AuditService, AuditSubscriber],
  exports: [AuditService, TypeOrmModule],
})
export class AuditModule {}
