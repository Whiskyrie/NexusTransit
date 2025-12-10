import { Injectable, Inject, OnModuleDestroy, Logger } from "@nestjs/common";
import Keyv from "keyv";
import { RedisClientType } from "redis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly keyv: Keyv;
  private redisClient: RedisClientType | null = null;

  constructor(@Inject("KEYV_INSTANCE") keyvInstance: Keyv) {
    this.keyv = keyvInstance;
    this.extractRedisClient();
  }

  private extractRedisClient() {
    try {
      // Keyv stores the store adapter in opts.store
      // @keyv/redis stores the redis client in the redis property
      const store = this.keyv.opts.store as any;
      if (store && store.redis) {
        this.redisClient = store.redis as RedisClientType;
        this.logger.log("Native Redis client extracted successfully");
      } else {
        this.logger.warn("Could not extract native Redis client from Keyv");
      }
    } catch (error) {
      this.logger.error("Error extracting Redis client", error);
    }
  }

  async onModuleDestroy() {
    this.logger.log("Disconnecting Redis...");
    await this.keyv.disconnect();
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    return this.keyv.get(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    return this.keyv.set(key, value, ttl);
  }

  async delete(key: string): Promise<boolean> {
    return this.keyv.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const value = await this.keyv.get(key);
    return value !== undefined;
  }

  async clear(): Promise<void> {
    await this.keyv.clear();
  }

  getRedisClient(): RedisClientType | null {
    return this.redisClient;
  }
}
