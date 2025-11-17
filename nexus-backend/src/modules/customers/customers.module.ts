import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditModule } from '../audit/audit.module';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { CustomerAddressesController } from './customer-addresses.controller';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { CustomerContact } from './entities/customer-contact.entity';
import { CustomerPreferences } from './entities/customer-preferences.entity';
import { ViaCepService } from './services/viacep.service';
import { GeocodingService } from './services/geocoding.service';

// Subscribers
import {
  CustomerSubscriber,
  CustomerAddressSubscriber,
  CustomerContactSubscriber,
  CustomerPreferencesSubscriber,
} from './subscribers';

// Interceptors
import { CustomerAuditContextInterceptor, CustomerStatusInterceptor } from './interceptors';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerAddress, CustomerContact, CustomerPreferences]),
    HttpModule,
    AuditModule,
  ],
  controllers: [CustomersController, CustomerAddressesController],
  providers: [
    // Services
    CustomersService,
    ViaCepService,
    GeocodingService,

    // Subscribers
    CustomerSubscriber,
    CustomerAddressSubscriber,
    CustomerContactSubscriber,
    CustomerPreferencesSubscriber,

    // Interceptors (aplicados localmente apenas no CustomerAuditContextInterceptor)
    {
      provide: APP_INTERCEPTOR,
      useClass: CustomerAuditContextInterceptor,
    },
    // CustomerStatusInterceptor será aplicado diretamente no controller
    CustomerStatusInterceptor,
  ],
  exports: [CustomersService, TypeOrmModule],
})
export class CustomersModule {}
