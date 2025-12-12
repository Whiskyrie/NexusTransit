import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { QuotaUsage } from "../entities/quota-usage.entity";
import { AlertService } from "./alert.service";
import {
  QuotaMetrics,
  ViolatorInfo,
  EndpointUsage,
  UserUsage,
  IPUsage,
  SuspiciousActivity,
  ViolatorQueryResult,
  EndpointQueryResult,
  UserQueryResult,
  IPQueryResult,
  SuspiciousIPQueryResult,
  SuspiciousUserQueryResult,
  DistributedAttackQueryResult,
} from "../interfaces/monitoring.interface";

/**
 * Rate Limiting Monitoring Service
 *
 * Provides real-time metrics, analytics, and suspicious activity detection
 * for the rate limiting system.
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(QuotaUsage)
    private readonly usageRepository: Repository<QuotaUsage>,
    private readonly alertService: AlertService,
  ) {}

  /**
   * Get comprehensive quota metrics for a time period
   *
   * @param startDate - Start date for metrics (optional)
   * @param endDate - End date for metrics (optional)
   * @returns Quota metrics
   */
  async getQuotaMetrics(startDate?: Date, endDate?: Date): Promise<QuotaMetrics> {
    const now = endDate ?? new Date();
    const periodStart = startDate ?? new Date(now.getTime() - 60 * 60 * 1000); // Default: 1 hour

    try {
      const [
        totalRequests,
        blockedRequests,
        topViolators,
        quotaUsageByEndpoint,
        quotaUsageByUser,
        quotaUsageByIP,
      ] = await Promise.all([
        this.getTotalRequests(periodStart),
        this.getBlockedRequests(periodStart),
        this.getTopViolators(periodStart, 10),
        this.getQuotaUsageByEndpoint(periodStart),
        this.getQuotaUsageByUser(periodStart),
        this.getQuotaUsageByIP(periodStart),
      ]);

      const blockRate = totalRequests > 0 ? (blockedRequests / totalRequests) * 100 : 0;

      return {
        period: {
          from: periodStart,
          to: now,
        },
        totalRequests,
        blockedRequests,
        blockRate,
        topViolators,
        quotaUsageByEndpoint,
        quotaUsageByUser,
        quotaUsageByIP,
      };
    } catch (error) {
      this.logger.error("Failed to get quota metrics", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get total requests count
   */
  private async getTotalRequests(since: Date): Promise<number> {
    return this.usageRepository.count({
      where: {
        request_time: MoreThan(since),
      },
    });
  }

  /**
   * Get blocked requests count
   */
  private async getBlockedRequests(since: Date): Promise<number> {
    return this.usageRepository.count({
      where: {
        request_time: MoreThan(since),
        blocked: true,
      },
    });
  }

  /**
   * Get top violators
   */
  private async getTopViolators(since: Date, limit = 10): Promise<ViolatorInfo[]> {
    const results = await this.usageRepository
      .createQueryBuilder("usage")
      .select([
        "usage.client_id as clientId",
        "usage.ip as ip",
        "usage.user_id as userId",
        "COUNT(*) as violationCount",
        "MAX(usage.request_time) as lastViolation",
        "array_agg(DISTINCT usage.endpoint) as endpoints",
      ])
      .where("usage.request_time > :since", { since })
      .andWhere("usage.blocked = :blocked", { blocked: true })
      .groupBy("usage.client_id, usage.ip, usage.user_id")
      .orderBy("violationCount", "DESC")
      .limit(limit)
      .getRawMany<ViolatorQueryResult>();

    return results.map((r) => ({
      clientId: r.clientid,
      ip: r.ip,
      userId: r.userid ?? undefined,
      violationCount: parseInt(r.violationcount, 10),
      lastViolation: new Date(r.lastviolation),
      endpoints: r.endpoints ?? [],
    }));
  }

  /**
   * Get quota usage by endpoint
   */
  private async getQuotaUsageByEndpoint(since: Date): Promise<EndpointUsage[]> {
    const results = await this.usageRepository
      .createQueryBuilder("usage")
      .select([
        "usage.endpoint as endpoint",
        "usage.method as method",
        "COUNT(*) as totalRequests",
        "SUM(CASE WHEN usage.blocked = true THEN 1 ELSE 0 END) as blockedRequests",
        "COUNT(DISTINCT usage.user_id) as uniqueUsers",
        "COUNT(DISTINCT usage.ip) as uniqueIPs",
      ])
      .where("usage.request_time > :since", { since })
      .groupBy("usage.endpoint, usage.method")
      .orderBy("totalRequests", "DESC")
      .limit(20)
      .getRawMany<EndpointQueryResult>();

    return results.map((r) => {
      const total = parseInt(r.totalrequests, 10);
      const blocked = parseInt(r.blockedrequests, 10);
      return {
        endpoint: r.endpoint,
        method: r.method,
        totalRequests: total,
        blockedRequests: blocked,
        blockRate: total > 0 ? (blocked / total) * 100 : 0,
        uniqueUsers: parseInt(r.uniqueusers, 10),
        uniqueIPs: parseInt(r.uniqueips, 10),
      };
    });
  }

  /**
   * Get quota usage by user
   */
  private async getQuotaUsageByUser(since: Date): Promise<UserUsage[]> {
    const results = await this.usageRepository
      .createQueryBuilder("usage")
      .select([
        "usage.user_id as userId",
        "COUNT(*) as totalRequests",
        "SUM(CASE WHEN usage.blocked = true THEN 1 ELSE 0 END) as blockedRequests",
        "array_agg(DISTINCT usage.endpoint) as endpoints",
      ])
      .where("usage.request_time > :since", { since })
      .andWhere("usage.user_id IS NOT NULL")
      .groupBy("usage.user_id")
      .orderBy("totalRequests", "DESC")
      .limit(20)
      .getRawMany<UserQueryResult>();

    return results.map((r) => {
      const total = parseInt(r.totalrequests, 10);
      const blocked = parseInt(r.blockedrequests, 10);
      return {
        userId: r.userid,
        totalRequests: total,
        blockedRequests: blocked,
        blockRate: total > 0 ? (blocked / total) * 100 : 0,
        endpoints: r.endpoints ?? [],
      };
    });
  }

  /**
   * Get quota usage by IP
   */
  private async getQuotaUsageByIP(since: Date): Promise<IPUsage[]> {
    const results = await this.usageRepository
      .createQueryBuilder("usage")
      .select([
        "usage.ip as ip",
        "COUNT(*) as totalRequests",
        "SUM(CASE WHEN usage.blocked = true THEN 1 ELSE 0 END) as blockedRequests",
      ])
      .where("usage.request_time > :since", { since })
      .groupBy("usage.ip")
      .orderBy("totalRequests", "DESC")
      .limit(20)
      .getRawMany<IPQueryResult>();

    return results.map((r) => {
      const total = parseInt(r.totalrequests, 10);
      const blocked = parseInt(r.blockedrequests, 10);
      const blockRate = total > 0 ? (blocked / total) * 100 : 0;

      return {
        ip: r.ip,
        totalRequests: total,
        blockedRequests: blocked,
        blockRate,
        suspiciousActivity: blockRate > 50 || blocked > 10,
      };
    });
  }

  /**
   * Get violations for a specific period and type
   *
   * @param startDate - Start date for filtering
   * @param endDate - End date for filtering
   * @param type - Type of violation ('IP' | 'USER' | 'CLIENT_ID')
   * @returns List of quota usage records
   */
  async getViolations(
    startDate?: Date,
    endDate?: Date,
    type?: "IP" | "USER" | "CLIENT_ID",
  ): Promise<QuotaUsage[]> {
    try {
      const now = endDate ?? new Date();
      const start = startDate ?? new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default: 24 hours

      const queryBuilder = this.usageRepository
        .createQueryBuilder("usage")
        .where("usage.request_time >= :start", { start })
        .andWhere("usage.blocked = :blocked", { blocked: true });

      // If endDate is provided, add upper bound filter
      if (endDate) {
        queryBuilder.andWhere("usage.request_time <= :end", { end: endDate });
      }

      // If type is provided, filter by specific field
      if (type) {
        switch (type) {
          case "IP":
            queryBuilder.andWhere("usage.ip IS NOT NULL");
            break;
          case "USER":
            queryBuilder.andWhere("usage.user_id IS NOT NULL");
            break;
          case "CLIENT_ID":
            queryBuilder.andWhere("usage.client_id IS NOT NULL");
            break;
        }
      }

      return queryBuilder.orderBy("usage.request_time", "DESC").limit(1000).getMany();
    } catch (error) {
      this.logger.error("Failed to get violations", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Detect suspicious activity patterns
   *
   * Checks for:
   * - High violation rates
   * - Distributed attacks
   * - Rapid fire requests
   * - Multiple endpoints targeting
   */
  async detectSuspiciousActivity(): Promise<SuspiciousActivity[]> {
    const suspicious: SuspiciousActivity[] = [];

    try {
      // Get IPs with high violation rates
      const suspiciousIPs = await this.detectSuspiciousIPs();
      suspicious.push(...suspiciousIPs);

      // Get users with suspicious patterns
      const suspiciousUsers = await this.detectSuspiciousUsers();
      suspicious.push(...suspiciousUsers);

      // Get distributed attack patterns
      const distributedAttacks = await this.detectDistributedAttacks();
      suspicious.push(...distributedAttacks);

      return suspicious;
    } catch (error) {
      this.logger.error("Failed to detect suspicious activity", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return [];
    }
  }

  /**
   * Detect suspicious IPs
   */
  private async detectSuspiciousIPs(): Promise<SuspiciousActivity[]> {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const suspicious: SuspiciousActivity[] = [];

    const results = await this.usageRepository
      .createQueryBuilder("usage")
      .select([
        "usage.ip as ip",
        "COUNT(*) as totalRequests",
        "SUM(CASE WHEN usage.blocked = true THEN 1 ELSE 0 END) as blockedRequests",
        "COUNT(DISTINCT usage.endpoint) as uniqueEndpoints",
      ])
      .where("usage.request_time > :since", { since: oneHourAgo })
      .groupBy("usage.ip")
      .having("SUM(CASE WHEN usage.blocked = true THEN 1 ELSE 0 END) > :threshold", {
        threshold: 10,
      })
      .getRawMany<SuspiciousIPQueryResult>();

    for (const r of results) {
      const total = parseInt(r.totalrequests, 10);
      const blocked = parseInt(r.blockedrequests, 10);
      const blockRate = (blocked / total) * 100;
      const uniqueEndpoints = parseInt(r.uniqueendpoints, 10);

      const reasons: string[] = [];
      let riskLevel: SuspiciousActivity["riskLevel"] = "LOW";

      if (blocked > 50) {
        reasons.push(`High violation count: ${blocked}`);
        riskLevel = "CRITICAL";
      } else if (blocked > 20) {
        reasons.push(`Moderate violation count: ${blocked}`);
        riskLevel = "HIGH";
      } else if (blocked > 10) {
        reasons.push(`Elevated violation count: ${blocked}`);
        riskLevel = "MEDIUM";
      }

      if (blockRate > 80) {
        reasons.push(`Very high block rate: ${blockRate.toFixed(2)}%`);
        riskLevel = "CRITICAL";
      } else if (blockRate > 50) {
        reasons.push(`High block rate: ${blockRate.toFixed(2)}%`);
        if (riskLevel === "LOW") {
          riskLevel = "HIGH";
        }
      }

      if (uniqueEndpoints > 10) {
        reasons.push(`Scanning multiple endpoints: ${uniqueEndpoints}`);
        if (riskLevel === "LOW") {
          riskLevel = "MEDIUM";
        }
      }

      if (reasons.length > 0) {
        suspicious.push({
          identifier: r.ip,
          type: "IP",
          violationCount: blocked,
          riskLevel,
          reason: reasons,
          detectedAt: new Date(),
        });
      }
    }

    return suspicious;
  }

  /**
   * Detect suspicious users
   */
  private async detectSuspiciousUsers(): Promise<SuspiciousActivity[]> {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const suspicious: SuspiciousActivity[] = [];

    const results = await this.usageRepository
      .createQueryBuilder("usage")
      .select([
        "usage.user_id as userId",
        "COUNT(DISTINCT usage.ip) as uniqueIPs",
        "SUM(CASE WHEN usage.blocked = true THEN 1 ELSE 0 END) as blockedRequests",
      ])
      .where("usage.request_time > :since", { since: oneHourAgo })
      .andWhere("usage.user_id IS NOT NULL")
      .groupBy("usage.user_id")
      .having("COUNT(DISTINCT usage.ip) > :threshold", { threshold: 5 })
      .orHaving("SUM(CASE WHEN usage.blocked = true THEN 1 ELSE 0 END) > :blockThreshold", {
        blockThreshold: 10,
      })
      .getRawMany<SuspiciousUserQueryResult>();

    for (const r of results) {
      const uniqueIPs = parseInt(r.uniqueips, 10);
      const blocked = parseInt(r.blockedrequests, 10);

      const reasons: string[] = [];
      let riskLevel: SuspiciousActivity["riskLevel"] = "LOW";

      if (uniqueIPs > 10) {
        reasons.push(`Multiple IPs: ${uniqueIPs}`);
        riskLevel = "HIGH";
      } else if (uniqueIPs > 5) {
        reasons.push(`Several IPs: ${uniqueIPs}`);
        riskLevel = "MEDIUM";
      }

      if (blocked > 10) {
        reasons.push(`Multiple violations: ${blocked}`);
        if (riskLevel === "LOW") {
          riskLevel = "MEDIUM";
        }
      }

      if (reasons.length > 0) {
        suspicious.push({
          identifier: r.userid,
          type: "USER",
          violationCount: blocked,
          riskLevel,
          reason: reasons,
          detectedAt: new Date(),
        });
      }
    }

    return suspicious;
  }

  /**
   * Detect distributed attacks (same user across many IPs)
   */
  private async detectDistributedAttacks(): Promise<SuspiciousActivity[]> {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const suspicious: SuspiciousActivity[] = [];

    // Check for coordinated attacks (multiple IPs hitting same endpoints)
    const results = await this.usageRepository
      .createQueryBuilder("usage")
      .select([
        "usage.endpoint as endpoint",
        "COUNT(DISTINCT usage.ip) as uniqueIPs",
        "COUNT(*) as totalRequests",
        "SUM(CASE WHEN usage.blocked = true THEN 1 ELSE 0 END) as blockedRequests",
      ])
      .where("usage.request_time > :since", { since: oneHourAgo })
      .groupBy("usage.endpoint")
      .having("COUNT(DISTINCT usage.ip) > :threshold", { threshold: 20 })
      .andHaving("SUM(CASE WHEN usage.blocked = true THEN 1 ELSE 0 END) > :blockThreshold", {
        blockThreshold: 50,
      })
      .getRawMany<DistributedAttackQueryResult>();

    for (const r of results) {
      const uniqueIPs = parseInt(r.uniqueips, 10);
      const blocked = parseInt(r.blockedrequests, 10);

      suspicious.push({
        identifier: r.endpoint,
        type: "IP",
        violationCount: blocked,
        riskLevel: "CRITICAL",
        reason: [
          `Distributed attack detected`,
          `${uniqueIPs} different IPs`,
          `${blocked} blocked requests`,
          `Target: ${r.endpoint}`,
        ],
        detectedAt: new Date(),
      });
    }

    return suspicious;
  }

  /**
   * Periodic check for quota alerts
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkQuotaAlerts(): Promise<void> {
    try {
      this.logger.debug("Running scheduled quota alerts check");

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const metrics = await this.getQuotaMetrics(oneHourAgo);

      // Alert if block rate is too high
      if (metrics.blockRate > 10) {
        this.logger.warn("High block rate detected", {
          blockRate: metrics.blockRate.toFixed(2),
          totalRequests: metrics.totalRequests,
          blockedRequests: metrics.blockedRequests,
        });

        // Send alert through AlertService
        this.alertService.sendHighBlockRateAlert(metrics.blockRate, {
          totalRequests: metrics.totalRequests,
          blockedRequests: metrics.blockedRequests,
          period: metrics.period,
        });
      }

      // Alert for potential abuse patterns
      const suspicious = await this.detectSuspiciousActivity();
      if (suspicious.length > 0) {
        this.logger.warn("Suspicious activity detected", {
          count: suspicious.length,
          activities: suspicious.map((s) => ({
            identifier: s.identifier,
            type: s.type,
            riskLevel: s.riskLevel,
            reasons: s.reason,
          })),
        });

        // Send alert through AlertService
        this.alertService.sendSuspiciousActivityAlert(
          suspicious.length,
          suspicious.map((s) => ({
            identifier: s.identifier,
            type: s.type,
            riskLevel: s.riskLevel,
            reasons: s.reason,
          })),
        );
      }

      // Log summary
      this.logger.log("Quota alerts check completed", {
        totalRequests: metrics.totalRequests,
        blockedRequests: metrics.blockedRequests,
        blockRate: metrics.blockRate.toFixed(2),
        suspiciousActivities: suspicious.length,
      });
    } catch (error) {
      this.logger.error("Failed to check quota alerts", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Send system error alert
      if (error instanceof Error) {
        this.alertService.sendSystemErrorAlert(error, {
          context: "checkQuotaAlerts",
        });
      }
    }
  }

  /**
   * Get detailed violation history for an identifier
   */
  async getViolationHistory(
    identifier: string,
    type: "IP" | "USER" | "CLIENT_ID",
    hours = 24,
  ): Promise<QuotaUsage[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const whereClause: {
      request_time: ReturnType<typeof MoreThan<Date>>;
      blocked: boolean;
      ip?: string;
      user_id?: string;
      client_id?: string;
    } = {
      request_time: MoreThan(since),
      blocked: true,
    };

    switch (type) {
      case "IP":
        whereClause.ip = identifier;
        break;
      case "USER":
        whereClause.user_id = identifier;
        break;
      case "CLIENT_ID":
        whereClause.client_id = identifier;
        break;
    }

    return this.usageRepository.find({
      where: whereClause,
      order: { request_time: "DESC" },
      take: 100,
    });
  }
}
