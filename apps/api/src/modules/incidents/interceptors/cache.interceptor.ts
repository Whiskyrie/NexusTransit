import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CACHEABLE_KEY, CacheableOptions } from '../decorators/cacheable.decorator';

/**
 * Interceptor para implementar cache automático em métodos
 * decorados com @Cacheable
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const options = this.reflector.get<CacheableOptions>(CACHEABLE_KEY, context.getHandler());

    // Se não tem decorator @Cacheable, prosseguir normalmente
    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const args = context.getArgs();

    // Gerar chave de cache
    const cacheKey = this.generateCacheKey(options, request, args);

    // Tentar obter do cache
    const cachedValue = await this.cacheManager.get(cacheKey);

    if (cachedValue !== null && cachedValue !== undefined) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return of(cachedValue);
    }

    this.logger.debug(`Cache miss: ${cacheKey}`);

    // Se não está em cache, executar e cachear resultado
    return next.handle().pipe(
      tap(async data => {
        if (data !== null && data !== undefined) {
          await this.cacheManager.set(cacheKey, data, options.ttl ?? 60);
          this.logger.debug(`Cached: ${cacheKey} (TTL: ${options.ttl}s)`);
        }
      }),
    );
  }

  /**
   * Gera chave de cache baseada nas opções e argumentos
   */
  private generateCacheKey(options: CacheableOptions, request: unknown, args: unknown[]): string {
    // Se tem gerador customizado, usar ele
    if (options.keyGenerator) {
      return options.keyGenerator(...args);
    }

    const keyParts: string[] = [options.keyPrefix ?? 'cache'];

    // Se deve usar argumentos na chave
    if (options.useArgs && args.length > 0) {
      args.forEach((arg, index) => {
        if (arg && typeof arg === 'object') {
          // Serializar objeto
          const serialized = JSON.stringify(arg);
          keyParts.push(`arg${index}:${this.hashString(serialized)}`);
        } else if (arg !== null && arg !== undefined) {
          keyParts.push(`arg${index}:${String(arg)}`);
        }
      });
    }

    return keyParts.join(':');
  }

  /**
   * Gera hash simples de string para chave de cache
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
