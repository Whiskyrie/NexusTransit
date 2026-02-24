import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule } from "./redis.module";
import { RedisService } from "./redis.service";

interface ProviderDef {
  provide?: unknown;
  useValue?: unknown;
  useFactory?: (...args: unknown[]) => unknown;
  inject?: unknown[];
}

describe("RedisModule", () => {
  describe("forRootAsync", () => {
    it("should return a DynamicModule", () => {
      const result = RedisModule.forRootAsync();

      expect(result).toBeDefined();
      expect(result.module).toBe(RedisModule);
    });

    it("should import ConfigModule", () => {
      const result = RedisModule.forRootAsync();

      expect(result.imports).toContain(ConfigModule);
    });

    it("should provide the KEYV_INSTANCE token", () => {
      const result = RedisModule.forRootAsync();

      const keyvProvider = result.providers?.find(
        (p) => (p as ProviderDef).provide === "KEYV_INSTANCE",
      ) as ProviderDef | undefined;

      expect(keyvProvider).toBeDefined();
      expect(typeof (keyvProvider as ProviderDef).useFactory).toBe("function");
    });

    it("should inject ConfigService into KEYV_INSTANCE factory", () => {
      const result = RedisModule.forRootAsync();

      const keyvProvider = result.providers?.find(
        (p) => (p as ProviderDef).provide === "KEYV_INSTANCE",
      ) as ProviderDef | undefined;

      expect(keyvProvider?.inject).toContain(ConfigService);
    });

    it("should provide RedisService", () => {
      const result = RedisModule.forRootAsync();

      const hasRedisService = result.providers?.some(
        (p) => p === RedisService || (p as ProviderDef).provide === RedisService,
      );

      expect(hasRedisService).toBe(true);
    });

    it("should export RedisService", () => {
      const result = RedisModule.forRootAsync();

      expect(result.exports).toContain(RedisService);
    });

    it("should have only one KEYV_INSTANCE provider", () => {
      const result = RedisModule.forRootAsync();

      const keyvProviders = result.providers?.filter(
        (p) => (p as ProviderDef).provide === "KEYV_INSTANCE",
      );

      expect(keyvProviders?.length).toBe(1);
    });

    describe("KEYV_INSTANCE factory", () => {
      it("should call the factory and return a Keyv instance", async () => {
        const mockConfigService = {
          get: jest.fn().mockReturnValue("redis://localhost:6379"),
        } as unknown as ConfigService;

        const result = RedisModule.forRootAsync();

        const keyvProvider = result.providers?.find(
          (p) => (p as ProviderDef).provide === "KEYV_INSTANCE",
        ) as ProviderDef;

        const factory = keyvProvider.useFactory as (
          configService: ConfigService,
        ) => Promise<unknown>;

        // Mock Keyv and KeyvRedis to avoid actual Redis connection
        jest.mock("keyv", () => {
          return jest.fn().mockImplementation(() => ({
            on: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn(),
            disconnect: jest.fn(),
            opts: { store: null },
          }));
        });

        jest.mock("@keyv/redis", () => {
          return jest.fn().mockImplementation(() => ({}));
        });

        const keyv = await factory(mockConfigService);
        expect(keyv).toBeDefined();
        expect(mockConfigService.get).toHaveBeenCalledWith("REDIS_URL", "redis://localhost:6379");
      });
    });
  });
});
