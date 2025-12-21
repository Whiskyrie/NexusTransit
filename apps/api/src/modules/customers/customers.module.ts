import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AuditModule } from '@nexus/audit';
import { GeoServicesModule } from '@nexus/geo-services';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { CustomerAddressesController } from './customer-addresses.controller';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { CustomerContact } from './entities/customer-contact.entity';
import { CustomerPreferences } from './entities/customer-preferences.entity';
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
    GeoServicesModule,
  ],
  controllers: [CustomersController, CustomerAddressesController],
  providers: [
    // Services
    CustomersService,
    GeocodingService,

    // Subscribers
    CustomerSubscriber,
    CustomerAddressSubscriber,
    CustomerContactSubscriber,
    CustomerPreferencesSubscriber,

    // Interceptors (disponíveis para uso no controller)
    CustomerAuditContextInterceptor,
    CustomerStatusInterceptor,
  ],
  exports: [CustomersService, TypeOrmModule],
})
export class CustomersModule {}
