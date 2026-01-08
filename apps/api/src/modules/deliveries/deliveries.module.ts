import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { DeliveryDashboardController } from './controllers/delivery-dashboard.controller';
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
import { DeliveryDashboardService } from './services/delivery-dashboard.service';
import { DriversModule } from '../drivers/drivers.module';
import { VehiclesModule } from '../vehicles/vehicles.module';

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
    forwardRef(() => DriversModule),
    forwardRef(() => VehiclesModule),
  ],
  controllers: [DeliveriesController, DeliveryDashboardController],
  providers: [
    DeliveriesService,
    DeliveryValidationService,
    TrackingCodeService,
    DeliveryNotificationService,
    RouteOptimizationService,
    DeliveryDashboardService,
  ],
  exports: [DeliveriesService, TypeOrmModule],
})
export class DeliveriesModule {}
