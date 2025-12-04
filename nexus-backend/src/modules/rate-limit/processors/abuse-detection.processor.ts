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
  // Número de violações em X minutos para considerar abuso
  violationsInWindow: number;
  windowMinutes: number;

  // Taxa de requisições por segundo para considerar spike
  requestsPerSecond: number;

  // Número de IPs diferentes com mesmo padrão
  distributedThreshold: number;

  // Auto-block após X violações
  autoBlockAfter: number;
}

/**
 * Processor para detecção automática de padrões de abuso
 *
 * Analisa violações de rate limit e identifica comportamentos suspeitos:
 * - Violações repetidas do mesmo identificador
 * - Spikes anormais de requisições
 * - Ataques distribuídos
 * - Tentativas de força bruta
 * - Credential stuffing
 *
 * Executa análise periódica via CRON e pode processar eventos em tempo real
 */
@Injectable()
export class AbuseDetectionProcessor {
  private readonly logger = new Logger(AbuseDetectionProcessor.name);

  private readonly thresholds: AbuseThresholds = {
    violationsInWindow: 10, // 10 violações em 5 minutos
    windowMinutes: 5,
    requestsPerSecond: 100, // 100 req/s
    distributedThreshold: 5, // 5 IPs diferentes
    autoBlockAfter: 20, // Bloquear após 20 violações
  };

  constructor(
    @InjectRepository(QuotaUsage)
    private readonly quotaUsageRepository: Repository<QuotaUsage>,
    private readonly alertService: AlertService,
    private readonly blacklistService: BlacklistService,
  ) {}

  /**
   * Análise periódica de padrões de abuso
   * Executa a cada 5 minutos
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async analyzeAbusePatterns(): Promise<void> {
    this.logger.debug('Iniciando análise de padrões de abuso...');

    try {
      const windowStart = new Date(Date.now() - this.thresholds.windowMinutes * 60 * 1000);

      // Buscar violações recentes
      const recentViolations = await this.quotaUsageRepository.find({
        where: {
          blocked: true,
          timestamp: MoreThan(windowStart),
        },
        order: {
          timestamp: 'DESC',
        },
      });

      if (recentViolations.length === 0) {
        this.logger.debug('Nenhuma violação recente encontrada');
        return;
      }

      this.logger.log(`Analisando ${recentViolations.length} violações recentes`);

      // Agrupar violações por identificador
      const violationsByIdentifier = this.groupViolationsByIdentifier(recentViolations);

      // Analisar cada identificador
      const abuseResults: AbuseAnalysisResult[] = [];
      for (const [identifier, violations] of violationsByIdentifier.entries()) {
        const result = await this.analyzeIdentifier(identifier, violations);
        if (result) {
          abuseResults.push(result);
        }
      }

      // Processar resultados e tomar ações
      await this.processAbuseResults(abuseResults);

      this.logger.log(`Análise concluída. Detectados ${abuseResults.length} padrões de abuso`);
    } catch (error) {
      this.logger.error(`Erro na análise de padrões de abuso: ${error.message}`, error.stack);
    }
  }

  /**
   * Analisa violações em tempo real
   * Pode ser chamado quando uma violação ocorre
   */
  async analyzeRealtime(identifier: string): Promise<AbuseAnalysisResult | null> {
    try {
      const windowStart = new Date(Date.now() - this.thresholds.windowMinutes * 60 * 1000);

      const violations = await this.quotaUsageRepository.find({
        where: {
          identifier,
          blocked: true,
          timestamp: MoreThan(windowStart),
        },
        order: {
          timestamp: 'DESC',
        },
      });

      return this.analyzeIdentifier(identifier, violations);
    } catch (error) {
      this.logger.error(`Erro na análise em tempo real para ${identifier}: ${error.message}`);
      return null;
    }
  }

