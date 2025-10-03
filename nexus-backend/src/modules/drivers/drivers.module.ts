import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { Driver, DriverLicense, DriverDocument } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, DriverLicense, DriverDocument])],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService, TypeOrmModule],
})
export class DriversModule {}
