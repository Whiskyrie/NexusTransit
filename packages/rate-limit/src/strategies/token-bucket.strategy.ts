import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "@nexus/redis";
import type {
  IRateLimitStrategy,
  RateLimitRequest,
  RateLimitRuleConfig,
} from "../interfaces/rate-limit-strategy.interface";
import type { RateLimitResult } from "../interfaces/rate-limit.interface";

/**
 * Token Bucket Rate Limiting Strategy
 *
 * Implements the token bucket algorithm using Redis hash storage.
 * Allows burst traffic while maintaining average rate over time.
 *
 * Algorithm:
 * 1. Calculate tokens to add based on time elapsed since last refill
 * 2. Refill bucket up to maximum capacity
 * 3. If at least 1 token available, consume it and allow request
 * 4. Otherwise, calculate when next token will be available
 *
 * Benefits:
 * - Allows traffic bursts up to bucket capacity
 * - Smooth rate limiting over time
 * - Better user experience than strict fixed windows
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1) per key
 */
@Injectable()
export class TokenBucketStrategy implements IRateLimitStrategy {
  private readonly logger = new Logger(TokenBucketStrategy.name);
  private readonly strategyName = "TOKEN_BUCKET";

  constructor(private readonly redisService: RedisService) {}

  getName(): string {
    return this.strategyName;
  }

  async checkLimit(request: RateLimitRequest, rule: RateLimitRuleConfig): Promise<RateLimitResult> {
    const key = this.generateKey(request, rule);
    const now = Date.now();

    // Default refill rate: limit per window
    // Example: 100 requests per 60000ms = 1.67 tokens/second
    const refillRate = rule.refillRate ?? rule.limit / (rule.windowSize / 1000);

    try {
      const redis = this.redisService.getRedisClient();

      if (!redis) {
        this.logger.warn("Redis client not available, failing open");
        return this.failOpen(rule, now);
      }

      // Get current bucket state from Redis
      const bucketData: Record<string, string> = (await redis.hGetAll(key)) || {};

      let tokens = bucketData.tokens ? parseFloat(bucketData.tokens) : rule.limit;
      let lastRefill = bucketData.lastRefill ? parseInt(bucketData.lastRefill, 10) : now;

      // Calculate tokens to add based on time elapsed
      const timeElapsed = now - lastRefill;
      const tokensToAdd = (timeElapsed / 1000) * refillRate;

      if (tokensToAdd > 0) {
        // Refill tokens up to bucket capacity
        tokens = Math.min(rule.limit, tokens + tokensToAdd);
        lastRefill = now;
      }

      // Check if we have at least 1 token
      if (tokens < 1) {
        // Calculate when next token will be available
        const timeToNextToken = ((1 - tokens) / refillRate) * 1000;
        const nextTokenTime = now + timeToNextToken;

        this.logger.debug(`Token bucket exhausted for key: ${key}`, {
          tokens: tokens.toFixed(2),
          nextTokenTime: new Date(nextTokenTime).toISOString(),
        });

        return {
          allowed: false,
          limit: rule.limit,
          current: Math.ceil(rule.limit - tokens),
          remaining: 0,
          resetTime: nextTokenTime,
        };
      }

      // Consume one token
      tokens -= 1;

      // Save updated bucket state to Redis
      await redis.hSet(key, ["tokens", tokens.toString(), "lastRefill", lastRefill.toString()]);

      // Set expiration for cleanup (2x window size for safety)
      const ttlSeconds = Math.ceil((rule.windowSize * 2) / 1000);
      await redis.expire(key, ttlSeconds);

      // Calculate when bucket will be full again
      const timeToFullBucket = ((rule.limit - tokens) / refillRate) * 1000;
      const resetTime = now + timeToFullBucket;

      this.logger.debug(`Request allowed for key: ${key}`, {
        tokensRemaining: tokens.toFixed(2),
        resetTime: new Date(resetTime).toISOString(),
      });

      return {
        allowed: true,
        limit: rule.limit,
        current: Math.ceil(rule.limit - tokens),
        remaining: Math.floor(tokens),
        resetTime,
      };
    } catch (error) {
      this.logger.error("Token bucket rate limit check failed", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      return this.failOpen(rule, now);
    }
  }

  generateKey(request: RateLimitRequest, rule: RateLimitRuleConfig): string {
    const parts = ["rate_limit", "token_bucket", rule.type];

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
        this.logger.log(`Token bucket reset for key: ${key}`);
      }
    } catch (error) {
      this.logger.error("Failed to reset token bucket", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Fail open strategy - allow request when Redis is unavailable
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
