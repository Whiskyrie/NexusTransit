import { Test, TestingModule } from "@nestjs/testing";
import { Repository } from "typeorm";
import {
  IncidentsSeed,
  IncidentEntity,
  IncidentCommentEntity,
  DeliveryEntity,
  DriverEntity,
  VehicleEntity,
  UserEntity,
} from "./incidents.seed";

describe("IncidentsSeed", () => {
  let seed: IncidentsSeed;
  let mockIncidentRepository: jest.Mocked<Repository<IncidentEntity>>;
  let mockIncidentCommentRepository: jest.Mocked<Repository<IncidentCommentEntity>>;
  let mockDeliveryRepository: jest.Mocked<Repository<DeliveryEntity>>;
  let mockDriverRepository: jest.Mocked<Repository<DriverEntity>>;
  let mockVehicleRepository: jest.Mocked<Repository<VehicleEntity>>;
  let mockUserRepository: jest.Mocked<Repository<UserEntity>>;

  beforeEach(async () => {
    mockIncidentRepository = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<IncidentEntity>>;

    mockIncidentCommentRepository = {
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<IncidentCommentEntity>>;

    mockDeliveryRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<DeliveryEntity>>;

    mockDriverRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<DriverEntity>>;

    mockVehicleRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<VehicleEntity>>;

    mockUserRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<UserEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsSeed,
        {
          provide: "INCIDENT_REPOSITORY",
          useValue: mockIncidentRepository,
        },
        {
          provide: "INCIDENT_COMMENT_REPOSITORY",
          useValue: mockIncidentCommentRepository,
        },
        {
          provide: "DELIVERY_REPOSITORY",
          useValue: mockDeliveryRepository,
        },
        {
          provide: "DRIVER_REPOSITORY",
          useValue: mockDriverRepository,
        },
        {
          provide: "VEHICLE_REPOSITORY",
          useValue: mockVehicleRepository,
        },
        {
          provide: "USER_REPOSITORY",
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    seed = module.get<IncidentsSeed>(IncidentsSeed);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(seed).toBeDefined();
  });

  describe("run", () => {
    it("should skip seed if enough incidents exist", async () => {
      mockIncidentRepository.count.mockResolvedValue(30);

      await seed.run();

      expect(mockDeliveryRepository.find).not.toHaveBeenCalled();
      expect(mockIncidentRepository.create).not.toHaveBeenCalled();
    });

    it("should create incidents when count is below threshold", async () => {
      mockIncidentRepository.count.mockResolvedValue(10);
      mockDeliveryRepository.find.mockResolvedValue([
        {
          id: "delivery-1",
          tracking_code: "TRK001",
          status: "in_transit",
          driver_id: "driver-1",
        } as DeliveryEntity,
      ]);
      mockDriverRepository.find.mockResolvedValue([
        { id: "driver-1", full_name: "Driver 1" } as DriverEntity,
      ]);
      mockVehicleRepository.find.mockResolvedValue([
        { id: "vehicle-1", license_plate: "ABC1D23" } as VehicleEntity,
      ]);
      mockUserRepository.find.mockResolvedValue([
        { id: "user-1", name: "Admin User" } as UserEntity,
      ]);
      mockIncidentRepository.create.mockReturnValue({ id: "incident-id" } as IncidentEntity);
      mockIncidentRepository.save.mockResolvedValue({ id: "incident-id" } as IncidentEntity);
      mockIncidentCommentRepository.create.mockReturnValue({
        id: "comment-id",
      } as IncidentCommentEntity);
      mockIncidentCommentRepository.save.mockResolvedValue({
        id: "comment-id",
      } as IncidentCommentEntity);

      await seed.run();

      expect(mockIncidentRepository.create).toHaveBeenCalled();
    });

    it("should handle errors when creating incident", async () => {
      mockIncidentRepository.count.mockResolvedValue(10);
      mockDeliveryRepository.find.mockResolvedValue([
        {
          id: "delivery-1",
          tracking_code: "TRK001",
          status: "in_transit",
          driver_id: "driver-1",
        } as DeliveryEntity,
      ]);
      mockDriverRepository.find.mockResolvedValue([
        { id: "driver-1", full_name: "Driver 1" } as DriverEntity,
      ]);
      mockVehicleRepository.find.mockResolvedValue([
        { id: "vehicle-1", license_plate: "ABC1D23" } as VehicleEntity,
      ]);
      mockUserRepository.find.mockResolvedValue([
        { id: "user-1", name: "Admin User" } as UserEntity,
      ]);
      mockIncidentRepository.create.mockReturnValue({ id: "incident-id" } as IncidentEntity);
      mockIncidentRepository.save.mockRejectedValue(new Error("Database error"));

      await expect(seed.run()).resolves.not.toThrow();
    });

    it("should be idempotent - skip if already has enough incidents", async () => {
      mockIncidentRepository.count.mockResolvedValue(10);
      mockDeliveryRepository.find.mockResolvedValue([
        {
          id: "delivery-1",
          tracking_code: "TRK001",
          status: "in_transit",
          driver_id: "driver-1",
        } as DeliveryEntity,
      ]);
      mockDriverRepository.find.mockResolvedValue([
        { id: "driver-1", full_name: "Driver 1" } as DriverEntity,
      ]);
      mockVehicleRepository.find.mockResolvedValue([
        { id: "vehicle-1", license_plate: "ABC1D23" } as VehicleEntity,
      ]);
      mockUserRepository.find.mockResolvedValue([
        { id: "user-1", name: "Admin User" } as UserEntity,
      ]);
      mockIncidentRepository.create.mockReturnValue({ id: "incident-id" } as IncidentEntity);
      mockIncidentRepository.save.mockResolvedValue({ id: "incident-id" } as IncidentEntity);
      mockIncidentCommentRepository.create.mockReturnValue({
        id: "comment-id",
      } as IncidentCommentEntity);
      mockIncidentCommentRepository.save.mockResolvedValue({
        id: "comment-id",
      } as IncidentCommentEntity);

      await seed.run();

      jest.clearAllMocks();
      mockIncidentRepository.count.mockResolvedValue(30);

      await seed.run();

      expect(mockIncidentRepository.create).not.toHaveBeenCalled();
    });

    it("should skip if no drivers found", async () => {
      mockIncidentRepository.count.mockResolvedValue(10);
      mockDeliveryRepository.find.mockResolvedValue([
        {
          id: "delivery-1",
          tracking_code: "TRK001",
          status: "in_transit",
          driver_id: "driver-1",
        } as DeliveryEntity,
      ]);
      mockDriverRepository.find.mockResolvedValue([]);
      mockVehicleRepository.find.mockResolvedValue([
        { id: "vehicle-1", license_plate: "ABC1D23" } as VehicleEntity,
      ]);
      mockUserRepository.find.mockResolvedValue([
        { id: "user-1", name: "Admin User" } as UserEntity,
      ]);

      await seed.run();

      expect(mockIncidentRepository.create).not.toHaveBeenCalled();
    });

    it("should skip if no users found", async () => {
      mockIncidentRepository.count.mockResolvedValue(10);
      mockDeliveryRepository.find.mockResolvedValue([
        {
          id: "delivery-1",
          tracking_code: "TRK001",
          status: "in_transit",
          driver_id: "driver-1",
        } as DeliveryEntity,
      ]);
      mockDriverRepository.find.mockResolvedValue([
        { id: "driver-1", full_name: "Driver 1" } as DriverEntity,
      ]);
      mockVehicleRepository.find.mockResolvedValue([
        { id: "vehicle-1", license_plate: "ABC1D23" } as VehicleEntity,
      ]);
      mockUserRepository.find.mockResolvedValue([]);

      await seed.run();

      expect(mockIncidentRepository.create).not.toHaveBeenCalled();
    });
  });
});
