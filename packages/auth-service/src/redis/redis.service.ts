import { Inject, Injectable, Logger } from '@nestjs/common';
import type Keyv from 'keyv';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject('KEYV_INSTANCE') private readonly keyv: Keyv) {}

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
