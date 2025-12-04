import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { RedisService } from '../../redis/redis.service';
import { RateLimitResult } from '../interfaces/rate-limit.interface';
import type {
  IRateLimitStrategy,
  RateLimitRequest,
  RateLimitRuleConfig,
} from '../interfaces/rate-limit-strategy.interface';
import { RateLimitRule } from '../entities/rate-limit-rule.entity';
import { QuotaUsage } from '../entities/quota-usage.entity';
import { SlidingWindowStrategy } from '../strategies/sliding-window.strategy';
import { TokenBucketStrategy } from '../strategies/token-bucket.strategy';
import { FixedWindowStrategy } from '../strategies/fixed-window.strategy';
import { CreateRuleDto } from '../dto/create-rule.dto';
import { UpdateRuleDto } from '../dto/update-rule.dto';
import { RuleFilterDto } from '../dto/rule-filter.dto';
import { RuleResponseDto } from '../dto/rule-response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

interface RateLimitEntry {
  requests: number[];
  lastReset: number;
}

/**
 * Advanced Rate Limiting Service
 *
 * Provides comprehensive rate limiting with multiple strategies,
 * configurable rules, violation tracking, and abuse detection.
 *
 * Features:
 * - Multiple rate limiting strategies (Sliding Window, Token Bucket, Fixed Window)
 * - Database-backed configurable rules
 * - Violation logging and analytics
 * - Graceful degradation when Redis is unavailable
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly strategies: Map<string, IRateLimitStrategy>;

  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(RateLimitRule)
    private readonly ruleRepository: Repository<RateLimitRule>,
    @InjectRepository(QuotaUsage)
    private readonly usageRepository: Repository<QuotaUsage>,
    private readonly slidingWindowStrategy: SlidingWindowStrategy,
    private readonly tokenBucketStrategy: TokenBucketStrategy,
    private readonly fixedWindowStrategy: FixedWindowStrategy,
  ) {
    // Initialize strategies map
    this.strategies = new Map<string, IRateLimitStrategy>();
    this.strategies.set('SLIDING_WINDOW', this.slidingWindowStrategy);
    this.strategies.set('TOKEN_BUCKET', this.tokenBucketStrategy);
    this.strategies.set('FIXED_WINDOW', this.fixedWindowStrategy);
  }

  /**
   * Check rate limit using configured rules and strategies
   *
   * @param request - Request information
   * @returns Rate limit result
   */
  async checkRateLimit(request: RateLimitRequest): Promise<RateLimitResult> {
    try {
      // Get applicable rules for this request
      const rules = await this.getApplicableRules(request);

      if (rules.length === 0) {
        this.logger.warn('No rate limit rules found, using default');
        return this.getDefaultRateLimitResult();
      }

      // Apply rules in order of priority (lower number = higher priority)
      for (const rule of rules) {
        const strategy = this.getStrategy(rule.strategy);

        if (!strategy) {
          this.logger.error(`Strategy not found: ${rule.strategy}`);
          continue;
        }

        // Convert rule to config format
        const ruleConfig: RateLimitRuleConfig = {
          id: rule.id,
          type: rule.type,
          limit: rule.limit,
          windowSize: rule.window_size,
          strategy: rule.strategy,
          priority: rule.priority,
          ...(rule.refill_rate !== null && rule.refill_rate !== undefined
            ? { refillRate: rule.refill_rate }
            : {}),
          ...(rule.role_id ? { roleId: rule.role_id } : {}),
          ...(rule.endpoint ? { endpoint: rule.endpoint } : {}),
          ...(rule.api_key_id ? { apiKeyId: rule.api_key_id } : {}),
          isActive: rule.is_active,
        };

        const result = await strategy.checkLimit(request, ruleConfig);

        // Record usage for analytics
        this.recordUsage(request, rule, result);

        if (!result.allowed) {
          // Log violation
          this.logViolation(request, rule, result);
          return result;
        }
      }

      // All checks passed
      return {
        allowed: true,
        limit: rules[0]?.limit ?? 100,
        current: 0,
        remaining: rules[0]?.limit ?? 100,
        resetTime: Date.now() + (rules[0]?.window_size ?? 60000),
      };
    } catch (error) {
      this.logger.error('Rate limit check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Fail open
      return this.getDefaultRateLimitResult();
    }
  }

  /**
   * Get applicable rules for a request
   *
   * Rules are returned in priority order (lower number = higher priority)
   */
  private async getApplicableRules(request: RateLimitRequest): Promise<RateLimitRule[]> {
    const rules: RateLimitRule[] = [];

    try {
      // Get all active rules
      const allRules = await this.ruleRepository.find({
        where: { is_active: true },
        order: { priority: 'ASC' },
      });

      for (const rule of allRules) {
        // Check if rule applies to this request
        if (this.doesRuleApply(rule, request)) {
          rules.push(rule);
        }
      }

      return rules;
    } catch (error) {
      this.logger.error('Failed to get applicable rules', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Check if a rule applies to a request
   */
  private doesRuleApply(rule: RateLimitRule, request: RateLimitRequest): boolean {
    switch (rule.type) {
      case 'GLOBAL':
        return true;

      case 'IP':
        return !!request.ip;

      case 'USER':
        return !!request.userId;

      case 'API_KEY':
        return !!request.apiKeyId && rule.api_key_id === request.apiKeyId;

      case 'ENDPOINT':
        if (!rule.endpoint) {
          return false;
        }
        // Simple pattern matching (can be enhanced with regex)
        return request.endpoint.includes(rule.endpoint);

      default:
        return false;
    }
  }

  /**
   * Get strategy by type
   */
  private getStrategy(strategyType: string): IRateLimitStrategy | undefined {
    return this.strategies.get(strategyType);
  }

  /**
   * Record usage for analytics (async, non-blocking)
   */
  private recordUsage(
    request: RateLimitRequest,
    rule: RateLimitRule,
    result: RateLimitResult,
  ): void {
    try {
      // Extract method from endpoint (e.g., "GET /api/users" -> "GET")
      const method = request.endpoint.split(' ')[0] ?? 'UNKNOWN';

      const usageData: Partial<QuotaUsage> = {
        client_id: request.clientId,
        ip: request.ip,
        endpoint: request.endpoint,
        method,
        rule_id: rule.id,
        requests_count: result.current,
        limit: result.limit,
        blocked: !result.allowed,
        request_time: new Date(),
      };

      // Add optional fields only if defined
      if (request.userId) {
        usageData.user_id = request.userId;
      }
      if (request.apiKeyId) {
        usageData.api_key_id = request.apiKeyId;
      }
      if (request.userAgent) {
        usageData.user_agent = request.userAgent;
      }

      const usage = this.usageRepository.create(usageData);

      // Save asynchronously without blocking
      setImmediate(() => {
        this.usageRepository.save(usage).catch(error => {
          this.logger.error('Failed to record usage', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
      });
    } catch (error) {
      this.logger.error('Failed to prepare usage record', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Log rate limit violation
   */
  private logViolation(
    request: RateLimitRequest,
    rule: RateLimitRule,
    result: RateLimitResult,
  ): void {
    this.logger.warn('Rate limit exceeded', {
      clientId: request.clientId,
      ip: request.ip,
      userId: request.userId,
      endpoint: request.endpoint,
      ruleType: rule.type,
      ruleStrategy: rule.strategy,
      limit: result.limit,
      current: result.current,
      resetTime: new Date(result.resetTime).toISOString(),
    });
  }

  /**
   * Get default rate limit result (fail open)
   */
  private getDefaultRateLimitResult(): RateLimitResult {
    return {
      allowed: true,
      limit: 100,
      current: 0,
      remaining: 100,
      resetTime: Date.now() + 60000,
    };
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use checkRateLimit instead
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

  /**
   * Create a new rate limit rule
   */
  async createRule(createDto: CreateRuleDto): Promise<RuleResponseDto> {
    // Validate strategy exists
    if (!this.strategies.has(createDto.strategy)) {
      throw new BadRequestException(`Invalid strategy: ${createDto.strategy}`);
    }

    const ruleData: Partial<RateLimitRule> = {
      type: createDto.type,
      limit: createDto.limit,
      window_size: createDto.window_size,
      strategy: createDto.strategy,
      priority: createDto.priority,
      is_active: createDto.is_active ?? true,
    };

    // Add optional fields only if defined
    if (createDto.refill_rate !== null && createDto.refill_rate !== undefined) {
      ruleData.refill_rate = createDto.refill_rate;
    }
    if (createDto.role_id) {
      ruleData.role_id = createDto.role_id;
    }
    if (createDto.endpoint) {
      ruleData.endpoint = createDto.endpoint;
    }
    if (createDto.api_key_id) {
      ruleData.api_key_id = createDto.api_key_id;
    }
    if (createDto.description) {
      ruleData.description = createDto.description;
    }

    const rule = this.ruleRepository.create(ruleData);
    const saved = await this.ruleRepository.save(rule);

    this.logger.log(`Rate limit rule created: ${saved.id}`);

    return this.mapRuleToResponseDto(saved);
  }

  /**
   * Find all rate limit rules with filters and pagination
   */
  async findAllRules(filterDto: RuleFilterDto): Promise<PaginatedResponseDto<RuleResponseDto>> {
    const { page = 1, limit = 10, search, type, strategy, is_active } = filterDto;

    const where: FindOptionsWhere<RateLimitRule> = {};

    if (search) {
      where.description = ILike(`%${search}%`);
    }

    if (type) {
      where.type = type;
    }

    if (strategy) {
      where.strategy = strategy;
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const [rules, total] = await this.ruleRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { priority: 'ASC', created_at: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: rules.map(r => this.mapRuleToResponseDto(r)),
      meta: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_previous: page > 1,
        has_next: page < totalPages,
      },
    };
  }

  /**
   * Find a single rate limit rule by ID
   */
  async findOneRule(id: string): Promise<RuleResponseDto> {
    const rule = await this.ruleRepository.findOne({ where: { id } });

    if (!rule) {
      throw new NotFoundException(`Rate limit rule with ID ${id} not found`);
    }

    return this.mapRuleToResponseDto(rule);
  }

  /**
   * Update a rate limit rule
   */
  async updateRule(id: string, updateDto: UpdateRuleDto): Promise<RuleResponseDto> {
    const rule = await this.ruleRepository.findOne({ where: { id } });

    if (!rule) {
      throw new NotFoundException(`Rate limit rule with ID ${id} not found`);
    }

    // Validate strategy if provided
    if (updateDto.strategy && !this.strategies.has(updateDto.strategy)) {
      throw new BadRequestException(`Invalid strategy: ${updateDto.strategy}`);
    }

    // Update fields
    if (updateDto.type !== undefined) {
      rule.type = updateDto.type;
    }
    if (updateDto.limit !== undefined) {
      rule.limit = updateDto.limit;
    }
    if (updateDto.window_size !== undefined) {
      rule.window_size = updateDto.window_size;
    }
    if (updateDto.strategy !== undefined) {
      rule.strategy = updateDto.strategy;
    }
    if (updateDto.priority !== undefined) {
      rule.priority = updateDto.priority;
    }
    if (updateDto.refill_rate !== undefined) {
      rule.refill_rate = updateDto.refill_rate;
    }
    if (updateDto.role_id !== undefined) {
      rule.role_id = updateDto.role_id;
    }
    if (updateDto.endpoint !== undefined) {
      rule.endpoint = updateDto.endpoint;
    }
    if (updateDto.api_key_id !== undefined) {
      rule.api_key_id = updateDto.api_key_id;
    }
    if (updateDto.description !== undefined) {
      rule.description = updateDto.description;
    }
    if (updateDto.is_active !== undefined) {
      rule.is_active = updateDto.is_active;
    }

    const updated = await this.ruleRepository.save(rule);
    this.logger.log(`Rate limit rule updated: ${id}`);

    return this.mapRuleToResponseDto(updated);
  }

  /**
   * Remove a rate limit rule (soft delete)
   */
  async removeRule(id: string): Promise<void> {
    const rule = await this.ruleRepository.findOne({ where: { id } });

    if (!rule) {
      throw new NotFoundException(`Rate limit rule with ID ${id} not found`);
    }

    await this.ruleRepository.softRemove(rule);
    this.logger.log(`Rate limit rule removed: ${id}`);
  }

  /**
   * Reset rate limit counter for a specific rule
   */
  async resetRuleCounter(id: string): Promise<void> {
    const rule = await this.ruleRepository.findOne({ where: { id } });

    if (!rule) {
      throw new NotFoundException(`Rate limit rule with ID ${id} not found`);
    }

    const strategy = this.strategies.get(rule.strategy);
    if (strategy) {
      // Generate pattern for all keys related to this rule
      const pattern = `rate_limit:*:${rule.type}:*:${id}`;
      // Note: In production, implement a more sophisticated key deletion
      this.logger.log(`Reset requested for rule ${id} with pattern: ${pattern}`);
    }
  }

  /**
   * Map RateLimitRule entity to response DTO
   */
  private mapRuleToResponseDto(rule: RateLimitRule): RuleResponseDto {
    const dto: RuleResponseDto = {
      id: rule.id,
      type: rule.type,
      limit: rule.limit,
      window_size: rule.window_size,
      strategy: rule.strategy,
      priority: rule.priority,
      is_active: rule.is_active,
      created_at: rule.created_at,
      updated_at: rule.updated_at,
    };

    // Add optional fields only if defined
    if (rule.refill_rate !== null && rule.refill_rate !== undefined) {
      dto.refill_rate = rule.refill_rate;
    }
    if (rule.role_id) {
      dto.role_id = rule.role_id;
    }
    if (rule.endpoint) {
      dto.endpoint = rule.endpoint;
    }
    if (rule.api_key_id) {
      dto.api_key_id = rule.api_key_id;
    }
    if (rule.description) {
      dto.description = rule.description;
    }

    return dto;
  }
}
