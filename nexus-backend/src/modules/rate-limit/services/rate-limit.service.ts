import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { RateLimitResult } from '../interfaces/rate-limit.interface';

interface RateLimitEntry {
  requests: number[];
  lastReset: number;
}

/**
 * Service for managing rate limiting using Redis (Keyv)
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Check if request is within rate limit
   */
  async checkLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get current data or create new entry
      const entry = (await this.redisService.get<RateLimitEntry>(key)) ?? {
        requests: [],
        lastReset: now,
      };

      // Clean expired requests
      entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);

      // Check if limit exceeded
      const currentCount = entry.requests.length;
      const allowed = currentCount < limit;

      if (allowed) {
        // Add current request
        entry.requests.push(now);

        // Save updated entry with TTL
        await this.redisService.set(key, entry, Math.ceil(windowMs / 1000));
      }

      const remaining = Math.max(0, limit - currentCount - (allowed ? 1 : 0));
      const resetTime = now + windowMs;

      return {
        allowed,
        limit,
        current: currentCount + (allowed ? 1 : 0),
        remaining,
        resetTime,
      };
    } catch (error) {
      this.logger.error('Rate limit check failed', {
        key,
        limit,
        windowMs,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        limit,
        current: 0,
        remaining: limit,
        resetTime: Date.now() + windowMs,
      };
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  async resetLimit(key: string): Promise<void> {
    try {
      await this.redisService.delete(key);
      this.logger.log(`Rate limit reset for key: ${key}`);
    } catch (error) {
      this.logger.error('Failed to reset rate limit', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get current rate limit status
   */
  async getLimitStatus(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const windowStart = now - windowMs;

      const entry = await this.redisService.get<RateLimitEntry>(key);

      if (!entry) {
        return {
          allowed: true,
          limit,
          current: 0,
          remaining: limit,
          resetTime: now + windowMs,
        };
      }

      // Clean expired requests
      const validRequests = entry.requests.filter(timestamp => timestamp > windowStart);
      const currentCount = validRequests.length;
      const remaining = Math.max(0, limit - currentCount);
      const resetTime = now + windowMs;

      return {
        allowed: currentCount < limit,
        limit,
        current: currentCount,
        remaining,
        resetTime,
      };
    } catch (error) {
      this.logger.error('Failed to get rate limit status', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        allowed: true,
        limit,
        current: 0,
        remaining: limit,
        resetTime: Date.now() + windowMs,
      };
    }
  }

  /**
   * Clean up expired rate limit entries
   */
  cleanup(): void {
    // Keyv handles TTL automatically, so no manual cleanup needed
    this.logger.log('Rate limit cleanup not needed with Keyv TTL');
  }
}
