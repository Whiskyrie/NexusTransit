import { Test, TestingModule } from "@nestjs/testing";
import { Repository } from "typeorm";
import {
  ServiceOrdersSeed,
  ServiceOrderEntity,
  CustomerEntity,
  CustomerAddressEntity,
  DriverEntity,
  VehicleEntity,
} from "./service-orders.seed";

describe("ServiceOrdersSeed", () => {
  let seed: ServiceOrdersSeed;
  let mockServiceOrderRepository: jest.Mocked<Repository<ServiceOrderEntity>>;
  let mockCustomerRepository: jest.Mocked<Repository<CustomerEntity>>;
  let mockCustomerAddressRepository: jest.Mocked<Repository<CustomerAddressEntity>>;
  let mockDriverRepository: jest.Mocked<Repository<DriverEntity>>;
  let mockVehicleRepository: jest.Mocked<Repository<VehicleEntity>>;

  beforeEach(async () => {
    mockServiceOrderRepository = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<ServiceOrderEntity>>;

    mockCustomerRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<CustomerEntity>>;

    mockCustomerAddressRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<CustomerAddressEntity>>;

    mockDriverRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<DriverEntity>>;

    mockVehicleRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<VehicleEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceOrdersSeed,
        {
          provide: "SERVICE_ORDER_REPOSITORY",
          useValue: mockServiceOrderRepository,
        },
        {
          provide: "CUSTOMER_REPOSITORY",
          useValue: mockCustomerRepository,
        },
        {
          provide: "CUSTOMER_ADDRESS_REPOSITORY",
          useValue: mockCustomerAddressRepository,
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

    seed = module.get<ServiceOrdersSeed>(ServiceOrdersSeed);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(seed).toBeDefined();
  });

  describe("run", () => {
    it("should skip seed if enough service orders exist", async () => {
      mockServiceOrderRepository.count.mockResolvedValue(350);

      await seed.run();

      expect(mockCustomerRepository.find).not.toHaveBeenCalled();
      expect(mockServiceOrderRepository.create).not.toHaveBeenCalled();
    });

    it("should create service orders when count is below threshold", async () => {
      mockServiceOrderRepository.count.mockResolvedValue(50);
      mockCustomerRepository.find.mockResolvedValue([
        { id: "customer-1", name: "Customer 1", category: "standard" } as CustomerEntity,
      ]);
      mockCustomerAddressRepository.find.mockResolvedValue([
        {
          id: "address-1",
          customerId: "customer-1",
          street: "Rua Teste",
          city: "São Paulo",
          state: "SP",
        } as CustomerAddressEntity,
      ]);
      mockDriverRepository.find.mockResolvedValue([
        { id: "driver-1", name: "Driver 1" } as DriverEntity,
      ]);
      mockVehicleRepository.find.mockResolvedValue([
        { id: "vehicle-1", license_plate: "ABC1D23" } as VehicleEntity,
      ]);
      mockServiceOrderRepository.create.mockReturnValue({ id: "order-id" } as ServiceOrderEntity);
      mockServiceOrderRepository.save.mockResolvedValue({ id: "order-id" } as ServiceOrderEntity);

      await seed.run();

      expect(mockServiceOrderRepository.create).toHaveBeenCalled();
    });

    it("should handle errors when creating service order", async () => {
      mockServiceOrderRepository.count.mockResolvedValue(50);
      mockCustomerRepository.find.mockResolvedValue([
        { id: "customer-1", name: "Customer 1", category: "standard" } as CustomerEntity,
      ]);
      mockCustomerAddressRepository.find.mockResolvedValue([
        {
          id: "address-1",
          customerId: "customer-1",
          street: "Rua Teste",
          city: "São Paulo",
          state: "SP",
        } as CustomerAddressEntity,
      ]);
      mockDriverRepository.find.mockResolvedValue([
        { id: "driver-1", name: "Driver 1" } as DriverEntity,
      ]);
      mockVehicleRepository.find.mockResolvedValue([
        { id: "vehicle-1", license_plate: "ABC1D23" } as VehicleEntity,
      ]);
      mockServiceOrderRepository.create.mockReturnValue({ id: "order-id" } as ServiceOrderEntity);
      mockServiceOrderRepository.save.mockRejectedValue(new Error("Database error"));

      await expect(seed.run()).resolves.not.toThrow();
    });

    it("should be idempotent - skip if already has enough orders", async () => {
      mockServiceOrderRepository.count.mockResolvedValue(50);
      mockCustomerRepository.find.mockResolvedValue([
        { id: "customer-1", name: "Customer 1", category: "standard" } as CustomerEntity,
      ]);
      mockCustomerAddressRepository.find.mockResolvedValue([
        {
          id: "address-1",
          customerId: "customer-1",
          street: "Rua Teste",
          city: "São Paulo",
          state: "SP",
        } as CustomerAddressEntity,
      ]);
      mockDriverRepository.find.mockResolvedValue([
        { id: "driver-1", name: "Driver 1" } as DriverEntity,
      ]);
      mockVehicleRepository.find.mockResolvedValue([
        { id: "vehicle-1", license_plate: "ABC1D23" } as VehicleEntity,
      ]);
      mockServiceOrderRepository.create.mockReturnValue({ id: "order-id" } as ServiceOrderEntity);
      mockServiceOrderRepository.save.mockResolvedValue({ id: "order-id" } as ServiceOrderEntity);

      await seed.run();

      jest.clearAllMocks();
      mockServiceOrderRepository.count.mockResolvedValue(350);

      await seed.run();

      expect(mockServiceOrderRepository.create).not.toHaveBeenCalled();
    });

    it("should skip if no customers found", async () => {
      mockServiceOrderRepository.count.mockResolvedValue(50);
      mockCustomerRepository.find.mockResolvedValue([]);
      mockCustomerAddressRepository.find.mockResolvedValue([]);
      mockDriverRepository.find.mockResolvedValue([
        { id: "driver-1", name: "Driver 1" } as DriverEntity,
      ]);
      mockVehicleRepository.find.mockResolvedValue([
        { id: "vehicle-1", license_plate: "ABC1D23" } as VehicleEntity,
      ]);

      await seed.run();

      expect(mockServiceOrderRepository.create).not.toHaveBeenCalled();
    });
  });
});
