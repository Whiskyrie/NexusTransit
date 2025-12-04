import { registerAs } from '@nestjs/config';

/**
 * Configuração de Rate Limiting
 *
 * Configurações padrão para o sistema de rate limiting e throttling
 */
export interface RateLimitConfiguration {
  /**
   * Habilitar rate limiting globalmente
   */
  enabled: boolean;

  /**
   * Limites padrão
   */
  defaults: {
    /**
     * Limite padrão de requisições
     */
    limit: number;

    /**
     * Janela de tempo padrão (ms)
     */
    windowMs: number;

    /**
     * Estratégia padrão: SLIDING_WINDOW, TOKEN_BUCKET, FIXED_WINDOW
     */
    strategy: string;
  };

  /**
   * Configurações de auto-blocking
   */
  autoBlock: {
    /**
     * Habilitar auto-blocking de IPs suspeitos
     */
    enabled: boolean;

    /**
     * Número de violações antes de bloquear
     */
    threshold: number;

    /**
     * Duração do bloqueio (ms)
     */
    duration: number;
  };

  /**
   * Configurações de monitoramento
   */
  monitoring: {
    /**
     * Habilitar monitoramento de métricas
     */
    enabled: boolean;

    /**
     * Intervalo de análise de padrões de abuso (ms)
     */
    analysisInterval: number;
  };

  /**
   * Configurações de alertas
   */
  alerts: {
    /**
     * Habilitar sistema de alertas
     */
    enabled: boolean;

    /**
     * Email para envio de alertas
     */
    emailRecipient?: string | undefined;

    /**
     * Webhook para envio de alertas
     */
    webhookUrl?: string | undefined;
  };

  /**
   * Whitelisted paths (bypass de rate limiting)
   */
  whitelistedPaths: string[];
}

export default registerAs(
  'rateLimit',
  (): RateLimitConfiguration => ({
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',

    defaults: {
      limit: parseInt(process.env.RATE_LIMIT_DEFAULT_LIMIT ?? '100', 10),
      windowMs: parseInt(process.env.RATE_LIMIT_DEFAULT_WINDOW_MS ?? '60000', 10),
      strategy: process.env.RATE_LIMIT_DEFAULT_STRATEGY ?? 'SLIDING_WINDOW',
    },

    autoBlock: {
      enabled: process.env.RATE_LIMIT_AUTO_BLOCK_ENABLED !== 'false',
      threshold: parseInt(process.env.RATE_LIMIT_AUTO_BLOCK_THRESHOLD ?? '20', 10),
      duration: parseInt(
        process.env.RATE_LIMIT_AUTO_BLOCK_DURATION_MS ?? String(24 * 60 * 60 * 1000),
        10,
      ), // 24 horas
    },

    monitoring: {
      enabled: process.env.RATE_LIMIT_MONITORING_ENABLED !== 'false',
      analysisInterval: parseInt(
        process.env.RATE_LIMIT_ANALYSIS_INTERVAL_MS ?? String(5 * 60 * 1000),
        10,
      ), // 5 minutos
    },

    alerts: {
      enabled: process.env.RATE_LIMIT_ALERTS_ENABLED !== 'false',
      ...(process.env.RATE_LIMIT_ALERT_EMAIL && {
        emailRecipient: process.env.RATE_LIMIT_ALERT_EMAIL,
      }),
      ...(process.env.RATE_LIMIT_ALERT_WEBHOOK_URL && {
        webhookUrl: process.env.RATE_LIMIT_ALERT_WEBHOOK_URL,
      }),
    },

    whitelistedPaths: [
      '/health',
      '/health/live',
      '/health/ready',
      '/metrics',
      '/api/docs',
      '/api-docs',
      '/swagger',
      '/api/health',
      ...(process.env.RATE_LIMIT_WHITELISTED_PATHS?.split(',').map(p => p.trim()) ?? []),
    ],
  }),
);
