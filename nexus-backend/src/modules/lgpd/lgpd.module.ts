import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LgpdController } from './lgpd.controller';
import { ConsentService } from './consent.service';
import { DataRequestService } from './data-request.service';
import { DataPortabilityService } from './data-portability.service';
import { UserConsentEntity, DataRequestEntity } from './entities/lgpdEntities';

@Module({
  imports: [TypeOrmModule.forFeature([UserConsentEntity, DataRequestEntity])],
  controllers: [LgpdController],
  providers: [ConsentService, DataRequestService, DataPortabilityService],
  exports: [ConsentService, DataRequestService, DataPortabilityService],
})
export class LgpdModule {}
