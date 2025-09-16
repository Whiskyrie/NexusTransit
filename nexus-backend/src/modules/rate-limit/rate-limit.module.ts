import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { RateLimitService } from './services/rate-limit.service';
import { RateLimitGuard } from './guards/rate-limit.guard';

/**
 * Rate Limiting Module
 * Provides role-based rate limiting with Redis storage
 */
@Module({
  imports: [RedisModule],
  providers: [RateLimitService, RateLimitGuard],
  exports: [RateLimitService, RateLimitGuard],
})
export class RateLimitModule {}
