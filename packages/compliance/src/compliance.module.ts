import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ComplianceController } from "./compliance.controller";
import { ConsentService } from "./consent.service";
import { DataRequestService } from "./data-request.service";
import { DataPortabilityService } from "./data-portability.service";
import { UserConsentEntity, DataRequestEntity } from "./entities/lgpdEntities";

@Module({
  imports: [TypeOrmModule.forFeature([UserConsentEntity, DataRequestEntity])],
  controllers: [ComplianceController],
  providers: [ConsentService, DataRequestService, DataPortabilityService],
  exports: [ConsentService, DataRequestService, DataPortabilityService],
})
export class ComplianceModule {}
