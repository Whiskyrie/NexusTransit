import { getPinoConfig } from "../config/pino.config";
import type { Params } from "nestjs-pino";
import { Request, Response } from "express";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOptions = Record<string, any>;

describe("getPinoConfig", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLogLevel = process.env.LOG_LEVEL;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    // Restaurar LOG_LEVEL para evitar vazamento entre testes
    if (originalLogLevel === undefined) {
      delete process.env.LOG_LEVEL;
    } else {
      process.env.LOG_LEVEL = originalLogLevel;
    }
  });

  // Helper para obter pinoHttp como Options (com type assertion)
  const getPinoHttpOptions = (config: Params): AnyOptions => {
    if (typeof config.pinoHttp === "function" || config.pinoHttp === undefined) {
      throw new Error("pinoHttp deve ser um objeto de opções");
    }
    return config.pinoHttp as AnyOptions;
  };

  describe("configuração de ambiente", () => {
    it("deve detectar ambiente de desenvolvimento", () => {
      process.env.NODE_ENV = "development";
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);

      expect(pinoHttp.transport).toBeDefined();
      expect(pinoHttp.transport?.target).toBe("pino-pretty");
    });

    it("deve detectar ambiente de produção", () => {
      process.env.NODE_ENV = "production";
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);

      expect(pinoHttp.transport).toBeUndefined();
    });

    it("deve usar desenvolvimento como padrão quando NODE_ENV não está definido", () => {
      delete process.env.NODE_ENV;
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);

      expect(pinoHttp.transport).toBeDefined();
    });
  });

  describe("nível de log", () => {
    it("deve usar nível debug em desenvolvimento", () => {
      process.env.NODE_ENV = "development";
      delete process.env.LOG_LEVEL;
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);

      expect(pinoHttp.level).toBe("debug");
    });

    it("deve usar nível info em produção", () => {
      process.env.NODE_ENV = "production";
      delete process.env.LOG_LEVEL;
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);

      expect(pinoHttp.level).toBe("info");
    });

    it("deve respeitar LOG_LEVEL quando definido", () => {
      process.env.NODE_ENV = "production";
      process.env.LOG_LEVEL = "warn";
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);

      expect(pinoHttp.level).toBe("warn");
    });
  });

  describe("serializers", () => {
    it("deve incluir serializers padrão", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);

      expect(pinoHttp.serializers).toBeDefined();
      expect(pinoHttp.serializers?.req).toBeDefined();
      expect(pinoHttp.serializers?.res).toBeDefined();
      expect(pinoHttp.serializers?.err).toBeDefined();
    });
  });

  describe("redaction de dados sensíveis", () => {
    it("deve configurar redaction para dados sensíveis", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      const redact = pinoHttp.redact;

      expect(redact).toBeDefined();
      expect(redact?.paths).toBeDefined();
      expect(redact?.remove).toBe(true);
    });

    it("deve incluir headers de autorização na lista de redaction", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      const paths = pinoHttp.redact?.paths;

      expect(paths).toContain("req.headers.authorization");
      expect(paths).toContain("req.headers.cookie");
    });

    it("deve incluir campos de password na lista de redaction", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      const paths = pinoHttp.redact?.paths;

      expect(paths).toContain("req.body.password");
      expect(paths).toContain("*.password");
    });

    it("deve incluir campos de token na lista de redaction", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      const paths = pinoHttp.redact?.paths;

      expect(paths).toContain("req.body.token");
      expect(paths).toContain("*.token");
      expect(paths).toContain("req.body.accessToken");
      expect(paths).toContain("*.accessToken");
      expect(paths).toContain("req.body.refreshToken");
      expect(paths).toContain("*.refreshToken");
    });
  });

  describe("campos base", () => {
    it("deve incluir campos base em todos os logs", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      const base = pinoHttp.base;

      expect(base).toBeDefined();
      expect(base?.env).toBeDefined();
      expect(base?.app).toBe("nexus-transit");
    });

    it("deve usar NODE_ENV no campo env", () => {
      process.env.NODE_ENV = "test";
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);

      expect(pinoHttp.base?.env).toBe("test");
    });
  });

  describe("configuração de transporte (pretty print)", () => {
    it("deve configurar pretty print em desenvolvimento", () => {
      process.env.NODE_ENV = "development";
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      const transport = pinoHttp.transport;

      expect(transport).toBeDefined();
      expect(transport?.options).toBeDefined();
      expect(transport?.options?.colorize).toBe(true);
      expect(transport?.options?.levelFirst).toBe(true);
    });

    it("deve configurar formato de tempo", () => {
      process.env.NODE_ENV = "development";
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);

      expect(pinoHttp.transport?.options?.translateTime).toBe("HH:MM:ss.l");
    });

    it("deve ignorar campos específicos no pretty print", () => {
      process.env.NODE_ENV = "development";
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      const ignore = pinoHttp.transport?.options?.ignore;

      expect(ignore).toContain("pid");
      expect(ignore).toContain("hostname");
      expect(ignore).toContain("context");
    });

    it("deve configurar formato de mensagem", () => {
      process.env.NODE_ENV = "development";
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);

      expect(pinoHttp.transport?.options?.messageFormat).toBe("{context} | {msg}");
    });

    it("deve configurar cores customizadas", () => {
      process.env.NODE_ENV = "development";
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      const customColors = pinoHttp.transport?.options?.customColors;

      expect(customColors).toBeDefined();
      expect(customColors).toContain("info:blue");
      expect(customColors).toContain("warn:yellow");
      expect(customColors).toContain("error:red");
    });
  });

  describe("timestamp", () => {
    it("deve configurar timestamp em formato ISO", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);

      expect(pinoHttp.timestamp).toBeDefined();
    });
  });

  describe("customProps", () => {
    let config: ReturnType<typeof getPinoConfig>;
    let pinoHttp: ReturnType<typeof getPinoHttpOptions>;

    beforeEach(() => {
      config = getPinoConfig();
      pinoHttp = getPinoHttpOptions(config);
    });

    it("deve ter customProps como função", () => {
      expect(pinoHttp.customProps).toBeDefined();
      expect(typeof pinoHttp.customProps).toBe("function");
    });

    it("deve extrair correlation ID do request", () => {
      const customProps = pinoHttp.customProps;
      if (typeof customProps !== "function") {
        throw new Error("customProps deve ser uma função");
      }

      const mockReq = {
        headers: {
          "x-correlation-id": "test-correlation-id",
        },
      };

      const result = customProps(mockReq as unknown as Request);
      expect(result).toHaveProperty("correlationId", "test-correlation-id");
    });

    it("deve extrair user ID do request", () => {
      const customProps = pinoHttp.customProps;
      if (typeof customProps !== "function") {
        throw new Error("customProps deve ser uma função");
      }

      const mockReq = {
        headers: {},
        user: { id: "user-123" },
      };

      const result = customProps(mockReq as unknown as Request);
      expect(result).toHaveProperty("userId", "user-123");
    });

    it("deve extrair user agent do request", () => {
      const customProps = pinoHttp.customProps;
      if (typeof customProps !== "function") {
        throw new Error("customProps deve ser uma função");
      }

      const mockReq = {
        headers: {
          "user-agent": "Mozilla/5.0 Test",
        },
      };

      const result = customProps(mockReq as unknown as Request);
      expect(result).toHaveProperty("userAgent", "Mozilla/5.0 Test");
    });

    it("deve extrair IP do request", () => {
      const customProps = pinoHttp.customProps;
      if (typeof customProps !== "function") {
        throw new Error("customProps deve ser uma função");
      }

      const mockReq = {
        headers: {},
        ip: "192.168.1.1",
      };

      const result = customProps(mockReq as unknown as Request);
      expect(result).toHaveProperty("ip", "192.168.1.1");
    });
  });

  describe("autoLogging", () => {
    it("deve configurar autoLogging", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      const autoLogging = pinoHttp.autoLogging;

      expect(autoLogging).toBeDefined();
      expect(autoLogging?.ignore).toBeDefined();
      expect(typeof autoLogging?.ignore).toBe("function");
    });

    it("deve ignorar rotas de health check", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      const ignoreFn = pinoHttp.autoLogging?.ignore;

      if (typeof ignoreFn !== "function") {
        throw new Error("autoLogging.ignore deve ser uma função");
      }

      expect(ignoreFn({ url: "/health" } as unknown as Request)).toBe(true);
      expect(ignoreFn({ url: "/health/live" } as unknown as Request)).toBe(true);
      expect(ignoreFn({ url: "/health/ready" } as unknown as Request)).toBe(true);
      expect(ignoreFn({ url: "/metrics" } as unknown as Request)).toBe(true);
    });

    it("não deve ignorar rotas normais", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      const ignoreFn = pinoHttp.autoLogging?.ignore;

      if (typeof ignoreFn !== "function") {
        throw new Error("autoLogging.ignore deve ser uma função");
      }

      expect(ignoreFn({ url: "/api/users" } as unknown as Request)).toBe(false);
    });
  });

  describe("customLogLevel", () => {
    let logLevelFn: ReturnType<typeof getPinoHttpOptions>["customLogLevel"];

    beforeEach(() => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      logLevelFn = pinoHttp.customLogLevel;
    });

    it("deve configurar customLogLevel", () => {
      expect(logLevelFn).toBeDefined();
      expect(typeof logLevelFn).toBe("function");
    });

    it("deve retornar error para status 500+", () => {
      if (typeof logLevelFn !== "function") {
        throw new Error("customLogLevel deve ser uma função");
      }

      expect(logLevelFn({} as Request, { statusCode: 500 } as Response)).toBe("error");
      expect(logLevelFn({} as Request, { statusCode: 503 } as Response)).toBe("error");
    });

    it("deve retornar error quando há erro", () => {
      if (typeof logLevelFn !== "function") {
        throw new Error("customLogLevel deve ser uma função");
      }

      const mockErr = new Error("Test error");
      expect(logLevelFn({} as Request, { statusCode: 200 } as Response, mockErr)).toBe("error");
    });

    it("deve retornar warn para status 400-499", () => {
      if (typeof logLevelFn !== "function") {
        throw new Error("customLogLevel deve ser uma função");
      }

      expect(logLevelFn({} as Request, { statusCode: 400 } as Response)).toBe("warn");
      expect(logLevelFn({} as Request, { statusCode: 404 } as Response)).toBe("warn");
      expect(logLevelFn({} as Request, { statusCode: 499 } as Response)).toBe("warn");
    });

    it("deve retornar info para status 200-399", () => {
      if (typeof logLevelFn !== "function") {
        throw new Error("customLogLevel deve ser uma função");
      }

      expect(logLevelFn({} as Request, { statusCode: 200 } as Response)).toBe("info");
      expect(logLevelFn({} as Request, { statusCode: 201 } as Response)).toBe("info");
      expect(logLevelFn({} as Request, { statusCode: 304 } as Response)).toBe("info");
    });
  });

  describe("customSuccessMessage", () => {
    it("deve configurar customSuccessMessage", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);

      expect(pinoHttp.customSuccessMessage).toBeDefined();
      expect(typeof pinoHttp.customSuccessMessage).toBe("function");
    });

    it("deve formatar mensagem de sucesso corretamente", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      const messageFn = pinoHttp.customSuccessMessage;

      if (typeof messageFn !== "function") {
        throw new Error("customSuccessMessage deve ser uma função");
      }

      const mockReq = {
        method: "GET",
        url: "/api/users",
        originalUrl: "/api/users",
      } as unknown as Request;

      const mockRes = { statusCode: 200 } as Response;
      const responseTime = 100;

      const message = messageFn(mockReq, mockRes, responseTime);
      expect(message).toContain("GET");
      expect(message).toContain("200");
      expect(message).toContain("/api/users");
    });
  });

  describe("customErrorMessage", () => {
    it("deve configurar customErrorMessage", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);

      expect(pinoHttp.customErrorMessage).toBeDefined();
      expect(typeof pinoHttp.customErrorMessage).toBe("function");
    });

    it("deve formatar mensagem de erro corretamente", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      const messageFn = pinoHttp.customErrorMessage;

      if (typeof messageFn !== "function") {
        throw new Error("customErrorMessage deve ser uma função");
      }

      const mockReq = {
        method: "POST",
        url: "/api/users",
        originalUrl: "/api/users",
      } as unknown as Request;

      const mockRes = { statusCode: 500 } as Response;
      const mockErr = new Error("Internal error");

      const message = messageFn(mockReq, mockRes, mockErr);
      expect(message).toContain("POST");
      expect(message).toContain("500");
      expect(message).toContain("/api/users");
      expect(message).toContain("Internal error");
    });
  });

  describe("customAttributeKeys", () => {
    it("deve configurar customAttributeKeys", () => {
      const config = getPinoConfig();
      const pinoHttp = getPinoHttpOptions(config);
      const keys = pinoHttp.customAttributeKeys;

      expect(keys).toBeDefined();
      expect(keys?.req).toBe("request");
      expect(keys?.res).toBe("response");
      expect(keys?.err).toBe("error");
      expect(keys?.responseTime).toBe("duration");
    });
  });
});
