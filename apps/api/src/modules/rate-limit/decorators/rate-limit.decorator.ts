import { SetMetadata } from '@nestjs/common';
import { RateLimitType } from '../enums/rate-limit-type.enum';
import type { RoleLimits } from '../enums/role-limits.enum';

export const RATE_LIMIT_KEY = 'rate-limit';

/**
 * Rate limiting decorator with custom configuration
 */
export const RateLimit = (limit: number, windowMs = 60000): MethodDecorator => {
  return SetMetadata(RATE_LIMIT_KEY, {
    type: RateLimitType.GLOBAL,
    limit,
    windowMs,
  });
};

/**
 * Skip rate limiting for this route
 */
export const SkipRateLimit = (): MethodDecorator => {
  return SetMetadata(RATE_LIMIT_KEY, {
    skip: true,
  });
};

/**
 * Apply rate limiting based on user role
 */
export const RateLimitByRole = (
  roleOverrides?: Partial<Record<RoleLimits, { limit: number; windowMs?: number }>>,
): MethodDecorator => {
  return SetMetadata(RATE_LIMIT_KEY, {
    type: RateLimitType.BY_ROLE,
    roleOverrides,
  });
};

/**
 * Apply rate limiting by IP address only
 */
export const RateLimitByIP = (limit: number, windowMs = 60000): MethodDecorator => {
  return SetMetadata(RATE_LIMIT_KEY, {
    type: RateLimitType.BY_IP,
    limit,
    windowMs,
  });
};
