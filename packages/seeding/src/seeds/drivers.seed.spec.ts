import { Test, TestingModule } from "@nestjs/testing";
import { Repository } from "typeorm";
import { DriversSeed, DriverEntity, DriverLicenseEntity } from "./drivers.seed";

describe("DriversSeed", () => {
  let seed: DriversSeed;
  let mockDriverRepository: jest.Mocked<Repository<DriverEntity>>;
  let mockDriverLicenseRepository: jest.Mocked<Repository<DriverLicenseEntity>>;

  beforeEach(async () => {
    mockDriverRepository = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<DriverEntity>>;

    mockDriverLicenseRepository = {
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<DriverLicenseEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversSeed,
        {
          provide: "DRIVER_REPOSITORY",
          useValue: mockDriverRepository,
        },
        {
          provide: "DRIVER_LICENSE_REPOSITORY",
          useValue: mockDriverLicenseRepository,
        },
      ],
    }).compile();

    seed = module.get<DriversSeed>(DriversSeed);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(seed).toBeDefined();
  });

  describe("run", () => {
    it("should skip seed if enough drivers exist", async () => {
      mockDriverRepository.count.mockResolvedValue(45);

      await seed.run();

      expect(mockDriverRepository.create).not.toHaveBeenCalled();
    });

    it("should create drivers when count is below threshold", async () => {
      mockDriverRepository.count.mockResolvedValue(10);
      mockDriverRepository.create.mockReturnValue({ id: "driver-id" } as DriverEntity);
      mockDriverRepository.save.mockResolvedValue({
        id: "driver-id",
        full_name: "Test Driver",
      } as DriverEntity);
      mockDriverLicenseRepository.create.mockReturnValue({
        id: "license-id",
      } as DriverLicenseEntity);
      mockDriverLicenseRepository.save.mockResolvedValue({
        id: "license-id",
      } as DriverLicenseEntity);

      await seed.run();

      expect(mockDriverRepository.create).toHaveBeenCalled();
    });

    it("should handle errors when creating driver", async () => {
      mockDriverRepository.count.mockResolvedValue(10);
      mockDriverRepository.create.mockReturnValue({ id: "driver-id" } as DriverEntity);
      mockDriverRepository.save.mockRejectedValue(new Error("Database error"));

      // Should not throw - errors are caught and logged
      await expect(seed.run()).resolves.not.toThrow();
    });

    it("should create license for driver", async () => {
      mockDriverRepository.count.mockResolvedValue(10);
      mockDriverRepository.create.mockReturnValue({ id: "driver-id" } as DriverEntity);
      mockDriverRepository.save.mockResolvedValue({
        id: "driver-id",
        full_name: "Test Driver",
      } as DriverEntity);
      mockDriverLicenseRepository.create.mockReturnValue({
        id: "license-id",
      } as DriverLicenseEntity);
      mockDriverLicenseRepository.save.mockResolvedValue({
        id: "license-id",
      } as DriverLicenseEntity);

      await seed.run();

      expect(mockDriverLicenseRepository.create).toHaveBeenCalled();
      expect(mockDriverLicenseRepository.save).toHaveBeenCalled();
    });

    it("should be idempotent - skip if already has enough drivers", async () => {
      // First run - creates drivers
      mockDriverRepository.count.mockResolvedValue(10);
      mockDriverRepository.create.mockReturnValue({ id: "driver-id" } as DriverEntity);
      mockDriverRepository.save.mockResolvedValue({ id: "driver-id" } as DriverEntity);
      mockDriverLicenseRepository.create.mockReturnValue({
        id: "license-id",
      } as DriverLicenseEntity);
      mockDriverLicenseRepository.save.mockResolvedValue({
        id: "license-id",
      } as DriverLicenseEntity);

      await seed.run();

      // Second run - skips
      mockDriverRepository.count.mockResolvedValue(45);
      jest.clearAllMocks();

      await seed.run();

      expect(mockDriverRepository.create).not.toHaveBeenCalled();
    });
  });
});
