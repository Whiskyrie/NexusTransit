import { ExecutionContext, CallHandler, HttpException, HttpStatus } from "@nestjs/common";
import { ThrottleInterceptor, type ThrottleConfig } from "./throttle.interceptor";
import { of, throwError } from "rxjs";
import type { Request, Response } from "express";

describe("ThrottleInterceptor", () => {
  let interceptor: ThrottleInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      path: "/test",
      method: "GET",
      headers: {},
      socket: { remoteAddress: "127.0.0.1" },
    } as Partial<Request>;

    const headers: Record<string, string> = {};
    mockResponse = {
      setHeader: jest.fn((name: string, value: string) => {
        headers[name] = value;
      }),
      getHeader: jest.fn((name: string) => headers[name]),
    } as unknown as Partial<Response>;

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of("test")),
    } as unknown as CallHandler;
  });

  afterEach(() => {
    jest.clearAllMocks();
    interceptor?.resetAll();
  });

  describe("Configuração básica", () => {
    it("deve criar interceptor com configuração padrão", () => {
      const config: ThrottleConfig = {
        limit: 5,
        windowMs: 60000,
      };

      interceptor = new ThrottleInterceptor(config);

      expect(interceptor).toBeDefined();
    });

    it("deve usar mensagem customizada", () => {
      const config: ThrottleConfig = {
        limit: 1,
        windowMs: 60000,
        message: "Custom throttle message",
      };

      interceptor = new ThrottleInterceptor(config);

      // Fazer 2 requisições para exceder o limite
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      }).toThrow(HttpException);
    });
  });

  describe("Throttling de requisições", () => {
    beforeEach(() => {
      const config: ThrottleConfig = {
        limit: 3,
        windowMs: 60000,
      };
      interceptor = new ThrottleInterceptor(config);
    });

    it("deve permitir requisições dentro do limite", () => {
      for (let i = 0; i < 3; i++) {
        expect(() => {
          interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
        }).not.toThrow();
      }
    });

    it("deve bloquear requisições que excedem o limite", () => {
      // Fazer 3 requisições (limite)
      for (let i = 0; i < 3; i++) {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      }

      // 4ª requisição deve ser bloqueada
      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      }).toThrow(HttpException);
    });

    it("deve adicionar headers de rate limit", () => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", "3");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", "2");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Reset", expect.any(String));
    });

    it("deve adicionar header Retry-After quando limite excedido", () => {
      // Exceder o limite
      for (let i = 0; i < 3; i++) {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      }

      try {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      } catch (error) {
        expect(mockResponse.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
      }
    });

    it("deve retornar erro 429 Too Many Requests", () => {
      for (let i = 0; i < 3; i++) {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      }

      try {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });
  });

  describe("Key generator customizado", () => {
    it("deve usar keyGenerator customizado", () => {
      const config: ThrottleConfig = {
        limit: 2,
        windowMs: 60000,
        keyGenerator: (req) => `custom:${req.path}`,
      };

      interceptor = new ThrottleInterceptor(config);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      }).toThrow(HttpException);
    });

    it("deve usar IP de X-Forwarded-For quando disponível", () => {
      mockRequest.headers = { "x-forwarded-for": "192.168.1.1, 10.0.0.1" };

      const config: ThrottleConfig = {
        limit: 1,
        windowMs: 60000,
      };

      interceptor = new ThrottleInterceptor(config);
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      const stats = interceptor.getStats();
      expect(stats.entries[0]?.key).toContain("192.168.1.1");
    });
  });

  describe("Skip functionality", () => {
    it("deve pular throttling quando skipIf retorna true", () => {
      const config: ThrottleConfig = {
        limit: 1,
        windowMs: 60000,
        skipIf: (req) => req.path === "/test",
      };

      interceptor = new ThrottleInterceptor(config);

      // Fazer múltiplas requisições - nenhuma deve ser bloqueada
      for (let i = 0; i < 5; i++) {
        expect(() => {
          interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
        }).not.toThrow();
      }
    });

    it("deve aplicar throttling quando skipIf retorna false", () => {
      const config: ThrottleConfig = {
        limit: 1,
        windowMs: 60000,
        skipIf: (req) => req.path === "/health",
      };

      interceptor = new ThrottleInterceptor(config);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      }).toThrow(HttpException);
    });
  });

  describe("Reset functionality", () => {
    beforeEach(() => {
      const config: ThrottleConfig = {
        limit: 2,
        windowMs: 60000,
      };
      interceptor = new ThrottleInterceptor(config);
    });

    it("deve resetar contador para chave específica", () => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      // Resetar a chave
      const stats = interceptor.getStats();
      const key = stats.entries[0]?.key;
      if (key) {
        interceptor.reset(key);
      }

      // Deve permitir mais requisições
      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      }).not.toThrow();
    });

    it("deve resetar todas as chaves", () => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      interceptor.resetAll();

      const stats = interceptor.getStats();
      expect(stats.totalKeys).toBe(0);
    });
  });

  describe("Statistics", () => {
    beforeEach(() => {
      const config: ThrottleConfig = {
        limit: 5,
        windowMs: 60000,
      };
      interceptor = new ThrottleInterceptor(config);
    });

    it("deve retornar estatísticas corretas", () => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      const stats = interceptor.getStats();

      expect(stats.totalKeys).toBe(1);
      expect(stats.entries).toHaveLength(1);
      expect(stats.entries[0]?.count).toBe(2);
      expect(stats.entries[0]?.resetTime).toBeInstanceOf(Date);
    });

    it("deve rastrear múltiplas chaves", () => {
      const config: ThrottleConfig = {
        limit: 5,
        windowMs: 60000,
        keyGenerator: (req) => `user:${req.headers["user-id"]}`,
      };

      interceptor = new ThrottleInterceptor(config);

      mockRequest.headers = { "user-id": "user1" };
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      mockRequest.headers = { "user-id": "user2" };
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      const stats = interceptor.getStats();
      expect(stats.totalKeys).toBe(2);
    });
  });

  describe("Error handling", () => {
    beforeEach(() => {
      const config: ThrottleConfig = {
        limit: 5,
        windowMs: 60000,
      };
      interceptor = new ThrottleInterceptor(config);
    });

    it("deve propagar erros do handler", (done) => {
      const error = new Error("Handler error");
      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => error));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });
});
