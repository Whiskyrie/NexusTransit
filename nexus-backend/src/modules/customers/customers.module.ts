import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { CustomerAddressesController } from './customer-addresses.controller';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { CustomerContact } from './entities/customer-contact.entity';
import { CustomerPreferences } from './entities/customer-preferences.entity';
import { ViaCepService } from './services/viacep.service';
import { GeocodingService } from './services/geocoding.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerAddress, CustomerContact, CustomerPreferences]),
    HttpModule,
  ],
  controllers: [CustomersController, CustomerAddressesController],
  providers: [CustomersService, ViaCepService, GeocodingService],
  exports: [CustomersService, TypeOrmModule],
})
export class CustomersModule {}
