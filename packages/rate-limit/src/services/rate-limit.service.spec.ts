import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { RateLimitService } from "./rate-limit.service";
import { RedisService } from "@nexus/redis";
import { RateLimitRule } from "../entities/rate-limit-rule.entity";
import { QuotaUsage } from "../entities/quota-usage.entity";
import { SlidingWindowStrategy } from "../strategies/sliding-window.strategy";
import { TokenBucketStrategy } from "../strategies/token-bucket.strategy";
import { FixedWindowStrategy } from "../strategies/fixed-window.strategy";
import type { RateLimitRequest } from "../interfaces/rate-limit-strategy.interface";
import { RateLimitStrategyType } from "../interfaces/rate-limit-strategy.interface";
import type { CreateRuleDto } from "../dto/create-rule.dto";
import type { UpdateRuleDto } from "../dto/update-rule.dto";

const makeRequest = (overrides?: Partial<RateLimitRequest>): RateLimitRequest => ({
  ip: "192.168.1.1",
  userId: "user-123",
  endpoint: "GET /api/trips",
  clientId: "client-abc",
  ...overrides,
});

const makeRule = (overrides?: Partial<RateLimitRule>): RateLimitRule =>
  ({
    id: "rule-1",
    name: "Default IP Rule",
    type: "IP",
    limit: 100,
    window_size: 60000,
    strategy: RateLimitStrategyType.SLIDING_WINDOW,
    priority: 1,
    is_active: true,
    endpoint: null,
    role_id: null,
    api_key_id: null,
    refill_rate: null,
    description: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as RateLimitRule;

describe("RateLimitService", () => {
  let service: RateLimitService;
  let mockRedisService: jest.Mocked<Pick<RedisService, "get" | "set" | "delete">>;
  let mockRuleRepository: jest.Mocked<Repository<RateLimitRule>>;
  let mockUsageRepository: jest.Mocked<Repository<QuotaUsage>>;
  let mockSlidingWindowStrategy: jest.Mocked<SlidingWindowStrategy>;
  let mockTokenBucketStrategy: jest.Mocked<TokenBucketStrategy>;
  let mockFixedWindowStrategy: jest.Mocked<FixedWindowStrategy>;

  beforeEach(async () => {
    const allowedResult = {
      allowed: true,
      limit: 100,
      current: 1,
      remaining: 99,
      resetTime: Date.now() + 60000,
    };

    mockSlidingWindowStrategy = {
      getName: jest.fn().mockReturnValue("SLIDING_WINDOW"),
      checkLimit: jest.fn().mockResolvedValue(allowedResult),
      generateKey: jest.fn().mockReturnValue("rate_limit:sliding:IP:192.168.1.1"),
    } as unknown as jest.Mocked<SlidingWindowStrategy>;

    mockTokenBucketStrategy = {
      getName: jest.fn().mockReturnValue("TOKEN_BUCKET"),
      checkLimit: jest.fn().mockResolvedValue(allowedResult),
      generateKey: jest.fn().mockReturnValue("rate_limit:token:IP:192.168.1.1"),
    } as unknown as jest.Mocked<TokenBucketStrategy>;

    mockFixedWindowStrategy = {
      getName: jest.fn().mockReturnValue("FIXED_WINDOW"),
      checkLimit: jest.fn().mockResolvedValue(allowedResult),
      generateKey: jest.fn().mockReturnValue("rate_limit:fixed:IP:192.168.1.1"),
    } as unknown as jest.Mocked<FixedWindowStrategy>;

    mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockRuleRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAndCount: jest.fn(),
      softRemove: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Repository<RateLimitRule>>;

    mockUsageRepository = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<Repository<QuotaUsage>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: getRepositoryToken(RateLimitRule), useValue: mockRuleRepository },
        { provide: getRepositoryToken(QuotaUsage), useValue: mockUsageRepository },
        { provide: SlidingWindowStrategy, useValue: mockSlidingWindowStrategy },
        { provide: TokenBucketStrategy, useValue: mockTokenBucketStrategy },
        { provide: FixedWindowStrategy, useValue: mockFixedWindowStrategy },
      ],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
  });

  it("deve ser definido", () => {
    expect(service).toBeDefined();
  });

  afterEach(async () => {
    // Drenar setImmediate callbacks pendentes para evitar race conditions
    await new Promise<void>((resolve) => setImmediate(resolve));
  });

  describe("checkRateLimit", () => {
    it("deve retornar resultado default (fail-open) quando não há regras", async () => {
      mockRuleRepository.find.mockResolvedValue([]);

      const result = await service.checkRateLimit(makeRequest());

      expect(result.allowed).toBe(true);
    });

    it("deve aplicar regra ativa com estratégia SLIDING_WINDOW", async () => {
      const rule = makeRule({ strategy: RateLimitStrategyType.SLIDING_WINDOW });
      mockRuleRepository.find.mockResolvedValue([rule]);
      mockSlidingWindowStrategy.checkLimit.mockResolvedValue({
        allowed: true,
        limit: 100,
        current: 5,
        remaining: 95,
        resetTime: Date.now() + 60000,
      });

      const result = await service.checkRateLimit(makeRequest());

      expect(mockSlidingWindowStrategy.checkLimit).toHaveBeenCalledTimes(1);
      expect(result.allowed).toBe(true);
    });

    it("deve aplicar regra ativa com estratégia TOKEN_BUCKET", async () => {
      const rule = makeRule({ strategy: RateLimitStrategyType.TOKEN_BUCKET });
      mockRuleRepository.find.mockResolvedValue([rule]);
      mockTokenBucketStrategy.checkLimit.mockResolvedValue({
        allowed: false,
        limit: 100,
        current: 100,
        remaining: 0,
        resetTime: Date.now() + 10000,
      });

      const result = await service.checkRateLimit(makeRequest());

      expect(result.allowed).toBe(false);
    });

    it("deve retornar fail-open em caso de erro geral", async () => {
      mockRuleRepository.find.mockRejectedValue(new Error("DB connection lost"));

      const result = await service.checkRateLimit(makeRequest());

      expect(result.allowed).toBe(true);
    });

    it("deve processar regras em ordem de prioridade", async () => {
      const rules = [
        makeRule({ id: "rule-high", priority: 1, strategy: RateLimitStrategyType.SLIDING_WINDOW }),
        makeRule({ id: "rule-low", priority: 5, strategy: RateLimitStrategyType.TOKEN_BUCKET }),
      ];
      mockRuleRepository.find.mockResolvedValue(rules);
      mockSlidingWindowStrategy.checkLimit.mockResolvedValue({
        allowed: false,
        limit: 100,
        current: 100,
        remaining: 0,
        resetTime: Date.now() + 10000,
      });

      const result = await service.checkRateLimit(makeRequest());

      // Deve parar na primeira regra que bloqueia
      expect(mockSlidingWindowStrategy.checkLimit).toHaveBeenCalledTimes(1);
      expect(mockTokenBucketStrategy.checkLimit).not.toHaveBeenCalled();
      expect(result.allowed).toBe(false);
    });
  });

  describe("checkLimit (legado)", () => {
    it("deve permitir request quando abaixo do limite", async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.checkLimit("test-key", 10, 60000);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10);
    });

    it("deve bloquear request quando limite excedido", async () => {
      const entry = {
        requests: Array.from({ length: 10 }, (_, i) => Date.now() - i * 100),
        lastReset: Date.now() - 1000,
      };
      mockRedisService.get.mockResolvedValue(entry);

      const result = await service.checkLimit("test-key", 10, 60000);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("deve filtrar requests expirados da janela", async () => {
      const now = Date.now();
      const entry = {
        requests: [
          now - 120000, // expirado (fora da janela de 60s)
          now - 90000, // expirado
          now - 5000, // válido
          now - 2000, // válido
        ],
        lastReset: now - 130000,
      };
      mockRedisService.get.mockResolvedValue(entry);

      const result = await service.checkLimit("test-key", 5, 60000);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(3); // 2 válidos + 1 novo
    });

    it("deve retornar fail-open em caso de erro no Redis", async () => {
      mockRedisService.get.mockRejectedValue(new Error("Redis error"));

      const result = await service.checkLimit("test-key", 10, 60000);

      expect(result.allowed).toBe(true);
    });

    it("deve salvar entry atualizado no Redis ao permitir", async () => {
      mockRedisService.get.mockResolvedValue(null);

      await service.checkLimit("my-key", 10, 60000);

      expect(mockRedisService.set).toHaveBeenCalledWith("my-key", expect.any(Object), 60);
    });
  });

  describe("resetLimit", () => {
    it("deve chamar delete no Redis com a chave correta", async () => {
      await service.resetLimit("rate:user:123");

      expect(mockRedisService.delete).toHaveBeenCalledWith("rate:user:123");
    });

    it("não deve lançar erro em caso de falha no Redis", async () => {
      mockRedisService.delete.mockRejectedValue(new Error("Delete failed"));

      await expect(service.resetLimit("some-key")).resolves.not.toThrow();
    });
  });

  describe("getLimitStatus", () => {
    it("deve retornar status zerado quando não há entrada no Redis", async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getLimitStatus("test-key", 10, 60000);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(0);
      expect(result.remaining).toBe(10);
    });

    it("deve retornar status com contagem atual filtrada", async () => {
      const now = Date.now();
      const entry = {
        requests: [now - 5000, now - 3000, now - 1000],
        lastReset: now - 60000,
      };
      mockRedisService.get.mockResolvedValue(entry);

      const result = await service.getLimitStatus("test-key", 10, 60000);

      expect(result.current).toBe(3);
      expect(result.remaining).toBe(7);
    });

    it("deve retornar fail-open em caso de erro no Redis", async () => {
      mockRedisService.get.mockRejectedValue(new Error("Redis down"));

      const result = await service.getLimitStatus("test-key", 10, 60000);

      expect(result.allowed).toBe(true);
    });
  });

  describe("cleanup", () => {
    it("deve executar sem erros", () => {
      expect(() => service.cleanup()).not.toThrow();
    });
  });

  describe("createRule", () => {
    const makeCreateDto = (overrides?: Partial<CreateRuleDto>): CreateRuleDto =>
      ({
        type: "IP",
        strategy: RateLimitStrategyType.SLIDING_WINDOW,
        limit: 100,
        window_size: 60000,
        priority: 1,
        is_active: true,
        ...overrides,
      }) as CreateRuleDto;

    it("deve criar uma nova regra com dados válidos", async () => {
      const dto = makeCreateDto();
      const savedRule = makeRule({ id: "new-rule-id", ...dto, window_size: dto.window_size });
      mockRuleRepository.create.mockReturnValue(savedRule);
      mockRuleRepository.save.mockResolvedValue(savedRule);

      const result = await service.createRule(dto);

      expect(result).toBeDefined();
      expect(result.id).toBe("new-rule-id");
      expect(result.limit).toBe(100);
    });

    it("deve lançar BadRequestException para estratégia inválida", async () => {
      const dto = makeCreateDto({ strategy: "INVALID_STRATEGY" as RateLimitStrategyType });

      await expect(service.createRule(dto)).rejects.toThrow(BadRequestException);
    });

    it("deve incluir campos opcionais quando fornecidos", async () => {
      const dto = makeCreateDto({
        refill_rate: 5,
        role_id: "role-123",
        endpoint: "/api/test",
        description: "Test rule",
      });
      const savedRule = makeRule({ id: "opt-rule", ...dto, window_size: dto.window_size });
      mockRuleRepository.create.mockReturnValue(savedRule);
      mockRuleRepository.save.mockResolvedValue(savedRule);

      const result = await service.createRule(dto);

      expect(result).toBeDefined();
    });
  });

  describe("findAllRules", () => {
    it("deve retornar lista paginada de regras", async () => {
      const rules = [makeRule({ id: "r1" }), makeRule({ id: "r2" })];
      mockRuleRepository.findAndCount.mockResolvedValue([rules, 2]);

      const result = await service.findAllRules({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it("deve filtrar regras por tipo", async () => {
      mockRuleRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllRules({ type: "IP" } as Parameters<typeof service.findAllRules>[0]);

      expect(mockRuleRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: "IP" }) }),
      );
    });

    it("deve calcular paginação corretamente", async () => {
      mockRuleRepository.findAndCount.mockResolvedValue([[], 25]);

      const result = await service.findAllRules({ page: 2, limit: 10 });

      expect(result.meta.total_pages).toBe(3);
      expect(result.meta.has_previous).toBe(true);
      expect(result.meta.has_next).toBe(true);
    });
  });

  describe("findOneRule", () => {
    it("deve retornar regra existente por ID", async () => {
      const rule = makeRule({ id: "r-existing" });
      mockRuleRepository.findOne.mockResolvedValue(rule);

      const result = await service.findOneRule("r-existing");

      expect(result.id).toBe("r-existing");
    });

    it("deve lançar NotFoundException para ID inexistente", async () => {
      mockRuleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneRule("not-found")).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateRule", () => {
    const makeUpdateDto = (overrides?: Partial<UpdateRuleDto>): UpdateRuleDto =>
      ({
        limit: 200,
        ...overrides,
      }) as UpdateRuleDto;

    it("deve atualizar regra existente", async () => {
      const rule = makeRule({ id: "r-upd" });
      const updated = makeRule({ id: "r-upd", limit: 200 });
      mockRuleRepository.findOne.mockResolvedValue(rule);
      mockRuleRepository.save.mockResolvedValue(updated);

      const result = await service.updateRule("r-upd", makeUpdateDto({ limit: 200 }));

      expect(result.limit).toBe(200);
    });

    it("deve lançar NotFoundException quando regra não existe", async () => {
      mockRuleRepository.findOne.mockResolvedValue(null);

      await expect(service.updateRule("not-found", makeUpdateDto())).rejects.toThrow(
        NotFoundException,
      );
    });

    it("deve lançar BadRequestException para estratégia inválida na atualização", async () => {
      const rule = makeRule({ id: "r-strat" });
      mockRuleRepository.findOne.mockResolvedValue(rule);

      await expect(
        service.updateRule(
          "r-strat",
          makeUpdateDto({ strategy: "WRONG" as RateLimitStrategyType }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("deve aceitar estratégia válida na atualização", async () => {
      const rule = makeRule({ id: "r-valid-strat" });
      const updated = makeRule({
        id: "r-valid-strat",
        strategy: RateLimitStrategyType.TOKEN_BUCKET,
      });
      mockRuleRepository.findOne.mockResolvedValue(rule);
      mockRuleRepository.save.mockResolvedValue(updated);

      const result = await service.updateRule(
        "r-valid-strat",
        makeUpdateDto({ strategy: RateLimitStrategyType.TOKEN_BUCKET }),
      );

      expect(result).toBeDefined();
    });
  });

  describe("removeRule", () => {
    it("deve remover regra existente via softRemove", async () => {
      const rule = makeRule({ id: "r-del" });
      mockRuleRepository.findOne.mockResolvedValue(rule);

      await expect(service.removeRule("r-del")).resolves.not.toThrow();
    });

    it("deve lançar NotFoundException quando regra não existe", async () => {
      mockRuleRepository.findOne.mockResolvedValue(null);

      await expect(service.removeRule("not-found")).rejects.toThrow(NotFoundException);
    });
  });

  describe("resetRuleCounter", () => {
    it("deve executar sem erros para regra existente", async () => {
      const rule = makeRule({ id: "r-reset", strategy: RateLimitStrategyType.SLIDING_WINDOW });
      mockRuleRepository.findOne.mockResolvedValue(rule);

      await expect(service.resetRuleCounter("r-reset")).resolves.not.toThrow();
    });

    it("deve lançar NotFoundException quando regra não existe", async () => {
      mockRuleRepository.findOne.mockResolvedValue(null);

      await expect(service.resetRuleCounter("not-found")).rejects.toThrow(NotFoundException);
    });
  });
});
