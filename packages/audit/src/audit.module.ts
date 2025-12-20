import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClsModule } from "nestjs-cls";
import { Reflector } from "@nestjs/core";
import { AuditService } from "./audit.service";
import { AuditSubscriber } from "./subscribers/audit.subscriber";
import { AuditLogEntity } from "./entities/audit-log.entity";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity]), ClsModule],
  providers: [AuditService, AuditSubscriber, Reflector],
  exports: [AuditService, TypeOrmModule],
})
export class AuditModule {}
