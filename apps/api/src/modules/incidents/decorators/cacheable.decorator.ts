import { SetMetadata } from '@nestjs/common';

/**
 * Opções para o decorator @Cacheable
 */
export interface CacheableOptions {
  /**
   * Tempo de vida do cache em segundos
   */
  ttl?: number;

  /**
   * Prefixo da chave de cache
   */
  keyPrefix?: string;

  /**
   * Se true, gera chave baseada nos argumentos do método
   */
  useArgs?: boolean;

  /**
   * Função customizada para gerar chave de cache
   */
  keyGenerator?: (...args: unknown[]) => string;
}

export const CACHEABLE_KEY = 'CACHEABLE_OPTIONS';

/**
 * Decorator para marcar métodos que devem ter cache automático
 *
 * @example
 * ```typescript
 * @Cacheable({ ttl: 60, keyPrefix: 'stats' })
 * async getStats(filter: FilterDto) {
 *   return this.repository.find();
 * }
 * ```
 */
export const Cacheable = (options: CacheableOptions = {}): MethodDecorator => {
  return SetMetadata(CACHEABLE_KEY, {
    ttl: options.ttl ?? 60,
    keyPrefix: options.keyPrefix ?? 'default',
    useArgs: options.useArgs ?? true,
    keyGenerator: options.keyGenerator,
  });
};

/**
 * Decorator para invalidar cache quando método é executado
 *
 * @example
 * ```typescript
 * @InvalidateCache(['stats:*', 'dashboard:*'])
 * async createIncident(data: CreateDto) {
 *   return this.repository.save(data);
 * }
 * ```
 */
export const InvalidateCache = (patterns: string[]): MethodDecorator => {
  return SetMetadata('INVALIDATE_CACHE', patterns);
};

/**
 * Decorator para atualizar cache incrementalmente
 *
 * @example
 * ```typescript
 * @UpdateCacheIncremental('stats')
 * async updateStatus(id: string, status: Status) {
 *   return this.repository.update(id, { status });
 * }
 * ```
 */
export const UpdateCacheIncremental = (cacheKey: string): MethodDecorator => {
  return SetMetadata('UPDATE_CACHE_INCREMENTAL', cacheKey);
};
