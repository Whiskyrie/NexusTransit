import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { ServiceOrdersService } from './service-orders.service';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrder } from './entities/service-order.entity';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { ServiceOrderEventsListener } from './listeners/service-order-events.listener';
import { ServiceOrderWorkflowService } from './services/service-order-workflow.service';
import { AutoDeliveryGenerationSubscriber } from './subscribers/auto-delivery-generation.subscriber';
import { ServiceOrderToDeliveryMapper } from './mappers/service-order-to-delivery.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceOrder]),
    DeliveriesModule,
    EventEmitterModule.forRoot(),
    ConfigModule,
  ],
  controllers: [ServiceOrdersController],
  providers: [
    ServiceOrdersService,
    ServiceOrderEventsListener,
    ServiceOrderWorkflowService,
    AutoDeliveryGenerationSubscriber,
    ServiceOrderToDeliveryMapper,
  ],
  exports: [ServiceOrdersService, TypeOrmModule],
})
export class ServiceOrdersModule {}
