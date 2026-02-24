import { Test, TestingModule } from "@nestjs/testing";
import { SlidingWindowStrategy } from "./sliding-window.strategy";
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
  strategy: "SLIDING_WINDOW",
  priority: 1,
  isActive: true,
  ...overrides,
});

describe("SlidingWindowStrategy", () => {
  let strategy: SlidingWindowStrategy;
  let mockRedisClient: {
    zRemRangeByScore: jest.Mock;
    zCard: jest.Mock;
    zRangeWithScores: jest.Mock;
    zAdd: jest.Mock;
    expire: jest.Mock;
  };
  let mockRedisService: jest.Mocked<Pick<RedisService, "getRedisClient">>;

  beforeEach(async () => {
    mockRedisClient = {
      zRemRangeByScore: jest.fn().mockResolvedValue(0),
      zCard: jest.fn().mockResolvedValue(0),
      zRangeWithScores: jest.fn().mockResolvedValue([]),
      zAdd: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
    };

    mockRedisService = {
      getRedisClient: jest.fn().mockReturnValue(mockRedisClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SlidingWindowStrategy, { provide: RedisService, useValue: mockRedisService }],
    }).compile();

    strategy = module.get<SlidingWindowStrategy>(SlidingWindowStrategy);
  });

  describe("getName", () => {
    it("deve retornar SLIDING_WINDOW", () => {
      expect(strategy.getName()).toBe("SLIDING_WINDOW");
    });
  });

  describe("checkLimit", () => {
    it("deve permitir request quando abaixo do limite", async () => {
      mockRedisClient.zCard.mockResolvedValue(5);

      const result = await strategy.checkLimit(makeRequest(), makeRule({ limit: 10 }));

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.current).toBe(6);
      expect(result.remaining).toBe(4);
    });

    it("deve bloquear request quando limite excedido", async () => {
      mockRedisClient.zCard.mockResolvedValue(10);
      mockRedisClient.zRangeWithScores.mockResolvedValue([
        { score: Date.now() - 1000, value: "entry-1" },
      ]);

      const result = await strategy.checkLimit(makeRequest(), makeRule({ limit: 10 }));

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.current).toBe(10);
    });

    it("deve remover entradas expiradas da janela deslizante", async () => {
      mockRedisClient.zCard.mockResolvedValue(3);

      await strategy.checkLimit(makeRequest(), makeRule());

      expect(mockRedisClient.zRemRangeByScore).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.zRemRangeByScore).toHaveBeenCalledWith(
        expect.any(String),
        0,
        expect.any(Number),
      );
    });

    it("deve adicionar timestamp ao sorted set após permitir", async () => {
      mockRedisClient.zCard.mockResolvedValue(2);

      await strategy.checkLimit(makeRequest(), makeRule());

      expect(mockRedisClient.zAdd).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.zAdd).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ score: expect.any(Number), value: expect.any(String) }),
      );
    });

    it("deve definir expiração TTL na chave", async () => {
      mockRedisClient.zCard.mockResolvedValue(0);

      await strategy.checkLimit(makeRequest(), makeRule({ windowSize: 60000 }));

      expect(mockRedisClient.expire).toHaveBeenCalledWith(expect.any(String), 60);
    });

    it("deve retornar fail-open quando Redis indisponível", async () => {
      mockRedisService.getRedisClient.mockReturnValue(null);

      const result = await strategy.checkLimit(makeRequest(), makeRule());

      expect(result.allowed).toBe(true);
    });

    it("deve retornar fail-open em caso de erro no Redis", async () => {
      mockRedisClient.zCard.mockRejectedValue(new Error("Redis connection refused"));

      const result = await strategy.checkLimit(makeRequest(), makeRule());

      expect(result.allowed).toBe(true);
    });

    it("deve incluir resetTime no resultado ao bloquear", async () => {
      const now = Date.now();
      const oldTimestamp = now - 5000;
      mockRedisClient.zCard.mockResolvedValue(10);
      mockRedisClient.zRangeWithScores.mockResolvedValue([
        { score: oldTimestamp, value: "entry-old" },
      ]);

      const result = await strategy.checkLimit(
        makeRequest(),
        makeRule({ limit: 10, windowSize: 60000 }),
      );

      expect(result.resetTime).toBeGreaterThan(now - 1000);
    });

    it("deve gerar chaves diferentes para tipos diferentes", async () => {
      mockRedisClient.zCard.mockResolvedValue(0);

      await strategy.checkLimit(makeRequest(), makeRule({ type: "IP" }));
      await strategy.checkLimit(makeRequest(), makeRule({ type: "USER" }));

      const calls = mockRedisClient.zRemRangeByScore.mock.calls as [string, ...unknown[]][];
      expect(calls[0][0]).not.toBe(calls[1][0]);
    });

    it("deve retornar remaining 0 quando no exato limite", async () => {
      mockRedisClient.zCard.mockResolvedValue(9);

      const result = await strategy.checkLimit(makeRequest(), makeRule({ limit: 10 }));

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });
  });

  describe("generateKey", () => {
    it("deve incluir prefixo sliding_window na chave", () => {
      const key = strategy.generateKey(makeRequest(), makeRule({ type: "IP" }));
      expect(key).toContain("sliding_window");
    });

    it("deve incluir IP do cliente na chave para tipo IP", () => {
      const key = strategy.generateKey(makeRequest({ ip: "10.0.0.1" }), makeRule({ type: "IP" }));
      expect(key).toContain("10.0.0.1");
    });

    it("deve incluir userId na chave para tipo USER", () => {
      const key = strategy.generateKey(
        makeRequest({ userId: "usr-555" }),
        makeRule({ type: "USER" }),
      );
      expect(key).toContain("usr-555");
    });
  });
});
