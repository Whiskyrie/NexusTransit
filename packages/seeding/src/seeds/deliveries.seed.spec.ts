import { Test, TestingModule } from "@nestjs/testing";
import { Repository } from "typeorm";
import { DeliveriesSeed } from "./deliveries.seed";
import type {
  DeliveryEntity,
  CustomerEntity,
  DriverEntity,
  VehicleEntity,
} from "../interfaces/delivery-seed.interface";

describe("DeliveriesSeed", () => {
  let seed: DeliveriesSeed;
  let mockDeliveryRepository: jest.Mocked<Repository<DeliveryEntity>>;
  let mockCustomerRepository: jest.Mocked<Repository<CustomerEntity>>;
  let mockDriverRepository: jest.Mocked<Repository<DriverEntity>>;
  let mockVehicleRepository: jest.Mocked<Repository<VehicleEntity>>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveriesSeed,
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

    seed = module.get<DeliveriesSeed>(DeliveriesSeed);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(seed).toBeDefined();
  });

  describe("run", () => {
    it("should skip seed if enough deliveries exist", async () => {
      mockDeliveryRepository.count.mockResolvedValue(100);

      await seed.run();

      expect(mockCustomerRepository.find).not.toHaveBeenCalled();
      expect(mockDeliveryRepository.create).not.toHaveBeenCalled();
    });

    it("should create deliveries when count is below threshold", async () => {
      mockDeliveryRepository.count.mockResolvedValue(0);
      mockCustomerRepository.find.mockResolvedValue([
        { id: "customer-1", name: "Customer 1" },
        { id: "customer-2", name: "Customer 2" },
      ]);
      mockDriverRepository.find.mockResolvedValue([{ id: "driver-1", full_name: "Driver 1" }]);
      mockVehicleRepository.find.mockResolvedValue([{ id: "vehicle-1", license_plate: "ABC1D23" }]);
      mockDeliveryRepository.create.mockImplementation((data) => data as DeliveryEntity);
      mockDeliveryRepository.save.mockResolvedValue({ id: "delivery-id" } as DeliveryEntity);

      await seed.run();

      expect(mockDeliveryRepository.create).toHaveBeenCalled();
      expect(mockDeliveryRepository.save).toHaveBeenCalled();
    });

    it("should skip if no customers found", async () => {
      mockDeliveryRepository.count.mockResolvedValue(0);
      mockCustomerRepository.find.mockResolvedValue([]);
      mockDriverRepository.find.mockResolvedValue([{ id: "driver-1", full_name: "Driver 1" }]);
      mockVehicleRepository.find.mockResolvedValue([{ id: "vehicle-1", license_plate: "ABC1D23" }]);

      await seed.run();

      expect(mockDeliveryRepository.create).not.toHaveBeenCalled();
    });

    it("should skip if no drivers found", async () => {
      mockDeliveryRepository.count.mockResolvedValue(0);
      mockCustomerRepository.find.mockResolvedValue([{ id: "customer-1", name: "Customer 1" }]);
      mockDriverRepository.find.mockResolvedValue([]);
      mockVehicleRepository.find.mockResolvedValue([{ id: "vehicle-1", license_plate: "ABC1D23" }]);

      await seed.run();

      expect(mockDeliveryRepository.create).not.toHaveBeenCalled();
    });

    it("should skip if no vehicles found", async () => {
      mockDeliveryRepository.count.mockResolvedValue(0);
      mockCustomerRepository.find.mockResolvedValue([{ id: "customer-1", name: "Customer 1" }]);
      mockDriverRepository.find.mockResolvedValue([{ id: "driver-1", full_name: "Driver 1" }]);
      mockVehicleRepository.find.mockResolvedValue([]);

      await seed.run();

      expect(mockDeliveryRepository.create).not.toHaveBeenCalled();
    });

    it("should be idempotent", async () => {
      mockDeliveryRepository.count.mockResolvedValue(0);
      mockCustomerRepository.find.mockResolvedValue([{ id: "customer-1", name: "Customer 1" }]);
      mockDriverRepository.find.mockResolvedValue([{ id: "driver-1", full_name: "Driver 1" }]);
      mockVehicleRepository.find.mockResolvedValue([{ id: "vehicle-1", license_plate: "ABC1D23" }]);
      mockDeliveryRepository.create.mockImplementation((data) => data as DeliveryEntity);
      mockDeliveryRepository.save.mockResolvedValue({ id: "delivery-id" } as DeliveryEntity);

      await seed.run();

      jest.clearAllMocks();
      mockDeliveryRepository.count.mockResolvedValue(100);

      await seed.run();

      expect(mockDeliveryRepository.create).not.toHaveBeenCalled();
    });
  });
});
