import type { RateLimitResult } from "./rate-limit.interface";

/**
 * Request information for rate limiting
 */
export interface RateLimitRequest {
  /** Client IP address */
  ip: string;

  /** User ID (if authenticated) */
  userId?: string;

  /** API Key ID (if using API key authentication) */
  apiKeyId?: string;

  /** HTTP endpoint being accessed */
  endpoint: string;

  /** Unique client identifier (hash of IP + user agent) */
  clientId: string;

  /** User agent string */
  userAgent?: string;
}

/**
 * Configuration for rate limit rules
 */
export interface RateLimitRuleConfig {
  /** Unique identifier for the rule */
  id: string;

  /** Type of rate limiting (IP, USER, API_KEY, ENDPOINT, GLOBAL) */
  type: string;

  /** Maximum number of requests allowed */
  limit: number;

  /** Time window in milliseconds */
  windowSize: number;

  /** Strategy to use (SLIDING_WINDOW, TOKEN_BUCKET, FIXED_WINDOW) */
  strategy: string;

  /** Priority of the rule (lower number = higher priority) */
  priority: number;

  /** Token refill rate (for TOKEN_BUCKET strategy) */
  refillRate?: number;

  /** Role ID (for role-based limiting) */
  roleId?: string;

  /** Specific endpoint (for endpoint-based limiting) */
  endpoint?: string;

  /** API Key ID (for API key limiting) */
  apiKeyId?: string;

  /** Whether the rule is active */
  isActive: boolean;
}

/**
 * Base interface for all rate limiting strategies
 *
 * Each strategy must implement this interface to be compatible
 * with the rate limiting system.
 */
export interface IRateLimitStrategy {
  /**
   * Get the name of the strategy
   */
  getName(): string;

  /**
   * Check if the request is within rate limits
   *
   * @param request - Request information
   * @param rule - Rule configuration
   * @returns Promise with rate limit result
   */
  checkLimit(request: RateLimitRequest, rule: RateLimitRuleConfig): Promise<RateLimitResult>;

  /**
   * Generate a unique key for storing rate limit data
   *
   * @param request - Request information
   * @param rule - Rule configuration
   * @returns Unique key string
   */
  generateKey(request: RateLimitRequest, rule: RateLimitRuleConfig): string;

  /**
   * Reset rate limit for a specific key
   *
   * @param key - The rate limit key to reset
   * @returns Promise that resolves when reset is complete
   */
  reset(key: string): Promise<void>;
}

/**
 * Strategy type enum for identifying different strategies
 */
export enum RateLimitStrategyType {
  SLIDING_WINDOW = "SLIDING_WINDOW",
  TOKEN_BUCKET = "TOKEN_BUCKET",
  FIXED_WINDOW = "FIXED_WINDOW",
}
