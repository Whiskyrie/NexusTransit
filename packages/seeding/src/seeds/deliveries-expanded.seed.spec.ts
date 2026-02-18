import { Test, TestingModule } from "@nestjs/testing";
import { Repository, DataSource } from "typeorm";
import {
  DeliveriesExpandedSeed,
  DeliveryEntity,
  CustomerEntity,
  DriverEntity,
  VehicleEntity,
} from "./deliveries-expanded.seed";

describe("DeliveriesExpandedSeed", () => {
  let seed: DeliveriesExpandedSeed;
  let mockDeliveryRepository: jest.Mocked<Repository<DeliveryEntity>>;
  let mockCustomerRepository: jest.Mocked<Repository<CustomerEntity>>;
  let mockDriverRepository: jest.Mocked<Repository<DriverEntity>>;
  let mockVehicleRepository: jest.Mocked<Repository<VehicleEntity>>;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    mockDeliveryRepository = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<DeliveryEntity>>;

    mockCustomerRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<CustomerEntity>>;

    mockDriverRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<DriverEntity>>;

    mockVehicleRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<VehicleEntity>>;

    mockDataSource = {
      query: jest.fn(),
    } as unknown as jest.Mocked<DataSource>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveriesExpandedSeed,
        {
          provide: "DATA_SOURCE",
          useValue: mockDataSource,
        },
        {
          provide: "DELIVERY_REPOSITORY",
          useValue: mockDeliveryRepository,
        },
        {
          provide: "CUSTOMER_REPOSITORY",
          useValue: mockCustomerRepository,
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

    seed = module.get<DeliveriesExpandedSeed>(DeliveriesExpandedSeed);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(seed).toBeDefined();
  });

  describe("run", () => {
    it("should skip seed if enough deliveries exist", async () => {
      mockDeliveryRepository.count.mockResolvedValue(300);

      await seed.run();

      expect(mockCustomerRepository.find).not.toHaveBeenCalled();
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it("should create deliveries when count is below threshold", async () => {
      mockDeliveryRepository.count.mockResolvedValue(50);
      mockCustomerRepository.find.mockResolvedValue([{ id: "customer-1", name: "Customer 1" }]);
      mockDriverRepository.find.mockResolvedValue([{ id: "driver-1", full_name: "Driver 1" }]);
      mockVehicleRepository.find.mockResolvedValue([{ id: "vehicle-1", license_plate: "ABC1D23" }]);
      mockDataSource.query.mockResolvedValue(undefined);

      await seed.run();

      expect(mockDataSource.query).toHaveBeenCalled();
    });

    it("should handle errors when creating delivery", async () => {
      mockDeliveryRepository.count.mockResolvedValue(50);
      mockCustomerRepository.find.mockResolvedValue([{ id: "customer-1", name: "Customer 1" }]);
      mockDriverRepository.find.mockResolvedValue([{ id: "driver-1", full_name: "Driver 1" }]);
      mockVehicleRepository.find.mockResolvedValue([{ id: "vehicle-1", license_plate: "ABC1D23" }]);
      mockDataSource.query.mockRejectedValue(new Error("Database error"));

      await expect(seed.run()).resolves.not.toThrow();
    });

    it("should be idempotent - skip if already has enough deliveries", async () => {
      mockDeliveryRepository.count.mockResolvedValue(50);
      mockCustomerRepository.find.mockResolvedValue([{ id: "customer-1", name: "Customer 1" }]);
      mockDriverRepository.find.mockResolvedValue([{ id: "driver-1", full_name: "Driver 1" }]);
      mockVehicleRepository.find.mockResolvedValue([{ id: "vehicle-1", license_plate: "ABC1D23" }]);
      mockDataSource.query.mockResolvedValue(undefined);

      await seed.run();

      jest.clearAllMocks();
      mockDeliveryRepository.count.mockResolvedValue(300);

      await seed.run();

      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it("should skip if no customers found", async () => {
      mockDeliveryRepository.count.mockResolvedValue(50);
      mockCustomerRepository.find.mockResolvedValue([]);
      mockDriverRepository.find.mockResolvedValue([{ id: "driver-1", full_name: "Driver 1" }]);
      mockVehicleRepository.find.mockResolvedValue([{ id: "vehicle-1", license_plate: "ABC1D23" }]);

      await seed.run();

      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it("should skip if no drivers found", async () => {
      mockDeliveryRepository.count.mockResolvedValue(50);
      mockCustomerRepository.find.mockResolvedValue([{ id: "customer-1", name: "Customer 1" }]);
      mockDriverRepository.find.mockResolvedValue([]);
      mockVehicleRepository.find.mockResolvedValue([{ id: "vehicle-1", license_plate: "ABC1D23" }]);

      await seed.run();

      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it("should skip if no vehicles found", async () => {
      mockDeliveryRepository.count.mockResolvedValue(50);
      mockCustomerRepository.find.mockResolvedValue([{ id: "customer-1", name: "Customer 1" }]);
      mockDriverRepository.find.mockResolvedValue([{ id: "driver-1", full_name: "Driver 1" }]);
      mockVehicleRepository.find.mockResolvedValue([]);

      await seed.run();

      expect(mockDataSource.query).not.toHaveBeenCalled();
    });
  });
});
