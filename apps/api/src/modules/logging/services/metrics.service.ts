import { Injectable, Logger } from '@nestjs/common';
import {
  HttpMetric,
  ErrorMetric,
  SlowRequestMetric,
  HttpMetricsSummary,
  ErrorMetricsSummary,
  SystemMetrics,
} from '../interfaces/metrics.interface';

/**
 * Service para coleta e exposição de métricas da aplicação
 *
 * Mantém métricas em memória com limite para evitar memory leaks
 * Em produção, considerar integração com Prometheus/Grafana
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  // Storage em memória com limite
  private httpRequests: HttpMetric[] = [];
  private errors: ErrorMetric[] = [];
  private slowRequests: SlowRequestMetric[] = [];

  // Limites para evitar memory leaks
  private readonly MAX_HTTP_METRICS = 1000;
  private readonly MAX_ERROR_METRICS = 500;
  private readonly MAX_SLOW_METRICS = 200;

  /**
   * Registra uma métrica de requisição HTTP
   */
  recordHttpRequest(metric: HttpMetric): void {
    this.httpRequests.push(metric);

    // Manter apenas as últimas N métricas
    if (this.httpRequests.length > this.MAX_HTTP_METRICS) {
      this.httpRequests.shift();
    }
  }

  /**
   * Registra uma métrica de erro
   */
  recordError(metric: ErrorMetric): void {
    this.errors.push(metric);

    if (this.errors.length > this.MAX_ERROR_METRICS) {
      this.errors.shift();
    }

    // Log de alerta para erros
    this.logger.error(
      `Error recorded: ${metric.method} ${metric.route} - ${metric.error} (${metric.statusCode})`,
    );
  }

  /**
   * Registra uma requisição lenta
   */
  recordSlowRequest(metric: SlowRequestMetric): void {
    this.slowRequests.push({
      ...metric,
      timestamp: new Date(),
    });

    if (this.slowRequests.length > this.MAX_SLOW_METRICS) {
      this.slowRequests.shift();
    }

    // Log de warning para requests lentas
    this.logger.warn(
      `Slow request detected: ${metric.method} ${metric.route} - ${metric.duration}ms`,
    );
  }

  /**
   * Obtém resumo das métricas HTTP da última hora
   */
  getHttpMetrics(): HttpMetricsSummary {
    const now = Date.now();
    const oneHourAgo = now - 3600000; // 1 hora em ms

    const recentRequests = this.httpRequests.filter(r => r.timestamp.getTime() > oneHourAgo);

    if (recentRequests.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        errorRequests: 0,
        avgDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        requestsPerMinute: 0,
        errorRate: '0.00',
      };
    }

    const totalRequests = recentRequests.length;
    const successfulRequests = recentRequests.filter(r => r.statusCode < 400).length;
    const errorRequests = recentRequests.filter(r => r.statusCode >= 400).length;

    // Calcular duração média
    const durations = recentRequests.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    // Calcular percentis
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p99Index = Math.floor(sortedDurations.length * 0.99);
    const p95Duration = sortedDurations[p95Index] ?? 0;
    const p99Duration = sortedDurations[p99Index] ?? 0;

    // Calcular taxa de erro
    const errorRate =
      totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(2) : '0.00';

    return {
      totalRequests,
      successfulRequests,
      errorRequests,
      avgDuration: Math.round(avgDuration),
      p95Duration: Math.round(p95Duration),
      p99Duration: Math.round(p99Duration),
      requestsPerMinute: Math.round(totalRequests / 60),
      errorRate,
    };
  }

  /**
   * Obtém resumo das métricas de erro da última hora
   */
  getErrorMetrics(): ErrorMetricsSummary {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    const recentErrors = this.errors.filter(e => e.timestamp.getTime() > oneHourAgo);

    // Agrupar erros por tipo
    const errorsByType = recentErrors.reduce(
      (acc, error) => {
        acc[error.error] = (acc[error.error] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Agrupar erros por rota
    const errorsByRoute = recentErrors.reduce(
      (acc, error) => {
        acc[error.route] = (acc[error.route] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsByRoute,
      recentErrors: recentErrors.slice(-10), // Últimos 10 erros
    };
  }

  /**
   * Obtém métricas de requisições lentas
   */
  getSlowRequestMetrics(): {
    totalSlowRequests: number;
    slowRequests: SlowRequestMetric[];
  } {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    const recentSlowRequests = this.slowRequests.filter(r => r.timestamp.getTime() > oneHourAgo);

    return {
      totalSlowRequests: recentSlowRequests.length,
      slowRequests: recentSlowRequests.slice(-20), // Últimas 20
    };
  }

  /**
   * Obtém métricas do sistema (memória, CPU, etc)
   */
  getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      },
      uptime: Math.round(uptime), // segundos
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  /**
   * Obtém todas as métricas
   */
  getAllMetrics(): {
    http: HttpMetricsSummary;
    errors: ErrorMetricsSummary;
    slowRequests: {
      totalSlowRequests: number;
      slowRequests: SlowRequestMetric[];
    };
    system: SystemMetrics;
    timestamp: string;
  } {
    return {
      http: this.getHttpMetrics(),
      errors: this.getErrorMetrics(),
      slowRequests: this.getSlowRequestMetrics(),
      system: this.getSystemMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Limpa todas as métricas (útil para testes)
   */
  clearMetrics(): void {
    this.httpRequests = [];
    this.errors = [];
    this.slowRequests = [];
    this.logger.log('All metrics cleared');
  }
}
