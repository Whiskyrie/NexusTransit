import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { Tracking } from './entities/tracking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tracking])],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService, TypeOrmModule],
})
export class TrackingModule {}
