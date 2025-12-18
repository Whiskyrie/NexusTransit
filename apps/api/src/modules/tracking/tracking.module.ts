import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nexus/redis';
import { RateLimitModule } from '@nexus/rate-limit';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { Tracking } from './entities/tracking.entity';
import { TrackingEvent } from './entities/tracking-event.entity';
import { TrackingEventsService } from './services/tracking-events.service';
import { TrackingEventsController } from './controllers/tracking-events.controller';
import { PublicTrackingController } from './controllers/public-tracking.controller';
import { TrackingCalculationService } from './services/tracking-calculation.service';
import { TrackingCacheService } from './services/tracking-cache.service';
import { TrackingHistoryService } from './services/tracking-history.service';
import { TrackingEventSubscriber } from './subscribers/tracking-event.subscriber';
import { Delivery } from '../deliveries/entities/delivery.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tracking, TrackingEvent, Delivery]),
    RedisModule,
    RateLimitModule,
  ],
  controllers: [TrackingController, TrackingEventsController, PublicTrackingController],
  providers: [
    TrackingService,
    TrackingEventsService,
    TrackingCalculationService,
    TrackingCacheService,
    TrackingHistoryService,
    TrackingEventSubscriber,
  ],
  exports: [
    TrackingService,
    TrackingEventsService,
    TrackingCalculationService,
    TrackingCacheService,
    TrackingHistoryService,
    TypeOrmModule,
  ],
})
export class TrackingModule {}
