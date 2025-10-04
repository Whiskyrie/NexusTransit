import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { Delivery } from './entities/delivery.entity';
import { DeliveryAttempt } from './entities/delivery-attempt.entity';
import { DeliveryProof } from './entities/delivery-proof.entity';
import { DeliveryStatusHistory } from './entities/delivery-status-history.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Delivery,
      DeliveryAttempt,
      DeliveryProof,
      DeliveryStatusHistory,
      Customer,
      Driver,
      Vehicle,
    ]),
  ],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService, TypeOrmModule],
})
export class DeliveriesModule {}
