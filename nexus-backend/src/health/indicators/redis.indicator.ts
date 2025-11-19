import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from '../../modules/redis/redis.service';

/**
 * Health Indicator customizado para Redis
 *
 * Verifica se o Redis está respondendo corretamente
 * usando ping/pong
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Tenta fazer um set/get simples para validar conexão
      const testKey = '__health_check__';
      const testValue = Date.now().toString();

      await this.redisService.set(testKey, testValue, 5000); // 5 segundos de TTL
      const retrievedValue = await this.redisService.get(testKey);

      const isHealthy = retrievedValue === testValue;

      const result = this.getStatus(key, isHealthy, {
        message: isHealthy ? 'Redis is up and responding' : 'Redis connection issue',
      });

      if (!isHealthy) {
        throw new HealthCheckError('Redis check failed', result);
      }

      return result;
    } catch (error) {
      const result = this.getStatus(key, false, {
        message: error instanceof Error ? error.message : 'Redis check failed',
      });
      throw new HealthCheckError('Redis check failed', result);
    }
  }
}
