import { Test, TestingModule } from "@nestjs/testing";
import { TokenBucketStrategy } from "./token-bucket.strategy";
import { RedisService } from "@nexus/redis";
import type {
  RateLimitRequest,
  RateLimitRuleConfig,
} from "../interfaces/rate-limit-strategy.interface";

const makeRequest = (overrides?: Partial<RateLimitRequest>): RateLimitRequest => ({
  ip: "192.168.1.1",
  userId: "user-123",
  endpoint: "GET /api/test",
  clientId: "client-abc",
  ...overrides,
});

const makeRule = (overrides?: Partial<RateLimitRuleConfig>): RateLimitRuleConfig => ({
  id: "rule-1",
  type: "IP",
  limit: 10,
  windowSize: 60000,
  strategy: "TOKEN_BUCKET",
  priority: 1,
  isActive: true,
  ...overrides,
});

describe("TokenBucketStrategy", () => {
  let strategy: TokenBucketStrategy;
  let mockRedisClient: {
    hGetAll: jest.Mock;
    hSet: jest.Mock;
    expire: jest.Mock;
  };
  let mockRedisService: jest.Mocked<Pick<RedisService, "getRedisClient">>;

  beforeEach(async () => {
    const now = Date.now();

    mockRedisClient = {
      hGetAll: jest.fn().mockResolvedValue({
        tokens: "10",
        lastRefill: String(now),
      }),
      hSet: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
    };

    mockRedisService = {
      getRedisClient: jest.fn().mockReturnValue(mockRedisClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenBucketStrategy, { provide: RedisService, useValue: mockRedisService }],
    }).compile();

    strategy = module.get<TokenBucketStrategy>(TokenBucketStrategy);
  });

  describe("getName", () => {
    it("deve retornar TOKEN_BUCKET", () => {
      expect(strategy.getName()).toBe("TOKEN_BUCKET");
    });
  });

  describe("checkLimit", () => {
    it("deve permitir request quando há tokens disponíveis", async () => {
      mockRedisClient.hGetAll.mockResolvedValue({
        tokens: "5",
        lastRefill: String(Date.now()),
      });

      const result = await strategy.checkLimit(makeRequest(), makeRule());

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10);
    });

    it("deve bloquear quando não há tokens disponíveis", async () => {
      mockRedisClient.hGetAll.mockResolvedValue({
        tokens: "0.3",
        lastRefill: String(Date.now()),
      });

      const result = await strategy.checkLimit(makeRequest(), makeRule());

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("deve consumir um token ao permitir request", async () => {
      mockRedisClient.hGetAll.mockResolvedValue({
        tokens: "8",
        lastRefill: String(Date.now()),
      });

      await strategy.checkLimit(makeRequest(), makeRule());

      expect(mockRedisClient.hSet).toHaveBeenCalledTimes(1);
      const call = mockRedisClient.hSet.mock.calls[0] as [string, string[]];
      const tokensIndex = call[1].indexOf("tokens");
      const savedTokens = parseFloat(call[1][tokensIndex + 1]);
      expect(savedTokens).toBeCloseTo(7, 0);
    });

    it("deve recarregar tokens baseado no tempo decorrido", async () => {
      const fiveSecondsAgo = Date.now() - 5000;
      // limit=10, windowSize=60000 → refillRate = 10/60 ≈ 0.167 tokens/s
      // 5s × 0.167 ≈ 0.833 tokens adicionados a 2 tokens existentes
      mockRedisClient.hGetAll.mockResolvedValue({
        tokens: "2",
        lastRefill: String(fiveSecondsAgo),
      });

      const result = await strategy.checkLimit(
        makeRequest(),
        makeRule({ limit: 10, windowSize: 60000 }),
      );

      expect(result.allowed).toBe(true);
    });

    it("deve usar bucket cheio quando não há dados em Redis", async () => {
      mockRedisClient.hGetAll.mockResolvedValue({});

      const result = await strategy.checkLimit(makeRequest(), makeRule({ limit: 10 }));

      expect(result.allowed).toBe(true);
    });

    it("deve retornar fail-open quando Redis indisponível", async () => {
      mockRedisService.getRedisClient.mockReturnValue(null);

      const result = await strategy.checkLimit(makeRequest(), makeRule());

      expect(result.allowed).toBe(true);
    });

    it("deve retornar fail-open em caso de erro no Redis", async () => {
      mockRedisClient.hGetAll.mockRejectedValue(new Error("Redis error"));

      const result = await strategy.checkLimit(makeRequest(), makeRule());

      expect(result.allowed).toBe(true);
    });

    it("deve definir expiração na chave", async () => {
      mockRedisClient.hGetAll.mockResolvedValue({
        tokens: "5",
        lastRefill: String(Date.now()),
      });

      await strategy.checkLimit(makeRequest(), makeRule({ windowSize: 60000 }));

      expect(mockRedisClient.expire).toHaveBeenCalledWith(expect.any(String), 120);
    });

    it("deve usar refillRate customizado quando fornecido", async () => {
      mockRedisClient.hGetAll.mockResolvedValue({
        tokens: "1",
        lastRefill: String(Date.now()),
      });

      const result = await strategy.checkLimit(
        makeRequest(),
        makeRule({ limit: 10, windowSize: 60000, refillRate: 5 }),
      );

      expect(result.allowed).toBe(true);
    });

    it("deve incluir resetTime no resultado bloqueado", async () => {
      mockRedisClient.hGetAll.mockResolvedValue({
        tokens: "0",
        lastRefill: String(Date.now()),
      });

      const result = await strategy.checkLimit(makeRequest(), makeRule());

      expect(result.resetTime).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe("generateKey", () => {
    it("deve incluir prefixo token_bucket na chave", () => {
      const key = strategy.generateKey(makeRequest(), makeRule({ type: "IP" }));
      expect(key).toContain("token_bucket");
    });

    it("deve incluir IP na chave para tipo IP", () => {
      const key = strategy.generateKey(makeRequest({ ip: "172.16.0.1" }), makeRule({ type: "IP" }));
      expect(key).toContain("172.16.0.1");
    });
  });
});
