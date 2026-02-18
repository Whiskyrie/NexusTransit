import { Test, TestingModule } from "@nestjs/testing";
import { Repository } from "typeorm";
import { CustomersSeed, CustomerEntity, CustomerAddressEntity } from "./customers.seed";

describe("CustomersSeed", () => {
  let seed: CustomersSeed;
  let mockCustomerRepository: jest.Mocked<Repository<CustomerEntity>>;
  let mockCustomerAddressRepository: jest.Mocked<Repository<CustomerAddressEntity>>;

  beforeEach(async () => {
    mockCustomerRepository = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<CustomerEntity>>;

    mockCustomerAddressRepository = {
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<CustomerAddressEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersSeed,
        {
          provide: "CUSTOMER_REPOSITORY",
          useValue: mockCustomerRepository,
        },
        {
          provide: "CUSTOMER_ADDRESS_REPOSITORY",
          useValue: mockCustomerAddressRepository,
        },
      ],
    }).compile();

    seed = module.get<CustomersSeed>(CustomersSeed);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(seed).toBeDefined();
  });

  describe("run", () => {
    it("should skip seed if enough customers exist", async () => {
      mockCustomerRepository.count.mockResolvedValue(160);

      await seed.run();

      expect(mockCustomerRepository.create).not.toHaveBeenCalled();
    });

    it("should create customers when count is below threshold", async () => {
      mockCustomerRepository.count.mockResolvedValue(50);
      mockCustomerRepository.create.mockReturnValue({ id: "customer-id" } as CustomerEntity);
      mockCustomerRepository.save.mockResolvedValue({
        id: "customer-id",
        name: "Test Customer",
      } as CustomerEntity);
      mockCustomerAddressRepository.create.mockReturnValue({
        id: "address-id",
      } as CustomerAddressEntity);
      mockCustomerAddressRepository.save.mockResolvedValue({
        id: "address-id",
      } as CustomerAddressEntity);

      await seed.run();

      expect(mockCustomerRepository.create).toHaveBeenCalled();
    });

    it("should handle errors when creating customer", async () => {
      mockCustomerRepository.count.mockResolvedValue(50);
      mockCustomerRepository.create.mockReturnValue({ id: "customer-id" } as CustomerEntity);
      mockCustomerRepository.save.mockRejectedValue(new Error("Database error"));

      // Should not throw - errors are caught and logged
      await expect(seed.run()).resolves.not.toThrow();
    });

    it("should be idempotent - skip if already has enough customers", async () => {
      // First run - creates customers
      mockCustomerRepository.count.mockResolvedValue(50);
      mockCustomerRepository.create.mockReturnValue({ id: "customer-id" } as CustomerEntity);
      mockCustomerRepository.save.mockResolvedValue({ id: "customer-id" } as CustomerEntity);
      mockCustomerAddressRepository.create.mockReturnValue({
        id: "address-id",
      } as CustomerAddressEntity);
      mockCustomerAddressRepository.save.mockResolvedValue({
        id: "address-id",
      } as CustomerAddressEntity);

      await seed.run();

      // Second run - skips
      mockCustomerRepository.count.mockResolvedValue(160);
      jest.clearAllMocks();

      await seed.run();

      expect(mockCustomerRepository.create).not.toHaveBeenCalled();
    });
  });
});
