import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeoServicesModule } from '@nexus/geo-services';
import { RedisModule } from '@nexus/redis';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';
import { Address } from './entities/address.entity';

// Services
import { CepLookupService } from './services/cep-lookup.service';
import { AddressValidationService } from './services/address-validation.service';
import { GeocodingService } from './services/geocoding.service';

// Subscribers
import { AddressSubscriber } from './subscribers/address.subscriber';

// Interceptors
import { GeocodingInterceptor } from './interceptors/geocoding.interceptor';

// Utils
import { AddressFormatterUtil } from './utils/address-formatter.util';

@Module({
  imports: [TypeOrmModule.forFeature([Address]), GeoServicesModule, RedisModule],
  controllers: [AddressController],
  providers: [
    // Main service
    AddressService,

    // Auxiliary services
    CepLookupService,
    AddressValidationService,
    GeocodingService,

    // Utils
    AddressFormatterUtil,

    // Subscribers
    AddressSubscriber,

    // Interceptors
    GeocodingInterceptor,
  ],
  exports: [
    AddressService,
    CepLookupService,
    AddressValidationService,
    GeocodingService,
    TypeOrmModule,
  ],
})
export class AddressModule {}
