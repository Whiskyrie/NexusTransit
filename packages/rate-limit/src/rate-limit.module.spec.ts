import { RateLimitModule } from "./rate-limit.module";
import { RateLimitService } from "./services/rate-limit.service";
import { BlacklistService } from "./services/blacklist.service";
import { MonitoringService } from "./services/monitoring.service";
import { AlertService } from "./services/alert.service";
import { RateLimitGuard } from "./guards/rate-limit.guard";
import { SlidingWindowStrategy } from "./strategies/sliding-window.strategy";
import { TokenBucketStrategy } from "./strategies/token-bucket.strategy";
import { FixedWindowStrategy } from "./strategies/fixed-window.strategy";
import { AbuseDetectionProcessor } from "./processors/abuse-detection.processor";

interface ProviderDef {
  provide?: unknown;
  useValue?: unknown;
  useClass?: unknown;
}

describe("RateLimitModule", () => {
  it("deve ser definido", () => {
    expect(RateLimitModule).toBeDefined();
  });

  describe("providers", () => {
    it("deve exportar RateLimitService", () => {
      const metadata = Reflect.getMetadata("exports", RateLimitModule) as unknown[] | undefined;
      expect(metadata).toContain(RateLimitService);
    });

    it("deve exportar BlacklistService", () => {
      const metadata = Reflect.getMetadata("exports", RateLimitModule) as unknown[] | undefined;
      expect(metadata).toContain(BlacklistService);
    });

    it("deve exportar MonitoringService", () => {
      const metadata = Reflect.getMetadata("exports", RateLimitModule) as unknown[] | undefined;
      expect(metadata).toContain(MonitoringService);
    });

    it("deve exportar AlertService", () => {
      const metadata = Reflect.getMetadata("exports", RateLimitModule) as unknown[] | undefined;
      expect(metadata).toContain(AlertService);
    });

    it("deve exportar RateLimitGuard", () => {
      const metadata = Reflect.getMetadata("exports", RateLimitModule) as unknown[] | undefined;
      expect(metadata).toContain(RateLimitGuard);
    });

    it("deve exportar AbuseDetectionProcessor", () => {
      const metadata = Reflect.getMetadata("exports", RateLimitModule) as unknown[] | undefined;
      expect(metadata).toContain(AbuseDetectionProcessor);
    });
  });

  describe("módulo estrutura", () => {
    it("deve registrar providers principais", () => {
      const providers = Reflect.getMetadata("providers", RateLimitModule) as
        | ProviderDef[]
        | undefined;
      const allProviders = (providers ?? []).map((p) =>
        typeof p === "function"
          ? p
          : ((p as ProviderDef).provide ?? (p as ProviderDef).useClass ?? p),
      );

      expect(allProviders).toContain(RateLimitService);
      expect(allProviders).toContain(BlacklistService);
      expect(allProviders).toContain(MonitoringService);
      expect(allProviders).toContain(AlertService);
    });

    it("deve registrar strategies", () => {
      const providers = Reflect.getMetadata("providers", RateLimitModule) as
        | ProviderDef[]
        | undefined;
      const allProviders = (providers ?? []).map((p) =>
        typeof p === "function"
          ? p
          : ((p as ProviderDef).provide ?? (p as ProviderDef).useClass ?? p),
      );

      expect(allProviders).toContain(SlidingWindowStrategy);
      expect(allProviders).toContain(TokenBucketStrategy);
      expect(allProviders).toContain(FixedWindowStrategy);
    });

    it("deve registrar guard e processor", () => {
      const providers = Reflect.getMetadata("providers", RateLimitModule) as
        | ProviderDef[]
        | undefined;
      const allProviders = (providers ?? []).map((p) =>
        typeof p === "function"
          ? p
          : ((p as ProviderDef).provide ?? (p as ProviderDef).useClass ?? p),
      );

      expect(allProviders).toContain(RateLimitGuard);
      expect(allProviders).toContain(AbuseDetectionProcessor);
    });
  });
});
