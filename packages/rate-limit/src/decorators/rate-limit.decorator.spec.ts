import {
  RATE_LIMIT_KEY,
  RateLimit,
  RateLimitByIP,
  RateLimitByRole,
  SkipRateLimit,
} from "./rate-limit.decorator";
import { RateLimitType } from "../enums/rate-limit-type.enum";

function applyDecorator(decorator: MethodDecorator): unknown {
  class TestClass {
    testMethod() {}
  }

  const descriptor = Object.getOwnPropertyDescriptor(TestClass.prototype, "testMethod")!;
  decorator(TestClass.prototype, "testMethod", descriptor);

  return Reflect.getMetadata(RATE_LIMIT_KEY, descriptor.value as object);
}

describe("Rate Limit Decorators", () => {
  describe("RATE_LIMIT_KEY", () => {
    it("deve ser 'rate-limit'", () => {
      expect(RATE_LIMIT_KEY).toBe("rate-limit");
    });
  });

  describe("RateLimit", () => {
    it("deve definir metadado com limite e janela de tempo padrão", () => {
      const metadata = applyDecorator(RateLimit(100)) as {
        type: string;
        limit: number;
        windowMs: number;
      };

      expect(metadata).toBeDefined();
      expect(metadata.type).toBe(RateLimitType.GLOBAL);
      expect(metadata.limit).toBe(100);
      expect(metadata.windowMs).toBe(60000);
    });

    it("deve definir metadado com janela de tempo customizada", () => {
      const metadata = applyDecorator(RateLimit(50, 30000)) as {
        type: string;
        limit: number;
        windowMs: number;
      };

      expect(metadata.limit).toBe(50);
      expect(metadata.windowMs).toBe(30000);
    });

    it("deve usar GLOBAL como tipo padrão", () => {
      const metadata = applyDecorator(RateLimit(200)) as { type: string };
      expect(metadata.type).toBe(RateLimitType.GLOBAL);
    });
  });

  describe("SkipRateLimit", () => {
    it("deve definir metadado com skip: true", () => {
      const metadata = applyDecorator(SkipRateLimit()) as { skip: boolean };

      expect(metadata).toBeDefined();
      expect(metadata.skip).toBe(true);
    });
  });

  describe("RateLimitByRole", () => {
    it("deve definir metadado com tipo BY_ROLE", () => {
      const metadata = applyDecorator(RateLimitByRole()) as { type: string };

      expect(metadata).toBeDefined();
      expect(metadata.type).toBe(RateLimitType.BY_ROLE);
    });

    it("deve aceitar roleOverrides customizados", () => {
      const overrides = { guest: { limit: 10, windowMs: 30000 } };
      const metadata = applyDecorator(RateLimitByRole(overrides)) as {
        type: string;
        roleOverrides: typeof overrides;
      };

      expect(metadata.roleOverrides).toEqual(overrides);
    });

    it("deve funcionar sem roleOverrides", () => {
      const metadata = applyDecorator(RateLimitByRole()) as { roleOverrides?: unknown };

      expect(metadata).toBeDefined();
      expect(metadata.roleOverrides).toBeUndefined();
    });
  });

  describe("RateLimitByIP", () => {
    it("deve definir metadado com tipo BY_IP e limite", () => {
      const metadata = applyDecorator(RateLimitByIP(30)) as {
        type: string;
        limit: number;
        windowMs: number;
      };

      expect(metadata).toBeDefined();
      expect(metadata.type).toBe(RateLimitType.BY_IP);
      expect(metadata.limit).toBe(30);
      expect(metadata.windowMs).toBe(60000);
    });

    it("deve aceitar windowMs customizado", () => {
      const metadata = applyDecorator(RateLimitByIP(10, 10000)) as {
        limit: number;
        windowMs: number;
      };

      expect(metadata.limit).toBe(10);
      expect(metadata.windowMs).toBe(10000);
    });
  });
});
