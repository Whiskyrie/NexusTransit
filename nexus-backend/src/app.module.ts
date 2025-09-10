import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { RoutesModule } from './modules/routes/routes.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    VehiclesModule,
    DriversModule,
    RoutesModule,
    DeliveriesModule,
    TrackingModule,
    IncidentsModule,
    CustomersModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
