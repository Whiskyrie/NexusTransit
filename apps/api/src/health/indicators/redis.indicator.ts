import { Injectable } from '@nestjs/common';
import { HealthIndicatorService, HealthIndicatorResult } from '@nestjs/terminus';
import { RedisService } from '@nexus/redis';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly redisService: RedisService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      const testKey = '__health_check__';
      const testValue = Date.now().toString();

      await this.redisService.set(testKey, testValue, 5000);
      const retrievedValue = (await this.redisService.get(testKey)) as string | null;

      if (retrievedValue === testValue) {
        return indicator.up({ message: 'Redis is up and responding' });
      }

      return indicator.down({ message: 'Redis connection issue' });
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'Redis check failed',
      });
    }
  }
}
