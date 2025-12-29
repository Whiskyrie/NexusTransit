import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request, Response } from "express";
import { Role } from "@nexus/auth";
import { RATE_LIMIT_KEY } from "../decorators/rate-limit.decorator";
import { RateLimitType } from "../enums/rate-limit-type.enum";
import { RateLimitService } from "../services/rate-limit.service";
import { BlacklistService } from "../services/blacklist.service";
import type { RateLimitConfig, RateLimitResult } from "../interfaces/rate-limit.interface";

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
  userRole?: Role | "guest";
}

const ROLE_LIMITS_GUEST = 20;

const ROLE_LIMITS_BY_ROLE: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 1000,
  [Role.ADMIN]: 1000,
  [Role.MANAGER]: 800,
  [Role.GESTOR]: 800,
  [Role.OPERATOR]: 600,
  [Role.DESPACHANTE]: 600,
  [Role.DRIVER]: 400,
  [Role.MOTORISTA]: 400,
  [Role.CUSTOMER]: 100,
  [Role.CLIENTE]: 100,
};

function normalizeRole(role?: string): Role | "guest" {
  if (!role) return "guest";
  const normalized = role.trim().toLowerCase();

  switch (normalized) {
    case "super_admin":
      return Role.SUPER_ADMIN;
    case "admin":
      return Role.ADMIN;
    case "manager":
      return Role.MANAGER;
    case "gestor":
      return Role.GESTOR;
    case "operator":
      return Role.OPERATOR;
    case "despachante":
      return Role.DESPACHANTE;
    case "driver":
      return Role.DRIVER;
    case "motorista":
      return Role.MOTORISTA;
    case "customer":
      return Role.CUSTOMER;
    case "cliente":
      return Role.CLIENTE;
    default:
      return "guest";
  }
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
    private readonly blacklistService: BlacklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Bypass health checks, metrics, and docs endpoints
    if (this.isWhitelistedPath(request.path)) {
      this.logger.debug("Path is whitelisted, bypassing rate limit", { path: request.path });
      return true;
    }

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
    const normalizedRole = normalizeRole(userRole);

    try {
      // Check if IP is whitelisted (bypass all checks)
      if (await this.blacklistService.isWhitelisted(clientIp, "IP")) {
        this.logger.debug("IP is whitelisted, bypassing rate limit", { ip: clientIp });
        return true;
      }

      // Check if user is whitelisted
      if (userId && (await this.blacklistService.isWhitelisted(userId, "USER"))) {
        this.logger.debug("User is whitelisted, bypassing rate limit", { userId });
        return true;
      }

      // Check if IP is blacklisted
      if (await this.blacklistService.isBlacklisted(clientIp, "IP")) {
        this.logger.warn("IP is blacklisted", { ip: clientIp });
        throw new HttpException(
          {
            message: "Access denied",
            error: "Forbidden",
            statusCode: HttpStatus.FORBIDDEN,
            reason: "IP address is blacklisted",
          },
          HttpStatus.FORBIDDEN,
        );
      }

      // Check if user is blacklisted
      if (userId && (await this.blacklistService.isBlacklisted(userId, "USER"))) {
        this.logger.warn("User is blacklisted", { userId });
        throw new HttpException(
          {
            message: "Access denied",
            error: "Forbidden",
            statusCode: HttpStatus.FORBIDDEN,
            reason: "User account is blacklisted",
          },
          HttpStatus.FORBIDDEN,
        );
      }

      const endpoint = `${request.method} ${(request.route as { path?: string } | undefined)?.path ?? request.path}`;

      const rateLimitContext: RateLimitContext = {
        ip: clientIp,
        endpoint,
      };

      if (userId) {
        rateLimitContext.userId = userId;
      }
      if (normalizedRole) {
        rateLimitContext.userRole = normalizedRole;
      }

      const result = await this.checkRateLimit(rateLimitConfig, rateLimitContext);

      if (!result.allowed) {
        // Record violation for potential auto-blacklisting
        const violationType = userId ? "USER" : "IP";
        await this.blacklistService.recordViolation(userId ?? clientIp, violationType);

        this.logger.warn(`Rate limit exceeded for ${rateLimitConfig.type}`, {
          ip: clientIp,
          userId,
          userRole: normalizedRole,
          endpoint,
          limit: result.limit,
          current: result.current,
          resetTime: result.resetTime,
        });

        throw new HttpException(
          {
            message: "Rate limit exceeded",
            error: "Too Many Requests",
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Set rate limit headers
      const response = context.switchToHttp().getResponse<Response>();
      response.setHeader("X-RateLimit-Limit", result.limit.toString());
      response.setHeader("X-RateLimit-Remaining", result.remaining.toString());
      response.setHeader("X-RateLimit-Reset", Math.ceil(result.resetTime / 1000).toString());

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error("Rate limiting error", error);
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
    const role = context.userRole ?? "guest";
    let limit: number;
    const windowMs = config.windowMs ?? 60000;

    // Use role overrides if provided
    if (config.roleOverrides && config.roleOverrides[role]) {
      limit = config.roleOverrides[role].limit;
    } else {
      const isGuest = role === "guest";
      limit = isGuest ? ROLE_LIMITS_GUEST : (ROLE_LIMITS_BY_ROLE[role] ?? ROLE_LIMITS_GUEST);
    }

    const key = `rate_limit:role:${role}:${context.userId ?? context.ip}:${context.endpoint}`;
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
    const forwarded = request.headers["x-forwarded-for"] as string;
    const realIp = request.headers["x-real-ip"] as string;
    const clientIp = request.headers["x-client-ip"] as string;

    if (forwarded) {
      return forwarded.split(",")[0]?.trim() ?? "127.0.0.1";
    }

    return realIp ?? clientIp ?? request.socket.remoteAddress ?? "127.0.0.1";
  }

  /**
   * Check if path should bypass rate limiting
   * Health checks, metrics, and documentation endpoints are automatically whitelisted
   */
  private isWhitelistedPath(path: string): boolean {
    const whitelistedPaths = [
      "/health",
      "/metrics",
      "/api/docs",
      "/api-docs",
      "/swagger",
      "/api/health",
    ];

    return whitelistedPaths.some((whitePath) => path.startsWith(whitePath));
  }
}
