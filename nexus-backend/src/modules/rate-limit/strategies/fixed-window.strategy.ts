import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import type {
  IRateLimitStrategy,
  RateLimitRequest,
  RateLimitRuleConfig,
} from '../interfaces/rate-limit-strategy.interface';
import type { RateLimitResult } from '../interfaces/rate-limit.interface';

/**
 * Fixed Window Rate Limiting Strategy
 *
 * Uses Redis string with INCR and EXPIRE for simple counter-based limiting.
 * Divides time into fixed windows and resets counter at window boundaries.
 *
 * Algorithm:
 * 1. Calculate current window timestamp (floor to window size)
 * 2. Increment counter for current window
 * 3. Set TTL if first request in window
 * 4. Compare counter against limit
 *
 * Benefits:
 * - Very simple and memory efficient
 * - Fast operations (O(1))
 * - Predictable behavior
 *
 * Drawbacks:
 * - Can allow 2x limit at window boundaries
 * - Less accurate than sliding window
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1) per key
 */
@Injectable()
export class FixedWindowStrategy implements IRateLimitStrategy {
  private readonly logger = new Logger(FixedWindowStrategy.name);
  private readonly strategyName = 'FIXED_WINDOW';

  constructor(private readonly redisService: RedisService) {}

  getName(): string {
    return this.strategyName;
  }

  async checkLimit(request: RateLimitRequest, rule: RateLimitRuleConfig): Promise<RateLimitResult> {
    const key = this.generateKey(request, rule);
    const now = Date.now();

    // Calculate current window start time
    const windowStart = Math.floor(now / rule.windowSize) * rule.windowSize;
    const windowEnd = windowStart + rule.windowSize;
    const keyWithWindow = `${key}:${windowStart}`;

    try {
      const redis = this.redisService.getRedisClient();

      if (!redis) {
        this.logger.warn('Redis client not available, failing open');
        return this.failOpen(rule, windowEnd);
      }

      // Get current counter value
      const currentStr = await redis.get(keyWithWindow);
      const current = currentStr ? parseInt(currentStr, 10) : 0;

      // Check if limit is exceeded
      if (current >= rule.limit) {
        this.logger.debug(`Fixed window limit exceeded for key: ${keyWithWindow}`, {
          current,
          limit: rule.limit,
          windowEnd: new Date(windowEnd).toISOString(),
        });

        return {
          allowed: false,
          limit: rule.limit,
          current,
          remaining: 0,
          resetTime: windowEnd,
        };
      }

      // Increment counter
      const newCount = await redis.incr(keyWithWindow);

      // Set expiration on first request in window
      if (newCount === 1) {
        const ttlSeconds = Math.ceil(rule.windowSize / 1000);
        await redis.expire(keyWithWindow, ttlSeconds);
      }

      const remaining = rule.limit - newCount;

      this.logger.debug(`Request allowed for key: ${keyWithWindow}`, {
        current: newCount,
        remaining,
        resetTime: new Date(windowEnd).toISOString(),
      });

      return {
        allowed: true,
        limit: rule.limit,
        current: newCount,
        remaining,
        resetTime: windowEnd,
      };
    } catch (error) {
      this.logger.error('Fixed window rate limit check failed', {
        key: keyWithWindow,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return this.failOpen(rule, windowEnd);
    }
  }

  generateKey(request: RateLimitRequest, rule: RateLimitRuleConfig): string {
    const parts = ['rate_limit', 'fixed_window', rule.type];

    switch (rule.type) {
      case 'IP':
        parts.push(request.ip);
        break;
      case 'USER':
        parts.push(request.userId ?? request.ip);
        break;
      case 'API_KEY':
        parts.push(request.apiKeyId ?? request.ip);
        break;
      case 'ENDPOINT':
        parts.push(`${request.ip}:${request.endpoint}`);
        break;
      case 'GLOBAL':
        parts.push(request.endpoint);
        break;
      default:
        parts.push(request.clientId);
    }

    parts.push(rule.id);

    return parts.join(':');
  }

  async reset(key: string): Promise<void> {
    try {
      const redis = this.redisService.getRedisClient();
      if (redis) {
        // Find all keys matching the pattern (with different window timestamps)
        const pattern = `${key}:*`;
        const keys = await redis.keys(pattern);

        if (keys.length > 0) {
          await redis.del(keys);
          this.logger.log(`Fixed window reset for keys: ${keys.length} keys deleted`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to reset fixed window', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Fail open strategy - allow request when Redis is unavailable
   */
  private failOpen(rule: RateLimitRuleConfig, resetTime: number): RateLimitResult {
    return {
      allowed: true,
      limit: rule.limit,
      current: 0,
      remaining: rule.limit,
      resetTime,
    };
  }
}
