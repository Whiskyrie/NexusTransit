import { Test, TestingModule } from "@nestjs/testing";
import { Repository, DataSource } from "typeorm";
import { TrackingSeed, TrackingEventEntity, DeliveryEntity, DriverEntity } from "./tracking.seed";

describe("TrackingSeed", () => {
  let seed: TrackingSeed;
  let mockTrackingEventRepository: jest.Mocked<Repository<TrackingEventEntity>>;
  let mockDeliveryRepository: jest.Mocked<Repository<DeliveryEntity>>;
  let mockDriverRepository: jest.Mocked<Repository<DriverEntity>>;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    mockTrackingEventRepository = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<TrackingEventEntity>>;

    mockDeliveryRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<DeliveryEntity>>;

    mockDriverRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<DriverEntity>>;

    mockDataSource = {
      query: jest.fn(),
    } as unknown as jest.Mocked<DataSource>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingSeed,
        {
          provide: "TRACKING_EVENT_REPOSITORY",
          useValue: mockTrackingEventRepository,
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
          provide: "DATA_SOURCE",
          useValue: mockDataSource,
        },
      ],
    }).compile();

    seed = module.get<TrackingSeed>(TrackingSeed);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(seed).toBeDefined();
  });

  describe("run", () => {
    it("should skip seed if enough tracking events exist", async () => {
      mockTrackingEventRepository.count.mockResolvedValue(6000);

      await seed.run();

      expect(mockDeliveryRepository.find).not.toHaveBeenCalled();
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it("should create tracking events when count is below threshold", async () => {
      mockTrackingEventRepository.count.mockResolvedValue(100);
      mockDeliveryRepository.find.mockResolvedValue([
        { id: "delivery-1", tracking_code: "TRK001", status: "IN_TRANSIT", driver_id: "driver-1" },
      ]);
      mockDriverRepository.find.mockResolvedValue([{ id: "driver-1", full_name: "Driver 1" }]);
      mockDataSource.query.mockResolvedValue(undefined);

      await seed.run();

      expect(mockDataSource.query).toHaveBeenCalled();
    });

    it("should handle errors when creating tracking event", async () => {
      mockTrackingEventRepository.count.mockResolvedValue(100);
      mockDeliveryRepository.find.mockResolvedValue([
        { id: "delivery-1", tracking_code: "TRK001", status: "IN_TRANSIT", driver_id: "driver-1" },
      ]);
      mockDriverRepository.find.mockResolvedValue([{ id: "driver-1", full_name: "Driver 1" }]);
      mockDataSource.query.mockRejectedValue(new Error("Database error"));

      // Should not throw - errors are caught and logged
      await expect(seed.run()).resolves.not.toThrow();
    });

    it("should be idempotent - skip if already has enough events", async () => {
      // First run - creates events
      mockTrackingEventRepository.count.mockResolvedValue(100);
      mockDeliveryRepository.find.mockResolvedValue([
        { id: "delivery-1", tracking_code: "TRK001", status: "IN_TRANSIT", driver_id: "driver-1" },
      ]);
      mockDriverRepository.find.mockResolvedValue([{ id: "driver-1", full_name: "Driver 1" }]);
      mockDataSource.query.mockResolvedValue(undefined);

      await seed.run();

      // Second run - skips
      jest.clearAllMocks();
      mockTrackingEventRepository.count.mockResolvedValue(6000);

      await seed.run();

      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it("should skip if no deliveries found", async () => {
      mockTrackingEventRepository.count.mockResolvedValue(100);
      mockDeliveryRepository.find.mockResolvedValue([]);
      mockDriverRepository.find.mockResolvedValue([{ id: "driver-1", full_name: "Driver 1" }]);

      await seed.run();

      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it("should skip if no drivers found", async () => {
      mockTrackingEventRepository.count.mockResolvedValue(100);
      mockDeliveryRepository.find.mockResolvedValue([
        { id: "delivery-1", tracking_code: "TRK001", status: "IN_TRANSIT", driver_id: "driver-1" },
      ]);
      mockDriverRepository.find.mockResolvedValue([]);

      await seed.run();

      expect(mockDataSource.query).not.toHaveBeenCalled();
    });
  });
});
