import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "@nexus/redis";
import type {
  IRateLimitStrategy,
  RateLimitRequest,
  RateLimitRuleConfig,
} from "../interfaces/rate-limit-strategy.interface";
import type { RateLimitResult } from "../interfaces/rate-limit.interface";

/**
 * Sliding Window Rate Limiting Strategy
 *
 * Uses Redis sorted sets to implement a sliding time window.
 * More accurate than fixed window but requires more memory.
 *
 * Algorithm:
 * 1. Remove expired entries outside the current window
 * 2. Count remaining entries
 * 3. If under limit, add new entry with current timestamp
 * 4. Return result with remaining quota
 *
 * Time Complexity: O(log N + M) where N is entries in window, M is expired entries
 * Space Complexity: O(N) where N is the limit
 */
@Injectable()
export class SlidingWindowStrategy implements IRateLimitStrategy {
  private readonly logger = new Logger(SlidingWindowStrategy.name);
  private readonly strategyName = "SLIDING_WINDOW";

  constructor(private readonly redisService: RedisService) {}

  getName(): string {
    return this.strategyName;
  }

  async checkLimit(request: RateLimitRequest, rule: RateLimitRuleConfig): Promise<RateLimitResult> {
    const key = this.generateKey(request, rule);
    const now = Date.now();
    const windowStart = now - rule.windowSize;

    try {
      // Get Redis client through RedisService
      const redis = this.redisService.getRedisClient();

      if (!redis) {
        this.logger.warn("Redis client not available, failing open");
        return this.failOpen(rule, now);
      }

      // Remove expired entries outside the sliding window
      await redis.zRemRangeByScore(key, 0, windowStart);

      // Get current count of requests in window
      const currentCount = await redis.zCard(key);

      // Check if limit is exceeded
      if (currentCount >= rule.limit) {
        // Get oldest entry to calculate reset time
        const oldestEntries = await redis.zRangeWithScores(key, 0, 0);
        const oldestTimestamp =
          oldestEntries.length > 0 && oldestEntries[0] ? oldestEntries[0].score : now;
        const resetTime = oldestTimestamp + rule.windowSize;

        this.logger.debug(`Rate limit exceeded for key: ${key}`, {
          currentCount,
          limit: rule.limit,
          resetTime: new Date(resetTime).toISOString(),
        });

        return {
          allowed: false,
          limit: rule.limit,
          current: currentCount,
          remaining: 0,
          resetTime,
        };
      }

      // Add current request to the sorted set with timestamp as score
      const requestId = `${now}-${Math.random().toString(36).substring(7)}`;
      await redis.zAdd(key, { score: now, value: requestId });

      // Set expiration on the key (cleanup)
      const ttlSeconds = Math.ceil(rule.windowSize / 1000);
      await redis.expire(key, ttlSeconds);

      const remaining = rule.limit - currentCount - 1;
      const resetTime = now + rule.windowSize;

      this.logger.debug(`Request allowed for key: ${key}`, {
        currentCount: currentCount + 1,
        remaining,
        resetTime: new Date(resetTime).toISOString(),
      });

      return {
        allowed: true,
        limit: rule.limit,
        current: currentCount + 1,
        remaining,
        resetTime,
      };
    } catch (error) {
      this.logger.error("Sliding window rate limit check failed", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Fail open - allow request if Redis fails
      return this.failOpen(rule, now);
    }
  }

  generateKey(request: RateLimitRequest, rule: RateLimitRuleConfig): string {
    const parts = ["rate_limit", "sliding_window", rule.type];

    switch (rule.type) {
      case "IP":
        parts.push(request.ip);
        break;
      case "USER":
        parts.push(request.userId ?? request.ip);
        break;
      case "API_KEY":
        parts.push(request.apiKeyId ?? request.ip);
        break;
      case "ENDPOINT":
        parts.push(`${request.ip}:${request.endpoint}`);
        break;
      case "GLOBAL":
        parts.push(request.endpoint);
        break;
      default:
        parts.push(request.clientId);
    }

    parts.push(rule.id);

    return parts.join(":");
  }

  async reset(key: string): Promise<void> {
    try {
      const redis = this.redisService.getRedisClient();
      if (redis) {
        await redis.del(key);
        this.logger.log(`Rate limit reset for key: ${key}`);
      }
    } catch (error) {
      this.logger.error("Failed to reset rate limit", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Fail open strategy - allow request when Redis is unavailable
   * This prevents service disruption but temporarily disables rate limiting
   */
  private failOpen(rule: RateLimitRuleConfig, now: number): RateLimitResult {
    return {
      allowed: true,
      limit: rule.limit,
      current: 0,
      remaining: rule.limit,
      resetTime: now + rule.windowSize,
    };
  }
}
