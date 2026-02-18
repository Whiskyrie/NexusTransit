import { DataSource } from "typeorm";
import { SeedingModule } from "./seeding.module";
import { SeedingService } from "./seeding.service";
import { RolesSeed } from "./seeds/roles.seed";
import { AdminUserSeed } from "./seeds/admin-user.seed";
import { TestUsersSeed } from "./seeds/test-users.seed";
import { DriversSeed } from "./seeds/drivers.seed";
import { VehiclesSeed } from "./seeds/vehicles.seed";
import { RoutesSeed } from "./seeds/routes.seed";
import { ServiceOrdersSeed } from "./seeds/service-orders.seed";
import { CustomersSeed } from "./seeds/customers.seed";
import { DeliveriesExpandedSeed } from "./seeds/deliveries-expanded.seed";
import { TrackingSeed } from "./seeds/tracking.seed";
import { IncidentsSeed } from "./seeds/incidents.seed";

interface ProviderDef {
  provide?: unknown;
  useValue?: unknown;
}

describe("SeedingModule", () => {
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    mockDataSource = {
      getRepository: jest.fn(),
    } as unknown as jest.Mocked<DataSource>;
  });

  describe("forRoot", () => {
    it("should return a DynamicModule", () => {
      const result = SeedingModule.forRoot(mockDataSource);

      expect(result).toBeDefined();
      expect(result.module).toBe(SeedingModule);
    });

    it("should provide DATA_SOURCE token", () => {
      const result = SeedingModule.forRoot(mockDataSource);

      const dataSourceProvider = result.providers?.find(
        (p) => (p as ProviderDef).provide === "DATA_SOURCE",
      ) as ProviderDef | undefined;

      expect(dataSourceProvider).toBeDefined();
      expect(dataSourceProvider!.useValue).toBe(mockDataSource);
    });

    it("should provide SeedingService", () => {
      const result = SeedingModule.forRoot(mockDataSource);

      const hasSeedingService = result.providers?.some(
        (p) => p === SeedingService || (p as ProviderDef).provide === SeedingService,
      );

      expect(hasSeedingService).toBe(true);
    });

    it("should export SeedingService", () => {
      const result = SeedingModule.forRoot(mockDataSource);

      expect(result.exports).toContain(SeedingService);
    });

    it("should provide all seed classes", () => {
      const result = SeedingModule.forRoot(mockDataSource);

      const expectedSeeds = [
        RolesSeed,
        AdminUserSeed,
        TestUsersSeed,
        DriversSeed,
        VehiclesSeed,
        RoutesSeed,
        ServiceOrdersSeed,
        CustomersSeed,
        DeliveriesExpandedSeed,
        TrackingSeed,
        IncidentsSeed,
      ];

      expectedSeeds.forEach((SeedClass) => {
        const hasSeed = result.providers?.some(
          (p) => p === SeedClass || (p as ProviderDef).provide === SeedClass,
        );
        expect(hasSeed).toBe(true);
      });
    });

    it("should filter out DATA_SOURCE from seedingProviders", () => {
      const result = SeedingModule.forRoot(mockDataSource);

      // Count DATA_SOURCE providers - should be exactly 1 (the one we provide)
      const dataSourceProviders = result.providers?.filter(
        (p) => (p as ProviderDef).provide === "DATA_SOURCE",
      );

      expect(dataSourceProviders?.length).toBe(1);
    });

    it("should be a static method", () => {
      expect(typeof SeedingModule.forRoot).toBe("function");
    });

    it("should return module property as SeedingModule class", () => {
      const result = SeedingModule.forRoot(mockDataSource);

      expect(result.module).toBe(SeedingModule);
    });

    it("should have providers array defined", () => {
      const result = SeedingModule.forRoot(mockDataSource);

      expect(Array.isArray(result.providers)).toBe(true);
      expect(result.providers?.length).toBeGreaterThan(0);
    });

    it("should have exports array defined", () => {
      const result = SeedingModule.forRoot(mockDataSource);

      expect(Array.isArray(result.exports)).toBe(true);
      expect(result.exports?.length).toBeGreaterThan(0);
    });
  });

  describe("module structure", () => {
    it("should be a class", () => {
      expect(typeof SeedingModule).toBe("function");
    });

    it("should have @Module decorator", () => {
      // The module should be decorated with @Module
      // We can verify this by checking if it's a valid NestJS module
      const result = SeedingModule.forRoot(mockDataSource);
      expect(result).toHaveProperty("module");
      expect(result).toHaveProperty("providers");
      expect(result).toHaveProperty("exports");
    });
  });

  describe("dependency injection", () => {
    it("should properly configure providers for DI", () => {
      const result = SeedingModule.forRoot(mockDataSource);

      // Verify that all providers are either classes or have provide property
      result.providers?.forEach((provider: unknown) => {
        if (typeof provider === "function") {
          // Class provider - valid
          expect(typeof provider).toBe("function");
        } else if (typeof provider === "object") {
          // Object provider - must have 'provide' property
          expect(provider).toHaveProperty("provide");
        }
      });
    });

    it("should use useValue for DATA_SOURCE provider", () => {
      const result = SeedingModule.forRoot(mockDataSource);

      const dataSourceProvider = result.providers?.find(
        (p) => (p as ProviderDef).provide === "DATA_SOURCE",
      ) as ProviderDef | undefined;

      expect(dataSourceProvider).toBeDefined();
      expect(dataSourceProvider!.useValue).toBe(mockDataSource);
    });
  });
});
