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
import { DeliveryValidationService } from './services/delivery-validation.service';
import { TrackingCodeService } from './services/tracking-code.service';
import { DeliveryNotificationService } from './services/delivery-notification.service';
import { RouteOptimizationService } from './services/route-optimization.service';

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
  providers: [
    DeliveriesService,
    DeliveryValidationService,
    TrackingCodeService,
    DeliveryNotificationService,
    RouteOptimizationService,
  ],
  exports: [DeliveriesService, TypeOrmModule],
})
export class DeliveriesModule {}
