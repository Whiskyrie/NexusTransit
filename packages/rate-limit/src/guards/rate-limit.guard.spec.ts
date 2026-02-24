import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RateLimitGuard } from "./rate-limit.guard";
import { RateLimitService } from "../services/rate-limit.service";
import { BlacklistService } from "../services/blacklist.service";
import { RateLimitType } from "../enums/rate-limit-type.enum";
import { RATE_LIMIT_KEY } from "../decorators/rate-limit.decorator";

const makeAllowedResult = (overrides?: object) => ({
  allowed: true,
  limit: 100,
  current: 1,
  remaining: 99,
  resetTime: Date.now() + 60000,
  ...overrides,
});

const makeBlockedResult = (overrides?: object) => ({
  allowed: false,
  limit: 100,
  current: 100,
  remaining: 0,
  resetTime: Date.now() + 10000,
  ...overrides,
});

function makeExecutionContext(
  options: {
    path?: string;
    ip?: string;
    userId?: string;
    userRole?: string;
    forwardedFor?: string;
    realIp?: string;
    method?: string;
    route?: { path?: string };
  } = {},
): ExecutionContext {
  const headers: Record<string, string | undefined> = {};
  if (options.forwardedFor) {
    headers["x-forwarded-for"] = options.forwardedFor;
  }
  if (options.realIp) {
    headers["x-real-ip"] = options.realIp;
  }

  const mockRequest = {
    path: options.path ?? "/api/test",
    method: options.method ?? "GET",
    route: options.route ?? { path: "/api/test" },
    headers,
    socket: { remoteAddress: options.ip ?? "127.0.0.1" },
    user: options.userId
      ? { id: options.userId, role: options.userRole ?? "customer", email: "test@example.com" }
      : undefined,
  };

  const mockResponse = {
    setHeader: jest.fn(),
  };

  return {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
    }),
    getHandler: jest.fn().mockReturnValue(() => {}),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
}

