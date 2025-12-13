import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Alert types for rate limiting system
 */
export enum AlertType {
  HIGH_BLOCK_RATE = "HIGH_BLOCK_RATE",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  AUTO_BLACKLIST = "AUTO_BLACKLIST",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  SYSTEM_ERROR = "SYSTEM_ERROR",
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

/**
 * Alert payload interface
 */
export interface AlertPayload {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: Date;
}

/**
 * Service for sending alerts about rate limiting events
 *
 * Supports multiple notification channels:
 * - Console logging (always enabled)
 * - Email notifications (TODO)
 * - Slack/Discord webhooks (TODO)
 * - SMS alerts (TODO)
 */
@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private readonly alertsEnabled: boolean;
  private readonly emailEnabled: boolean;
  private readonly webhookEnabled: boolean;
  private readonly webhookUrl: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.alertsEnabled = this.configService.get<boolean>("RATE_LIMIT_ALERTS_ENABLED", true);
    this.emailEnabled = this.configService.get<boolean>("RATE_LIMIT_EMAIL_ALERTS", false);
    this.webhookEnabled = this.configService.get<boolean>("RATE_LIMIT_WEBHOOK_ALERTS", false);
    this.webhookUrl = this.configService.get<string>("RATE_LIMIT_WEBHOOK_URL");
  }

  /**
   * Send alert through configured channels
   */
  sendAlert(payload: AlertPayload): void {
    if (!this.alertsEnabled) {
      return;
    }

    const alert: AlertPayload = {
      ...payload,
      timestamp: payload.timestamp ?? new Date(),
    };

    // Always log to console
    this.logAlert(alert);

    // Send through configured channels (non-blocking, fire and forget)
    if (this.emailEnabled) {
      void this.sendEmailAlert(alert);
    }

    if (this.webhookEnabled && this.webhookUrl) {
      void this.sendWebhookAlert(alert);
    }
  }

  /**
   * Log alert to console
   */
  private logAlert(alert: AlertPayload): void {
    const logMessage = `[${alert.severity}] ${alert.type}: ${alert.message}`;
    const logContext = {
      type: alert.type,
      severity: alert.severity,
      timestamp: alert.timestamp,
      details: alert.details,
    };

    switch (alert.severity) {
      case AlertSeverity.CRITICAL:
      case AlertSeverity.HIGH:
        this.logger.error(logMessage, logContext);
        break;
      case AlertSeverity.WARNING:
        this.logger.warn(logMessage, logContext);
        break;
      case AlertSeverity.INFO:
        this.logger.log(logMessage, logContext);
        break;
      default:
        this.logger.log(logMessage, logContext);
    }
  }

  /**
   * Send alert via email
   * TODO: Implement email integration
   */
  private async sendEmailAlert(alert: AlertPayload): Promise<void> {
    await Promise.resolve(); // Satisfy async requirement
    this.logger.debug("Email alert not implemented yet", { alert });
    // TODO: Integrate with email service
    // await this.emailService.send({
    //   to: this.configService.get('ALERT_EMAIL_RECIPIENTS'),
    //   subject: `[${alert.severity}] Rate Limit Alert: ${alert.type}`,
    //   body: this.formatEmailBody(alert),
    // });
  }

  /**
   * Send alert via webhook (Slack, Discord, etc.)
   * TODO: Implement webhook integration
   */
  private async sendWebhookAlert(alert: AlertPayload): Promise<void> {
    await Promise.resolve(); // Satisfy async requirement

    if (!this.webhookUrl) {
      return;
    }

    try {
      this.logger.debug("Webhook alert not implemented yet", {
        alert,
        webhookUrl: this.webhookUrl,
      });

      // TODO: Implement webhook call
      // const response = await fetch(this.webhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(this.formatWebhookPayload(alert)),
      // });
      //
      // if (!response.ok) {
      //   throw new Error(`Webhook request failed: ${response.statusText}`);
      // }
    } catch (error) {
      this.logger.error("Failed to send webhook alert", error);
    }
  }

  // TODO: Uncomment when implementing email integration
  // /**
  //  * Format alert for email body
  //  */
  // private formatEmailBody(alert: AlertPayload): string {
  //   return `
  //     Rate Limit Alert
  //     ================
  //
  //     Type: ${alert.type}
  //     Severity: ${alert.severity}
  //     Time: ${alert.timestamp?.toISOString()}
  //
  //     Message:
  //     ${alert.message}
  //
  //     Details:
  //     ${JSON.stringify(alert.details, null, 2)}
  //   `;
  // }

  // TODO: Uncomment when implementing webhook integration
  // /**
  //  * Format alert for webhook payload (Slack format)
  //  * Used when webhook integration is implemented
  //  */
  // private formatWebhookPayload(alert: AlertPayload): Record<string, unknown> {
  //   const color = this.getSeverityColor(alert.severity);
  //
  //   return {
  //     username: 'Rate Limit Monitor',
  //     icon_emoji: ':warning:',
  //     attachments: [
  //       {
  //         color,
  //         title: `${alert.type}`,
  //         text: alert.message,
  //         fields: [
  //           {
  //             title: 'Severity',
  //             value: alert.severity,
  //             short: true,
  //           },
  //           {
  //             title: 'Timestamp',
  //             value: alert.timestamp?.toISOString(),
  //             short: true,
  //           },
  //         ],
  //         footer: 'NexusTransit Rate Limiting',
  //         ts: Math.floor((alert.timestamp?.getTime() ?? Date.now()) / 1000),
  //       },
  //     ],
  //   };
  // }

  // TODO: Uncomment when implementing webhook integration
  // /**
  //  * Get color for severity level (Slack/Discord format)
  //  */
  // private getSeverityColor(severity: AlertSeverity): string {
  //   switch (severity) {
  //     case AlertSeverity.CRITICAL:
  //       return '#ff0000'; // Red
  //     case AlertSeverity.HIGH:
  //       return '#ff6600'; // Orange
  //     case AlertSeverity.WARNING:
  //       return '#ffcc00'; // Yellow
  //     case AlertSeverity.INFO:
  //       return '#0099ff'; // Blue
  //     default:
  //       return '#cccccc'; // Gray
  //   }
  // }

  /**
   * Send high block rate alert
   */
  sendHighBlockRateAlert(blockRate: number, metrics: Record<string, unknown>): void {
    this.sendAlert({
      type: AlertType.HIGH_BLOCK_RATE,
      severity: blockRate > 20 ? AlertSeverity.HIGH : AlertSeverity.WARNING,
      message: `Rate limit block rate is ${blockRate.toFixed(2)}%`,
      details: {
        blockRate,
        threshold: 10,
        metrics,
      },
    });
  }

  /**
   * Send suspicious activity alert
   */
  sendSuspiciousActivityAlert(count: number, activities: Record<string, unknown>[]): void {
    this.sendAlert({
      type: AlertType.SUSPICIOUS_ACTIVITY,
      severity: count > 10 ? AlertSeverity.HIGH : AlertSeverity.WARNING,
      message: `Detected ${count} suspicious IP addresses with high violation rates`,
      details: {
        count,
        activities,
      },
    });
  }

  /**
   * Send auto-blacklist alert
   */
  sendAutoBlacklistAlert(identifier: string, type: string, reason: string): void {
    this.sendAlert({
      type: AlertType.AUTO_BLACKLIST,
      severity: AlertSeverity.HIGH,
      message: `Automatically blacklisted ${type}: ${identifier}`,
      details: {
        identifier,
        type,
        reason,
      },
    });
  }

  /**
   * Send quota exceeded alert
   */
  sendQuotaExceededAlert(identifier: string, quota: number, current: number): void {
    this.sendAlert({
      type: AlertType.QUOTA_EXCEEDED,
      severity: AlertSeverity.WARNING,
      message: `Quota exceeded for ${identifier}`,
      details: {
        identifier,
        quota,
        current,
        exceedBy: current - quota,
      },
    });
  }

  /**
   * Send system error alert
   */
  sendSystemErrorAlert(error: Error, context?: Record<string, unknown>): void {
    this.sendAlert({
      type: AlertType.SYSTEM_ERROR,
      severity: AlertSeverity.CRITICAL,
      message: `Rate limiting system error: ${error.message}`,
      details: {
        error: error.message,
        stack: error.stack,
        context,
      },
    });
  }
}