  /**
   * Agrupa violações por identificador
   */
  private groupViolationsByIdentifier(violations: QuotaUsage[]): Map<string, QuotaUsage[]> {
    const grouped = new Map<string, QuotaUsage[]>();

    for (const violation of violations) {
      const existing = grouped.get(violation.identifier) || [];
      existing.push(violation);
      grouped.set(violation.identifier, existing);
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
        firstViolation: violations[violations.length - 1]?.timestamp,
        lastViolation: violations[0]?.timestamp,
        endpoints: this.extractUniqueEndpoints(violations),
        averageInterval: this.calculateAverageInterval(violations),
      },
    };

    return result;
  }

  /**
   * Detecta o padrão de abuso com base nas violações
   */
  private detectPattern(violations: QuotaUsage[]): AbusePattern {
    // Verificar spike de requisições (muitas em curto período)
    const intervals = this.calculateIntervals(violations);
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    if (avgInterval < 1000) {
      // Menos de 1 segundo entre violações
      return AbusePattern.SPIKE_REQUESTS;
    }

    // Verificar tentativas de força bruta (mesmo endpoint, muitas vezes)
    const endpoints = this.extractUniqueEndpoints(violations);
    if (endpoints.length === 1 && violations.length > 15) {
      return AbusePattern.BRUTE_FORCE;
    }

    // Verificar credential stuffing (múltiplos endpoints de auth)
    const authEndpoints = endpoints.filter(ep => ep.includes('/auth') || ep.includes('/login'));
    if (authEndpoints.length > 0 && violations.length > 10) {
      return AbusePattern.CREDENTIAL_STUFFING;
    }

    // Padrão geral de violações repetidas
    return AbusePattern.REPEATED_VIOLATIONS;
  }

  /**
   * Calcula a severidade do abuso
   */
  private calculateSeverity(violationCount: number, pattern: AbusePattern): AlertSeverity {
    // Padrões críticos
    if (
      pattern === AbusePattern.BRUTE_FORCE ||
      pattern === AbusePattern.CREDENTIAL_STUFFING ||
      pattern === AbusePattern.DISTRIBUTED_ATTACK
    ) {
      return AlertSeverity.CRITICAL;
    }

    // Baseado no número de violações
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

  /**
   * Processa resultados de abuso e toma ações
   */
  private async processAbuseResults(results: AbuseAnalysisResult[]): Promise<void> {
    for (const result of results) {
      // Enviar alerta
      await this.alertService.sendAlert({
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

      // Auto-block se necessário
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
      this.logger.error(`Erro ao bloquear ${result.identifier}: ${error.message}`);
      return false;
    }
  }

  /**
   * Extrai endpoints únicos das violações
   */
  private extractUniqueEndpoints(violations: QuotaUsage[]): string[] {
    const endpoints = violations.map(v => v.metadata?.endpoint as string).filter(Boolean);
    return [...new Set(endpoints)];
  }

  /**
   * Calcula intervalos entre violações (em ms)
   */
  private calculateIntervals(violations: QuotaUsage[]): number[] {
    const intervals: number[] = [];

    for (let i = 0; i < violations.length - 1; i++) {
      const current = violations[i].timestamp.getTime();
      const next = violations[i + 1].timestamp.getTime();
      intervals.push(Math.abs(current - next));
    }

    return intervals;
  }

  /**
   * Calcula intervalo médio entre violações
   */
  private calculateAverageInterval(violations: QuotaUsage[]): number {
    const intervals = this.calculateIntervals(violations);
    if (intervals.length === 0) return 0;
    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  /**
   * Obtém estatísticas de abuso
   */
  async getAbuseStatistics(): Promise<{
    totalViolations: number;
    blockedIdentifiers: number;
    topOffenders: Array<{ identifier: string; count: number }>;
  }> {
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h

    const violations = await this.quotaUsageRepository.find({
      where: {
        blocked: true,
        timestamp: MoreThan(windowStart),
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

    const blockedCount = await this.blacklistService.getBlacklistSize();

    return {
      totalViolations: violations.length,
      blockedIdentifiers: blockedCount,
      topOffenders,
    };
  }
}
