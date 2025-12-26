import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { GeoServicesModule } from '@nexus/geo-services';
import { ServiceOrdersService } from './service-orders.service';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrder } from './entities/service-order.entity';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { CustomersModule } from '../customers/customers.module';
import { ServiceOrderEventsListener } from './listeners/service-order-events.listener';
import { ServiceOrderWorkflowService } from './services/service-order-workflow.service';
import { ServiceOrderValidationService } from './services/service-order-validation.service';
import { ServiceOrderPricingService } from './services/service-order-pricing.service';
import { AutoDeliveryGenerationSubscriber } from './subscribers/auto-delivery-generation.subscriber';
import { ServiceOrderToDeliveryMapper } from './mappers/service-order-to-delivery.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceOrder]),
    DeliveriesModule,
    CustomersModule,
    GeoServicesModule,
    EventEmitterModule.forRoot(),
    ConfigModule,
  ],
  controllers: [ServiceOrdersController],
  providers: [
    ServiceOrdersService,
    ServiceOrderEventsListener,
    ServiceOrderWorkflowService,
    ServiceOrderValidationService,
    ServiceOrderPricingService,
    AutoDeliveryGenerationSubscriber,
    ServiceOrderToDeliveryMapper,
  ],
  exports: [
    ServiceOrdersService,
    ServiceOrderValidationService,
    ServiceOrderPricingService,
    TypeOrmModule,
  ],
})
export class ServiceOrdersModule {}
