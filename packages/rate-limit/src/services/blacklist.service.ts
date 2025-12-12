import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "@nexus/redis";

export type BlacklistType = "IP" | "USER" | "API_KEY";

export interface BlacklistEntry {
  identifier: string;
  type: BlacklistType;
  reason?: string | undefined;
  expiresAt?: Date | undefined;
  createdAt: Date;
  createdBy?: string | undefined;
}

/**
 * Blacklist/Whitelist Service
 *
 * Manages IP, User, and API Key blacklisting/whitelisting
 * using Redis for fast lookups and distributed coordination.
 */
@Injectable()
export class BlacklistService {
  private readonly logger = new Logger(BlacklistService.name);

  private readonly WHITELIST_PREFIX = "whitelist";
  private readonly BLACKLIST_PREFIX = "blacklist";
  private readonly BLACKLIST_INFO_PREFIX = "blacklist_info";

  constructor(private readonly redisService: RedisService) {}

  /**
   * Check if an identifier is whitelisted
   *
   * @param identifier - IP, User ID, or API Key
   * @param type - Type of identifier
   * @returns true if whitelisted
   */
  async isWhitelisted(identifier: string, type: BlacklistType): Promise<boolean> {
    try {
      const key = this.getWhitelistKey(identifier, type);
      const result = await this.redisService.get<string>(key);
      return result === "1";
    } catch (error) {
      this.logger.error("Failed to check whitelist", {
        identifier,
        type,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Check if an identifier is blacklisted
   *
   * @param identifier - IP, User ID, or API Key
   * @param type - Type of identifier
   * @returns true if blacklisted
   */
  async isBlacklisted(identifier: string, type: BlacklistType): Promise<boolean> {
    try {
      const key = this.getBlacklistKey(identifier, type);
      const result = await this.redisService.get<string>(key);
      return result === "1";
    } catch (error) {
      this.logger.error("Failed to check blacklist", {
        identifier,
        type,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Fail safe - don't block if Redis is down
      return false;
    }
  }

  /**
   * Add identifier to whitelist
   *
   * @param identifier - IP, User ID, or API Key
   * @param type - Type of identifier
   * @param permanent - If true, no expiration (default: true)
   * @param ttlSeconds - Time to live in seconds (if not permanent)
   */
  async addToWhitelist(
    identifier: string,
    type: BlacklistType,
    permanent = true,
    ttlSeconds?: number,
  ): Promise<void> {
    try {
      const key = this.getWhitelistKey(identifier, type);

      if (permanent || !ttlSeconds) {
        await this.redisService.set(key, "1");
      } else {
        await this.redisService.set(key, "1", ttlSeconds);
      }

      this.logger.log("Added to whitelist", {
        identifier,
        type,
        permanent,
        ttlSeconds,
      });
    } catch (error) {
      this.logger.error("Failed to add to whitelist", {
        identifier,
        type,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Remove identifier from whitelist
   *
   * @param identifier - IP, User ID, or API Key
   * @param type - Type of identifier
   */
  async removeFromWhitelist(identifier: string, type: BlacklistType): Promise<void> {
    try {
      const key = this.getWhitelistKey(identifier, type);
      await this.redisService.delete(key);

      this.logger.log("Removed from whitelist", { identifier, type });
    } catch (error) {
      this.logger.error("Failed to remove from whitelist", {
        identifier,
        type,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Add identifier to blacklist
   *
   * @param identifier - IP, User ID, or API Key
   * @param type - Type of identifier
   * @param options - Blacklist options
   */
  async addToBlacklist(
    identifier: string,
    type: BlacklistType,
    options?: {
      reason?: string;
      durationSeconds?: number;
      createdBy?: string;
    },
  ): Promise<void> {
    try {
      const key = this.getBlacklistKey(identifier, type);
      const infoKey = this.getBlacklistInfoKey(identifier, type);

      const entry: BlacklistEntry = {
        identifier,
        type,
        reason: options?.reason,
        createdAt: new Date(),
        createdBy: options?.createdBy,
        expiresAt: options?.durationSeconds
          ? new Date(Date.now() + options.durationSeconds * 1000)
          : undefined,
      };

      if (options?.durationSeconds) {
        await this.redisService.set(key, "1", options.durationSeconds);
        await this.redisService.set(infoKey, entry, options.durationSeconds);
      } else {
        await this.redisService.set(key, "1");
        await this.redisService.set(infoKey, entry);
      }

      this.logger.warn("Added to blacklist", {
        identifier,
        type,
        reason: options?.reason,
        durationSeconds: options?.durationSeconds,
        createdBy: options?.createdBy,
      });
    } catch (error) {
      this.logger.error("Failed to add to blacklist", {
        identifier,
        type,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Remove identifier from blacklist
   *
   * @param identifier - IP, User ID, or API Key
   * @param type - Type of identifier
   */
  async removeFromBlacklist(identifier: string, type: BlacklistType): Promise<void> {
    try {
      const key = this.getBlacklistKey(identifier, type);
      const infoKey = this.getBlacklistInfoKey(identifier, type);

      await Promise.all([this.redisService.delete(key), this.redisService.delete(infoKey)]);

      this.logger.log("Removed from blacklist", { identifier, type });
    } catch (error) {
      this.logger.error("Failed to remove from blacklist", {
        identifier,
        type,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get blacklist entry information
   *
   * @param identifier - IP, User ID, or API Key
   * @param type - Type of identifier
   * @returns Blacklist entry or null if not found
   */
  async getBlacklistInfo(identifier: string, type: BlacklistType): Promise<BlacklistEntry | null> {
    try {
      const infoKey = this.getBlacklistInfoKey(identifier, type);
      const entry = await this.redisService.get<BlacklistEntry>(infoKey);
      return entry ?? null;
    } catch (error) {
      this.logger.error("Failed to get blacklist info", {
        identifier,
        type,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Auto-blacklist based on violation patterns
   *
   * This is called automatically when abuse is detected
   *
   * @param identifier - IP, User ID, or API Key
   * @param type - Type of identifier
   * @param violationCount - Number of violations
   */
  async autoBlacklist(
    identifier: string,
    type: BlacklistType,
    violationCount: number,
  ): Promise<void> {
    // Progressive blocking duration based on violation count
    let durationSeconds: number;

    if (violationCount >= 20) {
      // 24 hours for severe abuse
      durationSeconds = 86400;
    } else if (violationCount >= 10) {
      // 4 hours for moderate abuse
      durationSeconds = 14400;
    } else if (violationCount >= 5) {
      // 1 hour for minor abuse
      durationSeconds = 3600;
    } else {
      // 15 minutes for first offenses
      durationSeconds = 900;
    }

    await this.addToBlacklist(identifier, type, {
      reason: `Auto-blacklisted after ${violationCount} rate limit violations`,
      durationSeconds,
      createdBy: "system",
    });

    this.logger.warn("Auto-blacklisted for abuse", {
      identifier,
      type,
      violationCount,
      durationSeconds,
    });
  }

  /**
   * Get recent violations count for an identifier
   *
   * @param identifier - IP, User ID, or API Key
   * @param type - Type of identifier
   * @param windowSeconds - Time window to check (default: 3600 = 1 hour)
   * @returns Number of violations
   */
  async getRecentViolations(
    identifier: string,
    type: BlacklistType,
    windowSeconds = 3600,
  ): Promise<number> {
    try {
      const key = `violations:${type.toLowerCase()}:${identifier}`;
      const count = await this.redisService.get<number>(key);

      // If violations exist, we refresh the expiration time (sliding window)
      // using the provided windowSeconds, ensuring the count stays active
      // while being monitored.
      if (typeof count === "number" && count > 0) {
        await this.redisService.set(key, count, windowSeconds);
      }

      return count ?? 0;
    } catch (error) {
      this.logger.error("Failed to get recent violations", {
        identifier,
        type,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return 0;
    }
  }

  /**
   * Record a rate limit violation
   *
   * @param identifier - IP, User ID, or API Key
   * @param type - Type of identifier
   * @param windowSeconds - Time window for tracking (default: 3600 = 1 hour)
   */
  async recordViolation(
    identifier: string,
    type: BlacklistType,
    windowSeconds = 3600,
  ): Promise<number> {
    try {
      const key = `violations:${type.toLowerCase()}:${identifier}`;

      // Get current count
      const currentCount = (await this.redisService.get<number>(key)) ?? 0;
      const newCount = currentCount + 1;

      // Store with TTL
      await this.redisService.set(key, newCount, windowSeconds);

      // Check if we should auto-blacklist
      if (newCount >= 5) {
        await this.autoBlacklist(identifier, type, newCount);
      }

      return newCount;
    } catch (error) {
      this.logger.error("Failed to record violation", {
        identifier,
        type,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return 0;
    }
  }

  /**
   * Clear all violations for an identifier
   *
   * @param identifier - IP, User ID, or API Key
   * @param type - Type of identifier
   */
  async clearViolations(identifier: string, type: BlacklistType): Promise<void> {
    try {
      const key = `violations:${type.toLowerCase()}:${identifier}`;
      await this.redisService.delete(key);

      this.logger.log("Cleared violations", { identifier, type });
    } catch (error) {
      this.logger.error("Failed to clear violations", {
        identifier,
        type,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Private helper methods

  private getWhitelistKey(identifier: string, type: BlacklistType): string {
    return `${this.WHITELIST_PREFIX}:${type.toLowerCase()}:${identifier}`;
  }

  private getBlacklistKey(identifier: string, type: BlacklistType): string {
    return `${this.BLACKLIST_PREFIX}:${type.toLowerCase()}:${identifier}`;
  }

  private getBlacklistInfoKey(identifier: string, type: BlacklistType): string {
    return `${this.BLACKLIST_INFO_PREFIX}:${type.toLowerCase()}:${identifier}`;
  }

  /**
   * List all blacklist entries
   *
   * Note: This is an expensive operation as it needs to scan Redis keys.
   * Use with caution in production.
   *
   * @param type - Optional type filter
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10, max: 100)
   * @returns List of blacklist entries with pagination info
   */
  async listBlacklist(
    type?: BlacklistType,
    page = 1,
    limit = 10,
  ): Promise<{
    data: BlacklistEntry[];
    meta: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_previous: boolean;
      has_next: boolean;
    };
  }> {
    try {
      // Validate limit
      const validLimit = Math.min(Math.max(limit, 1), 100);
      const skip = (page - 1) * validLimit;

      // Get Redis client
      const redis = this.redisService.getRedisClient();
      if (!redis) {
        this.logger.error("Redis client not available");
        return {
          data: [],
          meta: {
            page,
            limit: validLimit,
            total: 0,
            total_pages: 0,
            has_previous: false,
            has_next: false,
          },
        };
      }

      // Build pattern based on type filter
      const pattern = type
        ? `${this.BLACKLIST_INFO_PREFIX}:${type.toLowerCase()}:*`
        : `${this.BLACKLIST_INFO_PREFIX}:*`;

      // Scan for keys using scanIterator (more efficient)
      const keys: string[] = [];

      for await (const keyBatch of redis.scanIterator({
        MATCH: pattern,
        COUNT: 100,
      })) {
        keys.push(...keyBatch);
        // Stop if we have enough keys for pagination
        if (keys.length >= skip + validLimit) {
          break;
        }
      }

      // Get total count
      const total = keys.length;

      // Get paginated keys
      const paginatedKeys = keys.slice(skip, skip + validLimit);

      // Fetch entries for paginated keys
      const entries: BlacklistEntry[] = [];
      for (const key of paginatedKeys) {
        const entry = await this.redisService.get<BlacklistEntry>(key);
        if (entry) {
          entries.push(entry);
        }
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / validLimit);

      return {
        data: entries,
        meta: {
          page,
          limit: validLimit,
          total,
          total_pages: totalPages,
          has_previous: page > 1,
          has_next: page < totalPages,
        },
      };
    } catch (error) {
      this.logger.error("Failed to list blacklist", {
        type,
        page,
        limit,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
