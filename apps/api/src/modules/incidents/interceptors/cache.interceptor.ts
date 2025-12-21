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
import type { Cache } from 'cache-manager';
import { CACHEABLE_KEY, type CacheableOptions } from '../decorators/cacheable.decorator';

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

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<unknown>();
    const args = context.getArgs();

    const cacheKey = this.generateCacheKey(options, request, args);

    const cachedValue: unknown = await this.cacheManager.get(cacheKey);

    if (cachedValue !== null && cachedValue !== undefined) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return of(cachedValue);
    }

    this.logger.debug(`Cache miss: ${cacheKey}`);

    return next.handle().pipe(
      tap(data => {
        if (data !== null && data !== undefined) {
          void this.cacheManager.set(cacheKey, data, options.ttl ?? 60).then(() => {
            this.logger.debug(`Cached: ${cacheKey} (TTL: ${options.ttl}s)`);
          });
        }
      }),
    );
  }

  private generateCacheKey(options: CacheableOptions, _request: unknown, args: unknown[]): string {
    if (options.keyGenerator) {
      return options.keyGenerator(...args);
    }

    const keyParts: string[] = [options.keyPrefix ?? 'cache'];

    if (options.useArgs && args.length > 0) {
      args.forEach((arg, index) => {
        if (arg && typeof arg === 'object') {
          const serialized = JSON.stringify(arg);
          keyParts.push(`arg${index}:${this.hashString(serialized)}`);
        } else if (arg !== null && arg !== undefined) {
          const argValue =
            typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean'
              ? String(arg)
              : this.hashString(JSON.stringify(arg));
          keyParts.push(`arg${index}:${argValue}`);
        }
      });
    }

    return keyParts.join(':');
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
