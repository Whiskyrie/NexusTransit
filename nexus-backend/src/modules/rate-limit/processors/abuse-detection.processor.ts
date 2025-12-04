import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QuotaUsage } from '../entities/quota-usage.entity';
import { AlertService, AlertType, AlertSeverity } from '../services/alert.service';
import { BlacklistService } from '../services/blacklist.service';

/**
 * Padrões de abuso detectados
 */
export enum AbusePattern {
  REPEATED_VIOLATIONS = 'REPEATED_VIOLATIONS',
  SPIKE_REQUESTS = 'SPIKE_REQUESTS',
  DISTRIBUTED_ATTACK = 'DISTRIBUTED_ATTACK',
  BRUTE_FORCE = 'BRUTE_FORCE',
  CREDENTIAL_STUFFING = 'CREDENTIAL_STUFFING',
}

/**
 * Interface para resultado de análise de abuso
 */
export interface AbuseAnalysisResult {
  identifier: string;
  pattern: AbusePattern;
  severity: AlertSeverity;
  violationCount: number;
  timeWindow: number;
  shouldBlock: boolean;
  details: Record<string, unknown>;
}

/**
 * Configuração de thresholds para detecção de abuso
 */
interface AbuseThresholds {
  violationsInWindow: number;
  windowMinutes: number;
  requestsPerSecond: number;
  distributedThreshold: number;
  autoBlockAfter: number;
}

@Injectable()
export class AbuseDetectionProcessor {
  private readonly logger = new Logger(AbuseDetectionProcessor.name);

  private readonly thresholds: AbuseThresholds = {
    violationsInWindow: 10,
    windowMinutes: 5,
    requestsPerSecond: 100,
    distributedThreshold: 5,
    autoBlockAfter: 20,
  };

  constructor(
    @InjectRepository(QuotaUsage)
    private readonly quotaUsageRepository: Repository<QuotaUsage>,
    private readonly alertService: AlertService,
    private readonly blacklistService: BlacklistService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async analyzeAbusePatterns(): Promise<void> {
    this.logger.debug('Iniciando análise de padrões de abuso...');

    try {
      const windowStart = new Date(Date.now() - this.thresholds.windowMinutes * 60 * 1000);

      const recentViolations = await this.quotaUsageRepository.find({
        where: {
          blocked: true,
          request_time: MoreThan(windowStart),
        },
        order: {
          request_time: 'DESC',
        },
      });

      if (recentViolations.length === 0) {
        this.logger.debug('Nenhuma violação recente encontrada');
        return;
      }

      this.logger.log(`Analisando ${recentViolations.length} violações recentes`);

      const violationsByIdentifier = this.groupViolationsByIdentifier(recentViolations);

      const abuseResults: AbuseAnalysisResult[] = [];
      for (const [identifier, violations] of violationsByIdentifier.entries()) {
        const result = this.analyzeIdentifier(identifier, violations);
        if (result) {
          abuseResults.push(result);
        }
      }

      await this.processAbuseResults(abuseResults);

      this.logger.log(`Análise concluída. Detectados ${abuseResults.length} padrões de abuso`);
    } catch (error) {
      // Safe error typing
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Erro na análise de padrões de abuso: ${errorMessage}`, errorStack);
    }
  }

  async analyzeRealtime(identifier: string): Promise<AbuseAnalysisResult | null> {
    try {
      const windowStart = new Date(Date.now() - this.thresholds.windowMinutes * 60 * 1000);

      const violations = await this.quotaUsageRepository.find({
        where: {
          client_id: identifier,
          blocked: true,
          request_time: MoreThan(windowStart),
        },
        order: {
          request_time: 'DESC',
        },
      });

      // Retorna diretamente (o método síncrono é envolvido na Promise do método async atual)
      return this.analyzeIdentifier(identifier, violations);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Erro na análise em tempo real para ${identifier}: ${errorMessage}`);
      return null;
    }
  }

  private groupViolationsByIdentifier(violations: QuotaUsage[]): Map<string, QuotaUsage[]> {
    const grouped = new Map<string, QuotaUsage[]>();

    for (const violation of violations) {
      const existing = grouped.get(violation.client_id) ?? [];
      existing.push(violation);
      grouped.set(violation.client_id, existing);
    }

    return grouped;
  }

  /**
   * Analisa violações de um identificador específico
   */
  private async analyzeIdentifier(
    identifier: string,
    violations: QuotaUsage[],
  ): Promise<AbuseAnalysisResult | null> {
    const violationCount = violations.length;

    // Verificar se excede threshold de violações
    if (violationCount < this.thresholds.violationsInWindow) {
      return null;
    }

    // Detectar padrão
    const pattern = this.detectPattern(violations);
    const severity = this.calculateSeverity(violationCount, pattern);
    const shouldBlock = violationCount >= this.thresholds.autoBlockAfter;

    const result: AbuseAnalysisResult = {
      identifier,
      pattern,
      severity,
      violationCount,
      timeWindow: this.thresholds.windowMinutes,
      shouldBlock,
      details: {
        firstViolation: violations[violations.length - 1]?.request_time,
        lastViolation: violations[0]?.request_time,
        endpoints: this.extractUniqueEndpoints(violations),
        averageInterval: this.calculateAverageInterval(violations),
      },
    };

    return result;
  }

