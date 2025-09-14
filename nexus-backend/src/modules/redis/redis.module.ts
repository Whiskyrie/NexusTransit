import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { RedisService } from './redis.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'KEYV_INSTANCE',
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('redis.host', 'localhost');
        const port = configService.get<number>('redis.port', 6379);
        const password = configService.get<string>('redis.password');

        const redisUrl = password
          ? `redis://:${password}@${host}:${port}`
          : `redis://${host}:${port}`;

        const keyvRedis = new KeyvRedis(redisUrl);
        return new Keyv({ store: keyvRedis, namespace: 'nexus' });
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['KEYV_INSTANCE', RedisService],
})
export class RedisModule {}
