import { Module, Global, DynamicModule, Provider } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import Keyv from "keyv";
import KeyvRedis from "@keyv/redis";
import { RedisService } from "./redis.service";

@Global()
@Module({})
export class RedisModule {
  static forRootAsync(): DynamicModule {
    const keyvProvider: Provider = {
      provide: "KEYV_INSTANCE",
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>("REDIS_URL", "redis://localhost:6379");

        const keyv = new Keyv({
          store: new KeyvRedis(redisUrl),
          namespace: "nexus",
        });

        keyv.on("error", (err) => console.error("Keyv connection error:", err));

        return keyv;
      },
      inject: [ConfigService],
    };

    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [keyvProvider, RedisService],
      exports: [RedisService],
    };
  }
}
