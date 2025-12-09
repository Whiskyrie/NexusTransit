import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleDocument } from './entities/vehicle-document.entity';
import { VehicleMaintenance } from './entities/vehicle-maintenance.entity';
import { FuelConsumptionUtils } from './utils/fuel-consumption.util';
import { VehicleNotificationService } from './services/vehicle-notification.service';
import { MaintenanceScheduler } from './services/maintenance-scheduler.service';
import { VehicleStatusChangeSubscriber } from './subscribers/status-change.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, VehicleDocument, VehicleMaintenance]),
    ScheduleModule.forRoot(),
  ],
  controllers: [VehiclesController],
  providers: [
    VehiclesService,
    FuelConsumptionUtils,
    VehicleNotificationService,
    MaintenanceScheduler,
    VehicleStatusChangeSubscriber,
  ],
  exports: [
    VehiclesService,
    FuelConsumptionUtils,
    VehicleNotificationService,
    MaintenanceScheduler,
    TypeOrmModule,
  ],
})
export class VehiclesModule {}
