import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from '../redis/redis.module';
import { RateLimitService } from './services/rate-limit.service';
import { BlacklistService } from './services/blacklist.service';
import { MonitoringService } from './services/monitoring.service';
import { AlertService } from './services/alert.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { RateLimitController } from './rate-limit.controller';
import { RateLimitRule } from './entities/rate-limit-rule.entity';
import { QuotaUsage } from './entities/quota-usage.entity';
import { SlidingWindowStrategy } from './strategies/sliding-window.strategy';
import { TokenBucketStrategy } from './strategies/token-bucket.strategy';
import { FixedWindowStrategy } from './strategies/fixed-window.strategy';
import { AbuseDetectionProcessor } from './processors/abuse-detection.processor';

/**
 * Rate Limiting Module
 *
 * Provides comprehensive rate limiting with:
 * - Multiple strategies (Sliding Window, Token Bucket, Fixed Window)
 * - Configurable database-backed rules
 * - Whitelist/Blacklist management
 * - Violation tracking and auto-blocking
 * - Role-based quota management
 * - Real-time monitoring and alerts
 * - Automatic abuse detection and blocking
 */
@Module({
  imports: [
    RedisModule,
    TypeOrmModule.forFeature([RateLimitRule, QuotaUsage]),
    ScheduleModule.forRoot(),
  ],
  controllers: [RateLimitController],
  providers: [
    // Services
    RateLimitService,
    BlacklistService,
    MonitoringService,
    AlertService,

    // Strategies
    SlidingWindowStrategy,
    TokenBucketStrategy,
    FixedWindowStrategy,

    // Processors
    AbuseDetectionProcessor,

    // Guards
    RateLimitGuard,
  ],
  exports: [
    RateLimitService,
    BlacklistService,
    MonitoringService,
    AlertService,
    RateLimitGuard,
    AbuseDetectionProcessor,
  ],
})
export class RateLimitModule {}
