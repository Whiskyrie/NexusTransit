import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { Driver, DriverLicense, DriverDocument } from './entities/driverEntities';
import { DriverLicenseService } from './services/driver-license.service';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, DriverLicense, DriverDocument])],
  controllers: [DriversController],
  providers: [DriversService, DriverLicenseService],
  exports: [DriversService, DriverLicenseService, TypeOrmModule],
})
export class DriversModule {}
