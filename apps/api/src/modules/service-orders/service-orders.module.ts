import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOrdersService } from './service-orders.service';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrder } from './entities/service-order.entity';
import { DeliveriesModule } from '../deliveries/deliveries.module';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrder]), DeliveriesModule],
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService],
  exports: [ServiceOrdersService, TypeOrmModule],
})
export class ServiceOrdersModule {}
