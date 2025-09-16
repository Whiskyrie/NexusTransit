import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';
import { RateLimitType } from '../enums/rate-limit-type.enum';
import { RoleLimits } from '../enums/role-limits.enum';
import { RateLimitService } from '../services/rate-limit.service';
import type { RateLimitConfig, RateLimitResult } from '../interfaces/rate-limit.interface';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

interface RateLimitContext {
  ip: string;
  endpoint: string;
  userId?: string;
  userRole?: string;
}

/**
 * Rate limiting guard using Redis for distributed rate limiting
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const rateLimitConfig = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    // Skip rate limiting if not configured or explicitly skipped
    if (!rateLimitConfig || rateLimitConfig.skip) {
      return true;
    }

    const clientIp = this.getClientIp(request);
    const userId = request.user?.id;
    const userRole = request.user?.role;

    try {
      const endpoint = `${request.method} ${(request.route as { path?: string } | undefined)?.path ?? request.path}`;

      const rateLimitContext: RateLimitContext = {
        ip: clientIp,
        endpoint,
      };

      if (userId) {
        rateLimitContext.userId = userId;
      }
      if (userRole) {
        rateLimitContext.userRole = userRole;
      }

      const result = await this.checkRateLimit(rateLimitConfig, rateLimitContext);

      if (!result.allowed) {
        this.logger.warn(`Rate limit exceeded for ${rateLimitConfig.type}`, {
          ip: clientIp,
          userId,
          userRole,
          endpoint,
          limit: result.limit,
          current: result.current,
          resetTime: result.resetTime,
        });

        throw new HttpException(
          {
            message: 'Rate limit exceeded',
            error: 'Too Many Requests',
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Set rate limit headers
      const response = context.switchToHttp().getResponse<Response>();
      response.setHeader('X-RateLimit-Limit', result.limit.toString());
      response.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Rate limiting error', error);
      // Allow request to proceed if rate limiting fails
      return true;
    }
  }

  private async checkRateLimit(
    config: RateLimitConfig,
    context: RateLimitContext,
  ): Promise<RateLimitResult> {
    switch (config.type) {
      case RateLimitType.BY_ROLE:
        return this.checkRoleBasedLimit(config, context);

      case RateLimitType.BY_IP:
        return this.checkIpBasedLimit(config, context);

      case RateLimitType.BY_USER:
        return this.checkUserBasedLimit(config, context);

      case RateLimitType.GLOBAL:
        return this.checkGlobalLimit(config, context);

      default:
        throw new Error(`Unknown rate limit type: ${String(config.type)}`);
    }
  }

  private async checkRoleBasedLimit(
    config: RateLimitConfig,
    context: RateLimitContext,
  ): Promise<RateLimitResult> {
    const role = context.userRole?.toUpperCase();
    let limit: number;
    const windowMs = config.windowMs ?? 60000;

    // Use role overrides if provided
    if (config.roleOverrides && role && config.roleOverrides[role]) {
      limit = config.roleOverrides[role].limit;
    } else {
      // Use default role limits
      switch (role) {
        case 'ADMIN':
          limit = RoleLimits.ADMIN;
          break;
        case 'GESTOR':
          limit = RoleLimits.GESTOR;
          break;
        case 'DESPACHANTE':
          limit = RoleLimits.DESPACHANTE;
          break;
        case 'MOTORISTA':
          limit = RoleLimits.MOTORISTA;
          break;
        case 'CLIENTE':
          limit = RoleLimits.CLIENTE;
          break;
        // Manter compatibilidade com nomes antigos
        case 'DRIVER':
          limit = RoleLimits.MOTORISTA;
          break;
        case 'CUSTOMER':
          limit = RoleLimits.CLIENTE;
          break;
        default:
          limit = RoleLimits.GUEST;
      }
    }

    const key = `rate_limit:role:${role ?? 'GUEST'}:${context.userId ?? context.ip}:${context.endpoint}`;
    return this.rateLimitService.checkLimit(key, limit, windowMs);
  }

  private async checkIpBasedLimit(
    config: RateLimitConfig,
    context: RateLimitContext,
  ): Promise<RateLimitResult> {
    const key = `rate_limit:ip:${context.ip}:${context.endpoint}`;
    return this.rateLimitService.checkLimit(key, config.limit ?? 100, config.windowMs ?? 60000);
  }

  private async checkUserBasedLimit(
    config: RateLimitConfig,
    context: RateLimitContext,
  ): Promise<RateLimitResult> {
    const identifier = context.userId ?? context.ip;
    const key = `rate_limit:user:${identifier}:${context.endpoint}`;
    return this.rateLimitService.checkLimit(key, config.limit ?? 100, config.windowMs ?? 60000);
  }

  private async checkGlobalLimit(
    config: RateLimitConfig,
    context: RateLimitContext,
  ): Promise<RateLimitResult> {
    const key = `rate_limit:global:${context.endpoint}`;
    return this.rateLimitService.checkLimit(key, config.limit ?? 1000, config.windowMs ?? 60000);
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;
    const clientIp = request.headers['x-client-ip'] as string;

    if (forwarded) {
      return forwarded.split(',')[0]?.trim() ?? '127.0.0.1';
    }

    return realIp ?? clientIp ?? request.socket.remoteAddress ?? '127.0.0.1';
  }
}
