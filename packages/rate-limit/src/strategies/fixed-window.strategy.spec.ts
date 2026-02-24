import { Test, TestingModule } from "@nestjs/testing";
import { FixedWindowStrategy } from "./fixed-window.strategy";
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
  strategy: "FIXED_WINDOW",
  priority: 1,
  isActive: true,
  ...overrides,
});

describe("FixedWindowStrategy", () => {
  let strategy: FixedWindowStrategy;
  let mockRedisClient: {
    get: jest.Mock;
    incr: jest.Mock;
    expire: jest.Mock;
  };
  let mockRedisService: jest.Mocked<Pick<RedisService, "getRedisClient">>;

  beforeEach(async () => {
    mockRedisClient = {
      get: jest.fn().mockResolvedValue(null),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
    };

    mockRedisService = {
      getRedisClient: jest.fn().mockReturnValue(mockRedisClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FixedWindowStrategy, { provide: RedisService, useValue: mockRedisService }],
    }).compile();

    strategy = module.get<FixedWindowStrategy>(FixedWindowStrategy);
  });

  describe("getName", () => {
    it("deve retornar FIXED_WINDOW", () => {
      expect(strategy.getName()).toBe("FIXED_WINDOW");
    });
  });

  describe("checkLimit", () => {
    it("deve permitir primeiro request (contador zerado)", async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.incr.mockResolvedValue(1);

      const result = await strategy.checkLimit(makeRequest(), makeRule({ limit: 10 }));

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(1);
      expect(result.remaining).toBe(9);
    });

    it("deve permitir request abaixo do limite", async () => {
      mockRedisClient.get.mockResolvedValue("5");
      mockRedisClient.incr.mockResolvedValue(6);

      const result = await strategy.checkLimit(makeRequest(), makeRule({ limit: 10 }));

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(6);
      expect(result.remaining).toBe(4);
    });

    it("deve bloquear quando o limite foi atingido", async () => {
      mockRedisClient.get.mockResolvedValue("10");

      const result = await strategy.checkLimit(makeRequest(), makeRule({ limit: 10 }));

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.current).toBe(10);
    });

    it("deve definir expiração apenas na primeira request da janela", async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.incr.mockResolvedValue(1);

      await strategy.checkLimit(makeRequest(), makeRule({ windowSize: 60000 }));

      expect(mockRedisClient.expire).toHaveBeenCalledWith(expect.any(String), 60);
    });

    it("não deve definir expiração em requests subsequentes", async () => {
      mockRedisClient.get.mockResolvedValue("3");
      mockRedisClient.incr.mockResolvedValue(4);

      await strategy.checkLimit(makeRequest(), makeRule());

      expect(mockRedisClient.expire).not.toHaveBeenCalled();
    });

    it("deve incluir resetTime no resultado", async () => {
      const now = Date.now();
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.incr.mockResolvedValue(1);

      const result = await strategy.checkLimit(makeRequest(), makeRule());

      expect(result.resetTime).toBeGreaterThan(now);
    });

    it("deve usar chave com timestamp da janela atual", async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.incr.mockResolvedValue(1);

      await strategy.checkLimit(makeRequest(), makeRule({ windowSize: 60000 }));

      const getCall = mockRedisClient.get.mock.calls[0] as [string];
      expect(getCall[0]).toMatch(/:\d+$/);
    });

    it("deve retornar fail-open quando Redis indisponível", async () => {
      mockRedisService.getRedisClient.mockReturnValue(null);

      const result = await strategy.checkLimit(makeRequest(), makeRule());

      expect(result.allowed).toBe(true);
    });

    it("deve retornar fail-open em caso de erro no Redis", async () => {
      mockRedisClient.get.mockRejectedValue(new Error("ECONNREFUSED"));

      const result = await strategy.checkLimit(makeRequest(), makeRule());

      expect(result.allowed).toBe(true);
    });

    it("deve retornar limit correto no resultado bloqueado", async () => {
      mockRedisClient.get.mockResolvedValue("20");

      const result = await strategy.checkLimit(makeRequest(), makeRule({ limit: 20 }));

      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(20);
    });
  });

  describe("generateKey", () => {
    it("deve incluir prefixo fixed_window na chave base", () => {
      const key = strategy.generateKey(makeRequest(), makeRule({ type: "IP" }));
      expect(key).toContain("fixed_window");
    });

    it("deve incluir IP na chave para tipo IP", () => {
      const key = strategy.generateKey(makeRequest({ ip: "10.0.0.5" }), makeRule({ type: "IP" }));
      expect(key).toContain("10.0.0.5");
    });

    it("deve incluir userId na chave para tipo USER", () => {
      const key = strategy.generateKey(
        makeRequest({ userId: "u-999" }),
        makeRule({ type: "USER" }),
      );
      expect(key).toContain("u-999");
    });
  });
});