describe("RateLimitGuard", () => {
  let guard: RateLimitGuard;
  let mockReflector: jest.Mocked<Pick<Reflector, "get">>;
  let mockRateLimitService: jest.Mocked<Pick<RateLimitService, "checkLimit">>;
  let mockBlacklistService: jest.Mocked<
    Pick<BlacklistService, "isWhitelisted" | "isBlacklisted" | "recordViolation">
  >;

  beforeEach(async () => {
    mockReflector = {
      get: jest.fn().mockReturnValue(null),
    };

    mockRateLimitService = {
      checkLimit: jest.fn().mockResolvedValue(makeAllowedResult()),
    };

    mockBlacklistService = {
      isWhitelisted: jest.fn().mockResolvedValue(false),
      isBlacklisted: jest.fn().mockResolvedValue(false),
      recordViolation: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: RateLimitService, useValue: mockRateLimitService },
        { provide: BlacklistService, useValue: mockBlacklistService },
      ],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
  });

  it("deve ser definido", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate - paths na whitelist", () => {
    const whitelistedPaths = [
      "/health",
      "/metrics",
      "/api/docs",
      "/api-docs",
      "/swagger",
      "/api/health",
    ];

    whitelistedPaths.forEach((path) => {
      it(`deve permitir acesso sem verificação para path: ${path}`, async () => {
        const context = makeExecutionContext({ path });

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(mockBlacklistService.isWhitelisted).not.toHaveBeenCalled();
        expect(mockRateLimitService.checkLimit).not.toHaveBeenCalled();
      });
    });
  });

  describe("canActivate - sem configuração de rate limit", () => {
    it("deve permitir quando não há metadado de rate limit", async () => {
      mockReflector.get.mockReturnValue(null);
      const context = makeExecutionContext();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("deve permitir quando skip: true está configurado", async () => {
      mockReflector.get.mockReturnValue({ skip: true });
      const context = makeExecutionContext();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRateLimitService.checkLimit).not.toHaveBeenCalled();
    });
  });

  describe("canActivate - whitelist/blacklist", () => {
    beforeEach(() => {
      mockReflector.get.mockReturnValue({
        type: RateLimitType.BY_IP,
        limit: 100,
        windowMs: 60000,
      });
    });

    it("deve permitir sem checagem quando IP está na whitelist", async () => {
      mockBlacklistService.isWhitelisted.mockResolvedValueOnce(true);
      const context = makeExecutionContext({ ip: "10.0.0.1" });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRateLimitService.checkLimit).not.toHaveBeenCalled();
    });

    it("deve permitir sem checagem quando usuário está na whitelist", async () => {
      mockBlacklistService.isWhitelisted
        .mockResolvedValueOnce(false) // IP não está na whitelist
        .mockResolvedValueOnce(true); // Usuário está na whitelist
      const context = makeExecutionContext({ userId: "u-123" });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRateLimitService.checkLimit).not.toHaveBeenCalled();
    });

    it("deve lançar 403 quando IP está na blacklist", async () => {
      mockBlacklistService.isBlacklisted.mockResolvedValueOnce(true);
      const context = makeExecutionContext({ ip: "10.0.0.99" });

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);

      try {
        await guard.canActivate(context);
      } catch (e) {
        const httpErr = e as HttpException;
        expect(httpErr.getStatus()).toBe(HttpStatus.FORBIDDEN);
      }
    });

    it("deve lançar 403 quando usuário está na blacklist", async () => {
      mockBlacklistService.isBlacklisted
        .mockResolvedValueOnce(false) // IP não blacklistado
        .mockResolvedValueOnce(true); // Usuário blacklistado
      const context = makeExecutionContext({ userId: "banned-user" });

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
    });
  });

  describe("canActivate - verificação de rate limit", () => {
    it("deve permitir request quando dentro do limite (BY_IP)", async () => {
      mockReflector.get.mockReturnValue({ type: RateLimitType.BY_IP, limit: 100, windowMs: 60000 });
      mockRateLimitService.checkLimit.mockResolvedValue(makeAllowedResult());
      const context = makeExecutionContext({ ip: "1.2.3.4" });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRateLimitService.checkLimit).toHaveBeenCalledTimes(1);
    });

    it("deve lançar 429 quando limite de IP excedido", async () => {
      mockReflector.get.mockReturnValue({ type: RateLimitType.BY_IP, limit: 10, windowMs: 60000 });
      mockRateLimitService.checkLimit.mockResolvedValue(makeBlockedResult());
      const context = makeExecutionContext({ ip: "1.2.3.4" });

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);

      try {
        await guard.canActivate(context);
      } catch (e) {
        const httpErr = e as HttpException;
        expect(httpErr.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });

    it("deve lançar 429 quando limite por usuário excedido (BY_USER)", async () => {
      mockReflector.get.mockReturnValue({
        type: RateLimitType.BY_USER,
        limit: 10,
        windowMs: 60000,
      });
      mockRateLimitService.checkLimit.mockResolvedValue(makeBlockedResult());
      const context = makeExecutionContext({ userId: "usr-99" });

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
    });

    it("deve lançar 429 quando limite global excedido (GLOBAL)", async () => {
      mockReflector.get.mockReturnValue({
        type: RateLimitType.GLOBAL,
        limit: 100,
        windowMs: 60000,
      });
      mockRateLimitService.checkLimit.mockResolvedValue(makeBlockedResult());
      const context = makeExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
    });

    it("deve lançar 429 quando limite por role excedido (BY_ROLE)", async () => {
      mockReflector.get.mockReturnValue({ type: RateLimitType.BY_ROLE });
      mockRateLimitService.checkLimit.mockResolvedValue(makeBlockedResult());
      const context = makeExecutionContext({ userId: "usr-1", userRole: "customer" });

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
    });

    it("deve registrar violação quando limite é excedido", async () => {
      mockReflector.get.mockReturnValue({ type: RateLimitType.BY_IP, limit: 10, windowMs: 60000 });
      mockRateLimitService.checkLimit.mockResolvedValue(makeBlockedResult());
      const context = makeExecutionContext({ ip: "bad-ip" });

      try {
        await guard.canActivate(context);
      } catch (_) {
        // expected
      }

      expect(mockBlacklistService.recordViolation).toHaveBeenCalled();
    });
  });

  describe("canActivate - headers de response", () => {
    it("deve definir headers X-RateLimit-* quando request permitido", async () => {
      mockReflector.get.mockReturnValue({ type: RateLimitType.BY_IP, limit: 100, windowMs: 60000 });
      mockRateLimitService.checkLimit.mockResolvedValue(
        makeAllowedResult({
          limit: 100,
          remaining: 95,
          resetTime: 1700000000000,
        }),
      );

      const context = makeExecutionContext();
      const mockResponse = context.switchToHttp().getResponse() as { setHeader: jest.Mock };

      await guard.canActivate(context);

      expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", "100");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", "95");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Reset", expect.any(String));
    });
  });

  describe("canActivate - extração de IP", () => {
    it("deve extrair IP do header x-forwarded-for", async () => {
      mockReflector.get.mockReturnValue({ type: RateLimitType.BY_IP, limit: 100, windowMs: 60000 });
      const context = makeExecutionContext({ forwardedFor: "203.0.113.1, 10.0.0.1" });

      await guard.canActivate(context);

      const call = mockRateLimitService.checkLimit.mock.calls[0] as [string, ...unknown[]];
      expect(call[0]).toContain("203.0.113.1");
    });

    it("deve extrair IP do header x-real-ip como fallback", async () => {
      mockReflector.get.mockReturnValue({ type: RateLimitType.BY_IP, limit: 100, windowMs: 60000 });
      const context = makeExecutionContext({ realIp: "198.51.100.1" });

      await guard.canActivate(context);

      const call = mockRateLimitService.checkLimit.mock.calls[0] as [string, ...unknown[]];
      expect(call[0]).toContain("198.51.100.1");
    });
  });

  describe("canActivate - tratamento de erros", () => {
    it("deve permitir request em caso de erro inesperado (fail-open)", async () => {
      mockReflector.get.mockReturnValue({ type: RateLimitType.BY_IP, limit: 100, windowMs: 60000 });
      mockBlacklistService.isWhitelisted.mockRejectedValue(new Error("Unexpected error"));
      const context = makeExecutionContext();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
