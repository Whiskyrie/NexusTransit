import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { Driver, DriverLicense, DriverDocument } from './entities/driverEntities';
import { DriverLicenseService } from './services/driver-license.service';

// Interceptors
import { AuditContextInterceptor } from './interceptors/audit-context.interceptor';
import { DriverStatusInterceptor } from './interceptors/driver-status.interceptor';
import { LicenseValidationInterceptor } from './interceptors/license-validation.interceptor';

// Subscribers
import { DriverAuditSubscriber } from './subscribers/driver-audit.subscriber';
import { DriverLicenseSubscriber } from './subscribers/driver-license.subscriber';
import { DriverDocumentSubscriber } from './subscribers/driver-document.subscriber';

// Utils
import { ClsAuditUtils } from './utils/cls-audit.util';
import { AuditableUtils } from './utils/auditable.util';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, DriverLicense, DriverDocument])],
  controllers: [DriversController],
  providers: [
    // Services
    DriversService,
    DriverLicenseService,

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
    DriverAuditSubscriber,
    DriverLicenseSubscriber,
    DriverDocumentSubscriber,
  ],
  exports: [DriversService, DriverLicenseService, TypeOrmModule],
})
export class DriversModule {}
