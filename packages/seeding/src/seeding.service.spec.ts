import { Test, TestingModule } from "@nestjs/testing";
import { DataSource, QueryRunner } from "typeorm";
import { SeedingService } from "./seeding.service";
import { RolesSeed } from "./seeds/roles.seed";
import { AdminUserSeed } from "./seeds/admin-user.seed";
import { TestUsersSeed } from "./seeds/test-users.seed";
import { DriversSeed } from "./seeds/drivers.seed";
import { VehiclesSeed } from "./seeds/vehicles.seed";
import { RoutesSeed } from "./seeds/routes.seed";
import { CustomersSeed } from "./seeds/customers.seed";
import { ServiceOrdersSeed } from "./seeds/service-orders.seed";
import { DeliveriesExpandedSeed } from "./seeds/deliveries-expanded.seed";
import { TrackingSeed } from "./seeds/tracking.seed";
import { IncidentsSeed } from "./seeds/incidents.seed";

describe("SeedingService", () => {
  let service: SeedingService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;

  // Mock seeds
  const mockRolesSeed = {
    run: jest.fn(),
  } as unknown as jest.Mocked<RolesSeed>;

  const mockAdminUserSeed = {
    run: jest.fn(),
  } as unknown as jest.Mocked<AdminUserSeed>;

  const mockTestUsersSeed = {
    run: jest.fn(),
  } as unknown as jest.Mocked<TestUsersSeed>;

  const mockDriversSeed = {
    run: jest.fn(),
  } as unknown as jest.Mocked<DriversSeed>;

  const mockVehiclesSeed = {
    run: jest.fn(),
  } as unknown as jest.Mocked<VehiclesSeed>;

  const mockRoutesSeed = {
    run: jest.fn(),
  } as unknown as jest.Mocked<RoutesSeed>;

  const mockCustomersSeed = {
    run: jest.fn(),
  } as unknown as jest.Mocked<CustomersSeed>;

  const mockServiceOrdersSeed = {
    run: jest.fn(),
  } as unknown as jest.Mocked<ServiceOrdersSeed>;

  const mockDeliveriesExpandedSeed = {
    run: jest.fn(),
  } as unknown as jest.Mocked<DeliveriesExpandedSeed>;

  const mockTrackingSeed = {
    run: jest.fn(),
  } as unknown as jest.Mocked<TrackingSeed>;

  const mockIncidentsSeed = {
    run: jest.fn(),
  } as unknown as jest.Mocked<IncidentsSeed>;

  beforeEach(async () => {
    // Create mock query runner
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<QueryRunner>;

    // Create mock data source
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as unknown as jest.Mocked<DataSource>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedingService,
        {
          provide: "DATA_SOURCE",
          useValue: mockDataSource,
        },
        {
          provide: RolesSeed,
          useValue: mockRolesSeed,
        },
        {
          provide: AdminUserSeed,
          useValue: mockAdminUserSeed,
        },
        {
          provide: TestUsersSeed,
          useValue: mockTestUsersSeed,
        },
        {
          provide: DriversSeed,
          useValue: mockDriversSeed,
        },
        {
          provide: VehiclesSeed,
          useValue: mockVehiclesSeed,
        },
        {
          provide: RoutesSeed,
          useValue: mockRoutesSeed,
        },
        {
          provide: CustomersSeed,
          useValue: mockCustomersSeed,
        },
        {
          provide: ServiceOrdersSeed,
          useValue: mockServiceOrdersSeed,
        },
        {
          provide: DeliveriesExpandedSeed,
          useValue: mockDeliveriesExpandedSeed,
        },
        {
          provide: TrackingSeed,
          useValue: mockTrackingSeed,
        },
        {
          provide: IncidentsSeed,
          useValue: mockIncidentsSeed,
        },
      ],
    }).compile();

    service = module.get<SeedingService>(SeedingService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("runAllSeeds", () => {
    it("should execute all seeds in dev environment", async () => {
      await service.runAllSeeds("dev");

      // Verify transaction flow
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();

      // Verify all seeds were called
      expect(mockRolesSeed.run).toHaveBeenCalled();
      expect(mockAdminUserSeed.run).toHaveBeenCalled();
      expect(mockTestUsersSeed.run).toHaveBeenCalled();
      expect(mockDriversSeed.run).toHaveBeenCalled();
      expect(mockVehiclesSeed.run).toHaveBeenCalled();
      expect(mockRoutesSeed.run).toHaveBeenCalled();
      expect(mockCustomersSeed.run).toHaveBeenCalled();
      expect(mockServiceOrdersSeed.run).toHaveBeenCalled();
      expect(mockDeliveriesExpandedSeed.run).toHaveBeenCalled();
      expect(mockTrackingSeed.run).toHaveBeenCalled();
      expect(mockIncidentsSeed.run).toHaveBeenCalled();
    });

    it("should execute only essential seeds in prod environment", async () => {
      await service.runAllSeeds("prod");

      // Verify essential seeds were called
      expect(mockRolesSeed.run).toHaveBeenCalled();
      expect(mockAdminUserSeed.run).toHaveBeenCalled();

      // Verify non-essential seeds were NOT called
      expect(mockTestUsersSeed.run).not.toHaveBeenCalled();
      expect(mockDriversSeed.run).not.toHaveBeenCalled();
      expect(mockVehiclesSeed.run).not.toHaveBeenCalled();
      expect(mockRoutesSeed.run).not.toHaveBeenCalled();
      expect(mockCustomersSeed.run).not.toHaveBeenCalled();
      expect(mockServiceOrdersSeed.run).not.toHaveBeenCalled();
      expect(mockDeliveriesExpandedSeed.run).not.toHaveBeenCalled();
      expect(mockTrackingSeed.run).not.toHaveBeenCalled();
      expect(mockIncidentsSeed.run).not.toHaveBeenCalled();
    });

    it("should execute all seeds in test environment", async () => {
      await service.runAllSeeds("test");

      // Verify all seeds were called
      expect(mockRolesSeed.run).toHaveBeenCalled();
      expect(mockAdminUserSeed.run).toHaveBeenCalled();
      expect(mockTestUsersSeed.run).toHaveBeenCalled();
      expect(mockDriversSeed.run).toHaveBeenCalled();
      expect(mockVehiclesSeed.run).toHaveBeenCalled();
      expect(mockRoutesSeed.run).toHaveBeenCalled();
      expect(mockCustomersSeed.run).toHaveBeenCalled();
      expect(mockServiceOrdersSeed.run).toHaveBeenCalled();
      expect(mockDeliveriesExpandedSeed.run).toHaveBeenCalled();
      expect(mockTrackingSeed.run).toHaveBeenCalled();
      expect(mockIncidentsSeed.run).toHaveBeenCalled();
    });

    it("should rollback transaction on error", async () => {
      const error = new Error("Seed failed");
      mockRolesSeed.run.mockRejectedValueOnce(error);

      await expect(service.runAllSeeds("dev")).rejects.toThrow("Seed failed");

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it("should release query runner even on error", async () => {
      const error = new Error("Seed failed");
      mockRolesSeed.run.mockRejectedValueOnce(error);

      await expect(service.runAllSeeds("dev")).rejects.toThrow();

      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it("should default to dev environment when not specified", async () => {
      await service.runAllSeeds();

      expect(mockTestUsersSeed.run).toHaveBeenCalled();
    });
  });

  describe("runSeed", () => {
    it("should execute roles seed", async () => {
      await service.runSeed("roles", "dev");

      expect(mockRolesSeed.run).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it("should execute admin seed with roles dependency", async () => {
      await service.runSeed("admin", "dev");

      expect(mockRolesSeed.run).toHaveBeenCalled();
      expect(mockAdminUserSeed.run).toHaveBeenCalled();
    });

    it("should execute users seed with roles dependency", async () => {
      await service.runSeed("users", "dev");

      expect(mockRolesSeed.run).toHaveBeenCalled();
      expect(mockTestUsersSeed.run).toHaveBeenCalled();
    });

    it("should throw error when running users seed in prod", async () => {
      await expect(service.runSeed("users", "prod")).rejects.toThrow(
        "Seed de usuários de teste não pode ser executado em produção",
      );
    });

    it("should execute routes seed with dependencies", async () => {
      await service.runSeed("routes", "dev");

      expect(mockDriversSeed.run).toHaveBeenCalled();
      expect(mockVehiclesSeed.run).toHaveBeenCalled();
      expect(mockRoutesSeed.run).toHaveBeenCalled();
    });

    it("should execute deliveries seed with dependencies", async () => {
      await service.runSeed("deliveries", "dev");

      expect(mockDriversSeed.run).toHaveBeenCalled();
      expect(mockVehiclesSeed.run).toHaveBeenCalled();
      expect(mockCustomersSeed.run).toHaveBeenCalled();
      expect(mockDeliveriesExpandedSeed.run).toHaveBeenCalled();
    });

    it("should throw error for unknown seed", async () => {
      await expect(service.runSeed("unknown", "dev")).rejects.toThrow(
        "Seed não encontrado: unknown",
      );
    });

    it("should rollback on seed error", async () => {
      const error = new Error("Seed failed");
      mockRolesSeed.run.mockRejectedValueOnce(error);

      await expect(service.runSeed("roles", "dev")).rejects.toThrow("Seed failed");

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it("should throw error when running drivers seed in prod", async () => {
      await expect(service.runSeed("drivers", "prod")).rejects.toThrow(
        "Seed de motoristas não pode ser executado em produção",
      );
    });

    it("should throw error when running vehicles seed in prod", async () => {
      await expect(service.runSeed("vehicles", "prod")).rejects.toThrow(
        "Seed de veículos não pode ser executado em produção",
      );
    });
  });

  describe("getAvailableSeeds", () => {
    it("should return list of all available seeds", () => {
      const seeds = service.getAvailableSeeds();

      expect(seeds).toEqual([
        "roles",
        "admin",
        "users",
        "drivers",
        "vehicles",
        "routes",
        "customers",
        "deliveries",
        "tracking",
        "incidents",
      ]);
    });

    it("should return an array", () => {
      const seeds = service.getAvailableSeeds();

      expect(Array.isArray(seeds)).toBe(true);
    });

    it("should have correct number of seeds", () => {
      const seeds = service.getAvailableSeeds();

      expect(seeds.length).toBe(10);
    });
  });

  describe("idempotency", () => {
    it("should handle multiple calls to runAllSeeds", async () => {
      // First call
      await service.runAllSeeds("dev");

      // Reset mocks
      jest.clearAllMocks();

      // Second call
      await service.runAllSeeds("dev");

      // Should still execute all seeds (idempotency is handled by individual seeds)
      expect(mockRolesSeed.run).toHaveBeenCalled();
      expect(mockAdminUserSeed.run).toHaveBeenCalled();
    });
  });
});