  private detectPattern(violations: QuotaUsage[]): AbusePattern {
    const intervals = this.calculateIntervals(violations);
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    if (avgInterval < 1000) {
      return AbusePattern.SPIKE_REQUESTS;
    }

    const endpoints = this.extractUniqueEndpoints(violations);
    if (endpoints.length === 1 && violations.length > 15) {
      return AbusePattern.BRUTE_FORCE;
    }

    const authEndpoints = endpoints.filter(ep => ep.includes('/auth') || ep.includes('/login'));
    if (authEndpoints.length > 0 && violations.length > 10) {
      return AbusePattern.CREDENTIAL_STUFFING;
    }

    return AbusePattern.REPEATED_VIOLATIONS;
  }

  private calculateSeverity(violationCount: number, pattern: AbusePattern): AlertSeverity {
    if (
      pattern === AbusePattern.BRUTE_FORCE ||
      pattern === AbusePattern.CREDENTIAL_STUFFING ||
      pattern === AbusePattern.DISTRIBUTED_ATTACK
    ) {
      return AlertSeverity.CRITICAL;
    }

    if (violationCount >= this.thresholds.autoBlockAfter) {
      return AlertSeverity.CRITICAL;
    }
    if (violationCount >= 15) {
      return AlertSeverity.HIGH;
    }
    if (violationCount >= 10) {
      return AlertSeverity.WARNING;
    }

    return AlertSeverity.INFO;
  }

  private async processAbuseResults(results: AbuseAnalysisResult[]): Promise<void> {
    for (const result of results) {
      this.alertService.sendAlert({
        type: AlertType.SUSPICIOUS_ACTIVITY,
        severity: result.severity,
        message: `Padrão de abuso detectado: ${result.pattern}`,
        details: {
          identifier: result.identifier,
          violationCount: result.violationCount,
          timeWindow: result.timeWindow,
          pattern: result.pattern,
          ...result.details,
        },
      });

      if (result.shouldBlock) {
        const blocked = await this.autoBlock(result);
        if (blocked) {
          this.logger.warn(
            `Identificador ${result.identifier} bloqueado automaticamente (${result.violationCount} violações)`,
          );
        }
      }
    }
  }

  /**
   * Bloqueia automaticamente um identificador suspeito
   */
  private async autoBlock(result: AbuseAnalysisResult): Promise<boolean> {
    try {
      // Verificar se já está na blacklist
      const isBlacklisted = await this.blacklistService.isBlacklisted(result.identifier);
      if (isBlacklisted) {
        return false;
      }

      // Adicionar à blacklist
      const reason = `Auto-blocked: ${result.pattern} - ${result.violationCount} violações em ${result.timeWindow} minutos`;
      await this.blacklistService.addToBlacklist(
        result.identifier,
        reason,
        24 * 60 * 60 * 1000, // 24 horas
      );

      // Enviar alerta de auto-block
      await this.alertService.sendAlert({
        type: AlertType.AUTO_BLACKLIST,
        severity: AlertSeverity.CRITICAL,
        message: `Identificador bloqueado automaticamente`,
        details: {
          identifier: result.identifier,
          reason,
          pattern: result.pattern,
          violationCount: result.violationCount,
        },
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Erro ao bloquear ${result.identifier}: ${errorMessage}`);
      return false;
    }
  }

  private extractUniqueEndpoints(violations: QuotaUsage[]): string[] {
    const endpoints = violations
      .map(v => v.metadata?.endpoint as string | undefined)
      .filter((e): e is string => !!e);
    return [...new Set(endpoints)];
  }

  private calculateIntervals(violations: QuotaUsage[]): number[] {
    const intervals: number[] = [];

    for (let i = 0; i < violations.length - 1; i++) {
      const currentViolation = violations[i];
      const nextViolation = violations[i + 1];

      if (currentViolation?.request_time && nextViolation?.request_time) {
        const current = new Date(currentViolation.request_time).getTime();
        const next = new Date(nextViolation.request_time).getTime();
        intervals.push(Math.abs(current - next));
      }
    }

    return intervals;
  }

  private calculateAverageInterval(violations: QuotaUsage[]): number {
    const intervals = this.calculateIntervals(violations);
    if (intervals.length === 0) {
      return 0;
    }
    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  async getAbuseStatistics(): Promise<{
    totalViolations: number;
    blockedIdentifiers: number;
    topOffenders: { identifier: string; count: number }[];
  }> {
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const violations = await this.quotaUsageRepository.find({
      where: {
        blocked: true,
        request_time: MoreThan(windowStart),
      },
    });

    const violationsByIdentifier = this.groupViolationsByIdentifier(violations);

    const topOffenders = Array.from(violationsByIdentifier.entries())
      .map(([identifier, viols]) => ({
        identifier,
        count: viols.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalViolations: violations.length,
      blockedIdentifiers: topOffenders.length,
      topOffenders,
    };
  }
}
