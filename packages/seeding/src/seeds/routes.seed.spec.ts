import { Test, TestingModule } from "@nestjs/testing";
import { Repository } from "typeorm";
import {
  RoutesSeed,
  RouteEntity,
  RouteStopEntity,
  DriverEntity,
  VehicleEntity,
} from "./routes.seed";

describe("RoutesSeed", () => {
  let seed: RoutesSeed;
  let mockRouteRepository: jest.Mocked<Repository<RouteEntity>>;
  let mockRouteStopRepository: jest.Mocked<Repository<RouteStopEntity>>;
  let mockDriverRepository: jest.Mocked<Repository<DriverEntity>>;
  let mockVehicleRepository: jest.Mocked<Repository<VehicleEntity>>;

  beforeEach(async () => {
    mockRouteRepository = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<RouteEntity>>;

    mockRouteStopRepository = {
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<RouteStopEntity>>;

    mockDriverRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<DriverEntity>>;

    mockVehicleRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<VehicleEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutesSeed,
        {
          provide: "ROUTE_REPOSITORY",
          useValue: mockRouteRepository,
        },
        {
          provide: "ROUTE_STOP_REPOSITORY",
          useValue: mockRouteStopRepository,
        },
        {
          provide: "DRIVER_REPOSITORY",
          useValue: mockDriverRepository,
        },
        {
          provide: "VEHICLE_REPOSITORY",
          useValue: mockVehicleRepository,
        },
      ],
    }).compile();

    seed = module.get<RoutesSeed>(RoutesSeed);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(seed).toBeDefined();
  });

  describe("run", () => {
    it("should skip seed if enough routes exist", async () => {
      mockRouteRepository.count.mockResolvedValue(75);

      await seed.run();

      expect(mockDriverRepository.find).not.toHaveBeenCalled();
      expect(mockRouteRepository.create).not.toHaveBeenCalled();
    });

    it("should create routes when count is below threshold", async () => {
      mockRouteRepository.count.mockResolvedValue(10);
      mockDriverRepository.find.mockResolvedValue([
        { id: "driver-1", full_name: "Driver 1", status: "active" } as DriverEntity,
      ]);
      mockVehicleRepository.find.mockResolvedValue([
        { id: "vehicle-1", license_plate: "ABC1D23", status: "active" } as VehicleEntity,
      ]);
      mockRouteRepository.create.mockReturnValue({ id: "route-id" } as RouteEntity);
      mockRouteRepository.save.mockResolvedValue({ id: "route-id" } as RouteEntity);
      mockRouteStopRepository.create.mockReturnValue({ id: "stop-id" } as RouteStopEntity);
      mockRouteStopRepository.save.mockResolvedValue({ id: "stop-id" } as RouteStopEntity);

      await seed.run();

      expect(mockRouteRepository.create).toHaveBeenCalled();
    });

    it("should handle errors when creating route", async () => {
      mockRouteRepository.count.mockResolvedValue(10);
      mockDriverRepository.find.mockResolvedValue([
        { id: "driver-1", full_name: "Driver 1", status: "active" } as DriverEntity,
      ]);
      mockVehicleRepository.find.mockResolvedValue([
        { id: "vehicle-1", license_plate: "ABC1D23", status: "active" } as VehicleEntity,
      ]);
      mockRouteRepository.create.mockReturnValue({ id: "route-id" } as RouteEntity);
      mockRouteRepository.save.mockRejectedValue(new Error("Database error"));

      // Should not throw - errors are caught and logged
      await expect(seed.run()).resolves.not.toThrow();
    });

    it("should be idempotent - skip if already has enough routes", async () => {
      // First run - creates routes
      mockRouteRepository.count.mockResolvedValue(10);
      mockDriverRepository.find.mockResolvedValue([
        { id: "driver-1", full_name: "Driver 1", status: "active" } as DriverEntity,
      ]);
      mockVehicleRepository.find.mockResolvedValue([
        { id: "vehicle-1", license_plate: "ABC1D23", status: "active" } as VehicleEntity,
      ]);
      mockRouteRepository.create.mockReturnValue({ id: "route-id" } as RouteEntity);
      mockRouteRepository.save.mockResolvedValue({ id: "route-id" } as RouteEntity);
      mockRouteStopRepository.create.mockReturnValue({ id: "stop-id" } as RouteStopEntity);
      mockRouteStopRepository.save.mockResolvedValue({ id: "stop-id" } as RouteStopEntity);

      await seed.run();

      // Second run - skips
      jest.clearAllMocks();
      mockRouteRepository.count.mockResolvedValue(75);

      await seed.run();

      expect(mockRouteRepository.create).not.toHaveBeenCalled();
    });

    it("should skip if no drivers found", async () => {
      mockRouteRepository.count.mockResolvedValue(10);
      mockDriverRepository.find.mockResolvedValue([]);
      mockVehicleRepository.find.mockResolvedValue([
        { id: "vehicle-1", license_plate: "ABC1D23", status: "active" } as VehicleEntity,
      ]);

      await seed.run();

      expect(mockRouteRepository.create).not.toHaveBeenCalled();
    });

    it("should skip if no vehicles found", async () => {
      mockRouteRepository.count.mockResolvedValue(10);
      mockDriverRepository.find.mockResolvedValue([
        { id: "driver-1", full_name: "Driver 1", status: "active" } as DriverEntity,
      ]);
      mockVehicleRepository.find.mockResolvedValue([]);

      await seed.run();

      expect(mockRouteRepository.create).not.toHaveBeenCalled();
    });
  });
});
