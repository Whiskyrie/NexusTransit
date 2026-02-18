import { Test, TestingModule } from "@nestjs/testing";
import { Repository } from "typeorm";
import { VehiclesSeed, VehicleEntity } from "./vehicles.seed";

describe("VehiclesSeed", () => {
  let seed: VehiclesSeed;
  let mockVehicleRepository: jest.Mocked<Repository<VehicleEntity>>;

  beforeEach(async () => {
    mockVehicleRepository = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<VehicleEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesSeed,
        {
          provide: "VEHICLE_REPOSITORY",
          useValue: mockVehicleRepository,
        },
      ],
    }).compile();

    seed = module.get<VehiclesSeed>(VehiclesSeed);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(seed).toBeDefined();
  });

  describe("run", () => {
    it("should skip seed if enough vehicles exist", async () => {
      mockVehicleRepository.count.mockResolvedValue(45);

      await seed.run();

      expect(mockVehicleRepository.create).not.toHaveBeenCalled();
    });

    it("should create vehicles when count is below threshold", async () => {
      mockVehicleRepository.count.mockResolvedValue(10);
      mockVehicleRepository.create.mockReturnValue({ id: "vehicle-id" } as VehicleEntity);
      mockVehicleRepository.save.mockResolvedValue({
        id: "vehicle-id",
        license_plate: "ABC1D23",
        model: "Cargo 1719",
      } as VehicleEntity);

      await seed.run();

      expect(mockVehicleRepository.create).toHaveBeenCalled();
    });

    it("should handle errors when creating vehicle", async () => {
      mockVehicleRepository.count.mockResolvedValue(10);
      mockVehicleRepository.create.mockReturnValue({ id: "vehicle-id" } as VehicleEntity);
      mockVehicleRepository.save.mockRejectedValue(new Error("Database error"));

      // Should not throw - errors are caught and logged
      await expect(seed.run()).resolves.not.toThrow();
    });

    it("should be idempotent - skip if already has enough vehicles", async () => {
      // First run - creates vehicles
      mockVehicleRepository.count.mockResolvedValue(10);
      mockVehicleRepository.create.mockReturnValue({ id: "vehicle-id" } as VehicleEntity);
      mockVehicleRepository.save.mockResolvedValue({ id: "vehicle-id" } as VehicleEntity);

      await seed.run();

      // Second run - skips
      mockVehicleRepository.count.mockResolvedValue(45);
      jest.clearAllMocks();

      await seed.run();

      expect(mockVehicleRepository.create).not.toHaveBeenCalled();
    });

    it("should create vehicles with correct data structure", async () => {
      mockVehicleRepository.count.mockResolvedValue(10);
      mockVehicleRepository.create.mockImplementation((data) => data as VehicleEntity);
      mockVehicleRepository.save.mockResolvedValue({
        id: "vehicle-id",
        license_plate: "ABC1D23",
      } as VehicleEntity);

      await seed.run();

      const createCall = mockVehicleRepository.create.mock.calls[0][0];

      expect(createCall).toHaveProperty("license_plate");
      expect(createCall).toHaveProperty("brand");
      expect(createCall).toHaveProperty("model");
      expect(createCall).toHaveProperty("year");
      expect(createCall).toHaveProperty("vehicle_type");
      expect(createCall).toHaveProperty("status");
    });
  });
});
