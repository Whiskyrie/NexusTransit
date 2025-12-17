import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { DriverAvailabilityController } from './controllers/driver-availability.controller';
import { DriverDocument } from './entities/driver-document.entity';
import { Driver } from './entities/driver.entity';
import { DriverLicense } from './entities/driver-license.entity';
import { DriverAvailability } from './entities/driver-availability.entity';
import { DriverLicenseService } from './services/driver-license.service';
import { DriverAvailabilityService } from './services/driver-availability.service';

// Módulos e utils externos
import { AuditModule, AuditableUtils } from '@nexus/audit';

// Interceptors
import { AuditContextInterceptor } from './interceptors/audit-context.interceptor';
import { DriverStatusInterceptor } from './interceptors/driver-status.interceptor';
import { LicenseValidationInterceptor } from './interceptors/license-validation.interceptor';

// Subscribers
import { DriverLicenseSubscriber } from './subscribers/driver-license.subscriber';
import { DriverDocumentSubscriber } from './subscribers/driver-document.subscriber';
import { DriverAvailabilitySubscriber } from './subscribers/driver-availability.subscriber';

// Utils internos
import { ClsAuditUtils } from './utils/cls-audit.util';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, DriverLicense, DriverDocument, DriverAvailability]),
    AuditModule,
  ],
  controllers: [DriversController, DriverAvailabilityController],
  providers: [
    // Services
    DriversService,
    DriverLicenseService,
    DriverAvailabilityService,

    // Utils
    ClsAuditUtils,
    AuditableUtils,

    // Interceptors registrados globalmente no módulo
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DriverStatusInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LicenseValidationInterceptor,
    },

    // Subscribers
    DriverLicenseSubscriber,
    DriverDocumentSubscriber,
    DriverAvailabilitySubscriber,
  ],
  exports: [DriversService, DriverLicenseService, DriverAvailabilityService, TypeOrmModule],
})
export class DriversModule {}
