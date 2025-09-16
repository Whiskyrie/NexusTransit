import type { RateLimitType } from '../enums';

/**
 * Configurações para rate limiting
 */
export interface RateLimitConfig {
  /** Tipo de rate limiting a ser aplicado */
  type: RateLimitType;

  /** Limite de requests por minuto (opcional, usa padrão do role se não especificado) */
  limit?: number;

  /** Janela de tempo em milissegundos (padrão: 60000) */
  windowMs?: number;

  /** Mensagem customizada para rate limit excedido */
  message?: string;

  /** Pular rate limiting para roles específicos */
  skipRoles?: string[];

  /** Chave customizada para agrupamento de requests */
  customKey?: string;

  /** Pular rate limiting completamente */
  skip?: boolean;

  /** Overrides para roles específicos */
  roleOverrides?: Record<string, { limit: number; windowMs?: number }>;
}

/**
 * Informações sobre o status atual do rate limiting
 */
export interface RateLimitInfo {
  /** Limite total para este usuário/IP */
  limit: number;

  /** Requests restantes na janela atual */
  remaining: number;

  /** Timestamp quando o limite será resetado */
  resetTime: number;

  /** Tempo até o reset em milissegundos */
  retryAfter: number;

  /** Chave usada para identificar o rate limit */
  key: string;
}

/**
 * Resultado da verificação de rate limiting
 */
export interface RateLimitResult {
  /** Se o request é permitido */
  allowed: boolean;

  /** Limite total configurado */
  limit: number;

  /** Número atual de requests na janela */
  current: number;

  /** Requests restantes na janela atual */
  remaining: number;

  /** Timestamp quando o limite será resetado */
  resetTime: number;
}

/**
 * Métricas de rate limiting para monitoramento
 */
export interface RateLimitMetrics {
  /** Total de requests processados */
  totalRequests: number;

  /** Requests bloqueados por rate limiting */
  blockedRequests: number;

  /** Taxa de bloqueio (%) */
  blockRate: number;

  /** Métricas por role */
  byRole: Record<
    string,
    {
      requests: number;
      blocked: number;
      blockRate: number;
    }
  >;

  /** Métricas por endpoint */
  byEndpoint: Record<
    string,
    {
      requests: number;
      blocked: number;
      blockRate: number;
    }
  >;

  /** Timestamp da última atualização */
  lastUpdated: number;
}
