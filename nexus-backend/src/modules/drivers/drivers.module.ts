import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { DriverDocument } from './entities/driver-document.entity';
import { Driver } from './entities/driver.entity';
import { DriverLicense } from './entities/driver-license.entity';
import { DriverLicenseService } from './services/driver-license.service';

// Módulos
import { AuditModule } from '../audit/audit.module';

// Interceptors
import { AuditContextInterceptor } from './interceptors/audit-context.interceptor';
import { DriverStatusInterceptor } from './interceptors/driver-status.interceptor';
import { LicenseValidationInterceptor } from './interceptors/license-validation.interceptor';

// Subscribers
import { DriverLicenseSubscriber } from './subscribers/driver-license.subscriber';
import { DriverDocumentSubscriber } from './subscribers/driver-document.subscriber';

// Utils
import { ClsAuditUtils } from './utils/cls-audit.util';
import { AuditableUtils } from './utils/auditable.util';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, DriverLicense, DriverDocument]), AuditModule],
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
    DriverLicenseSubscriber,
    DriverDocumentSubscriber,
  ],
  exports: [DriversService, DriverLicenseService, TypeOrmModule],
})
export class DriversModule {}
