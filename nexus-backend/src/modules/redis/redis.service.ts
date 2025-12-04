import { Inject, Injectable, Logger } from '@nestjs/common';
import type Keyv from 'keyv';
import type { RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private redis: RedisClientType | null = null;

  constructor(@Inject('KEYV_INSTANCE') private readonly keyv: Keyv) {
    this.extractRedisClient();
  }

  /**
   * Extrai o cliente Redis nativo do Keyv store
   */
  private extractRedisClient(): void {
    try {
      const keyvInternal = this.keyv as unknown as {
        opts?: {
          store?: {
            redis?: RedisClientType;
          };
        };
      };

      const redisClient = keyvInternal.opts?.store?.redis;

      if (redisClient) {
        this.redis = redisClient;
        this.logger.log('Native Redis client extracted successfully');
      } else {
        this.logger.warn('Could not extract native Redis client from Keyv');
      }
    } catch (error) {
      this.logger.error('Failed to extract Redis client', error);
    }
  }

  /**
   * Retorna o cliente Redis nativo (se disponível)
   *
   * @returns Cliente Redis tipado ou null se não disponível
   */
  getRedisClient(): RedisClientType | null {
    return this.redis;
  }

  /**
   * Armazena um valor no Redis com TTL opcional
   */
  async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
    try {
      await this.keyv.set(key, value, ttl);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao definir chave ${key}`, error);
      return false;
    }
  }

  /**
   * Recupera um valor do Redis
   */
  async get<T = unknown>(key: string): Promise<T | undefined> {
    try {
      return await this.keyv.get<T>(key);
    } catch (error) {
      this.logger.error(`Erro ao obter chave ${key}`, error);
      return undefined;
    }
  }

  /**
   * Remove uma chave do Redis
   */
  async delete(key: string): Promise<boolean> {
    try {
      return await this.keyv.delete(key);
    } catch (error) {
      this.logger.error(`Erro ao deletar chave ${key}`, error);
      return false;
    }
  }

  /**
   * Verifica se uma chave existe no Redis
   */
  async has(key: string): Promise<boolean> {
    try {
      const value: string | number | object | null | undefined = await this.keyv.get(key);
      return value !== undefined;
    } catch (error) {
      this.logger.error(`Erro ao verificar existência da chave ${key}`, error);
      return false;
    }
  }

  /**
   * Limpa todas as chaves do namespace
   */
  async clear(): Promise<void> {
    try {
      await this.keyv.clear();
    } catch (error) {
      this.logger.error('Erro ao limpar cache', error);
    }
  }
}
