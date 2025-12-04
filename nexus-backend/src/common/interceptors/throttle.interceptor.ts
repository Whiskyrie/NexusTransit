import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import type { Request, Response } from 'express';

/**
 * Configuração do interceptor de throttling
 */
export interface ThrottleConfig {
  /**
   * Limite de requisições
   */
  limit: number;

  /**
   * Janela de tempo em milissegundos
   */
  windowMs: number;

  /**
   * Mensagem customizada quando exceder o limite
   */
  message?: string;

  /**
   * Função para gerar chave única por requisição
   * Padrão: IP do cliente
   */
  keyGenerator?: (req: Request) => string;

  /**
   * Função para determinar se deve aplicar throttling
   * Retorna false para pular o throttling
   */
  skipIf?: (req: Request) => boolean;
}

/**
 * Armazenamento em memória para tracking de requisições
 * Para produção, usar Redis via RateLimitService
 */
type ThrottleStore = Record<
  string,
  {
    count: number;
    resetTime: number;
  }
>;

/**
 * Interceptor de Throttling Reutilizável
 *
 * Interceptor genérico para aplicar throttling em diferentes contextos.
 * Útil para endpoints específicos que precisam de controle de taxa
 * diferente do rate limiting global.
 *
 * @example
 * ```typescript
 * // No controller
 * @UseInterceptors(new ThrottleInterceptor({
 *   limit: 5,
 *   windowMs: 60000, // 1 minuto
 * }))
 * @Post('upload')
 * async uploadFile() {
 *   // ...
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Globalmente no module
 * {
 *   provide: APP_INTERCEPTOR,
 *   useValue: new ThrottleInterceptor({
 *     limit: 100,
 *     windowMs: 60000,
 *     skipIf: (req) => req.path.startsWith('/health'),
 *   }),
 * }
 * ```
 */
@Injectable()
export class ThrottleInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ThrottleInterceptor.name);
  private readonly store: ThrottleStore = {};
  private readonly config: Required<ThrottleConfig>;

  constructor(config: ThrottleConfig) {
    this.config = {
      limit: config.limit,
      windowMs: config.windowMs,
      message: config.message ?? 'Too many requests, please try again later',
      keyGenerator: config.keyGenerator ?? this.defaultKeyGenerator.bind(this),
      skipIf: config.skipIf ?? (() => false),
    };

    // Limpeza periódica do store (a cada 5 minutos)
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Verificar se deve pular throttling
    if (this.config.skipIf(request)) {
      return next.handle();
    }

    // Gerar chave única
    const key = this.config.keyGenerator(request);
    const now = Date.now();

    // Obter ou criar entrada no store
    let entry = this.store[key];

    // Criar nova entrada se não existir ou estiver expirada
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      this.store[key] = entry;
    }

    // Incrementar contador
    entry.count++;

    // Adicionar headers de rate limit
    response.setHeader('X-RateLimit-Limit', this.config.limit.toString());
    response.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, this.config.limit - entry.count).toString(),
    );
    response.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());

    // Verificar se excedeu o limite
    if (entry.count > this.config.limit) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      this.logger.warn(`Throttle limit exceeded for key: ${key}`, {
        key,
        limit: this.config.limit,
        current: entry.count,
        retryAfter,
        path: request.path,
        method: request.method,
      });

      response.setHeader('Retry-After', retryAfter.toString());

      throw new HttpException(
        {
          message: this.config.message,
          error: 'Too Many Requests',
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.debug(`Request processed for key: ${key}`, {
          key,
          duration,
          remaining: this.config.limit - entry.count,
        });
      }),
      catchError((error: Error) => {
        this.logger.error(`Error processing request for key: ${key}`, {
          key,
          error: error.message,
        });
        return throwError(() => error);
      }),
    );
  }

  /**
   * Gerador de chave padrão: IP do cliente
   */
  private defaultKeyGenerator(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIp = req.headers['x-real-ip'] as string;
    const clientIp = req.headers['x-client-ip'] as string;

    if (forwarded) {
      return `throttle:${forwarded.split(',')[0]?.trim()}`;
    }

    return `throttle:${realIp ?? clientIp ?? req.socket.remoteAddress ?? '127.0.0.1'}`;
  }

  /**
   * Remove entradas expiradas do store
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const key in this.store) {
      if (this.store[key]?.resetTime && this.store[key].resetTime <= now) {
        delete this.store[key];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired throttle entries`);
    }
  }

  /**
   * Reseta o contador para uma chave específica
   * Útil para testes ou casos especiais
   */
  reset(key: string): void {
    delete this.store[key];
  }

  /**
   * Limpa todo o store
   */
  resetAll(): void {
    for (const key in this.store) {
      delete this.store[key];
    }
    this.logger.log('All throttle entries cleared');
  }

  /**
   * Obtém estatísticas do throttling
   */
  getStats(): {
    totalKeys: number;
    entries: { key: string; count: number; resetTime: Date }[];
  } {
    const entries = Object.entries(this.store).map(([key, value]) => ({
      key,
      count: value.count,
      resetTime: new Date(value.resetTime),
    }));

    return {
      totalKeys: entries.length,
      entries,
    };
  }
}
