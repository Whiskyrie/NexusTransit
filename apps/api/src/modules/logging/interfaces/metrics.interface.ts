/**
 * Interface para métricas de requisição HTTP
 */
export interface HttpMetric {
  method: string;
  route: string;
  statusCode: number;
  duration: number;
  // CORREÇÃO: Adicionado '| undefined' para satisfazer exactOptionalPropertyTypes: true
  userId?: string | undefined;
  timestamp: Date;
}

/**
 * Interface para métricas de erro
 */
export interface ErrorMetric {
  method: string;
  route: string;
  error: string;
  statusCode: number;
  duration: number;
  userId?: string | undefined;
  timestamp: Date;
}

/**
 * Interface para métricas de requisições lentas
 */
export interface SlowRequestMetric {
  method: string;
  route: string;
  duration: number;
  userId?: string | undefined;
  timestamp: Date;
}

/**
 * Interface para resumo de métricas HTTP
 */
export interface HttpMetricsSummary {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  avgDuration: number;
  p95Duration: number;
  p99Duration: number;
  requestsPerMinute: number;
  errorRate: string;
}

/**
 * Interface para resumo de métricas de erro
 */
export interface ErrorMetricsSummary {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByRoute: Record<string, number>;
  recentErrors: ErrorMetric[];
}

/**
 * Interface para métricas do sistema
 */
export interface SystemMetrics {
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  uptime: number;
  nodeVersion: string;
  platform: string;
}
