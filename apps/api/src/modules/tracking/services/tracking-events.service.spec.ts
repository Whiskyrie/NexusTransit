import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TrackingEventsService } from './tracking-events.service';
import { TrackingEvent } from '../entities/tracking-event.entity';
import { EventType } from '../enums/event-type.enum';
import { EventStatus } from '../enums/event-status.enum';
import { type CreateTrackingEventDto } from '../dto/create-tracking-event.dto';
import { type UpdateTrackingEventDto } from '../dto/update-tracking-event.dto';
import { type BatchTrackingEventsDto } from '../dto/batch-tracking-events.dto';

describe('TrackingEventsService', () => {
  let service: TrackingEventsService;
  let module: TestingModule;

  const createMockQueryBuilder = () => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    subQuery: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    getQuery: jest.fn().mockReturnValue('subquery'),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
  });

  let mockQueryBuilder = createMockQueryBuilder();

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockEvent: Partial<TrackingEvent> = {
    event_id: 'evt-123',
    delivery_id: 'delivery-123',
    driver_id: 'driver-123',
    event_type: EventType.CREATED,
    event_status: EventStatus.SUCCESS,
    timestamp: new Date('2025-12-18T10:00:00Z'),
    location: 'POINT(-46.6333 -23.5505)',
    is_automatic: false,
    created_at: new Date('2025-12-18T10:00:00Z'),
    updated_at: new Date('2025-12-18T10:00:00Z'),
    getCoordinates: jest.fn().mockReturnValue({
      latitude: -23.5505,
      longitude: -46.6333,
    }),
    setCoordinates: jest.fn(),
  };

  beforeEach(async () => {
    mockQueryBuilder = createMockQueryBuilder();
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    module = await Test.createTestingModule({
      providers: [
        TrackingEventsService,
        {
          provide: getRepositoryToken(TrackingEvent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TrackingEventsService>(TrackingEventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('create', () => {
    const createDto: CreateTrackingEventDto = {
      delivery_id: 'delivery-123',
      driver_id: 'driver-123',
      event_type: EventType.CREATED,
      event_status: EventStatus.SUCCESS,
      timestamp: '2025-12-18T10:00:00Z',
      is_automatic: false,
    };

    it('should create a tracking event successfully', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockResolvedValue(mockEvent);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.event_id).toBeDefined();
      expect(result.delivery_id).toBe(createDto.delivery_id);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for future timestamp', async () => {
      const futureDto = {
        ...createDto,
        timestamp: new Date(Date.now() + 86400000).toISOString(),
      };

      await expect(service.create(futureDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid latitude', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const invalidDto = {
        ...createDto,
        location: {
          latitude: 91,
          longitude: -46.6333,
        },
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid longitude', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const invalidDto = {
        ...createDto,
        location: {
          latitude: -23.5505,
          longitude: 181,
        },
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid initial event type', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const invalidDto = {
        ...createDto,
        event_type: EventType.DELIVERED,
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByDelivery', () => {
    it('should return events for a delivery', async () => {
      const mockEvents = [mockEvent, { ...mockEvent, id: 'test-id-2', event_id: 'evt-456' }];
      mockRepository.find.mockResolvedValue(mockEvents);

      const result = await service.findByDelivery('delivery-123');

      expect(result).toHaveLength(2);
      expect(result[0].delivery_id).toBe('delivery-123');
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { delivery_id: 'delivery-123' },
        order: { timestamp: 'ASC' },
      });
    });

    it('should return empty array when no events found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByDelivery('delivery-456');

      expect(result).toEqual([]);
    });
  });

  describe('findLatestByDelivery', () => {
    it('should return the latest event', async () => {
      mockRepository.findOne.mockResolvedValue(mockEvent);

      const result = await service.findLatestByDelivery('delivery-123');

      expect(result.event_id).toBe('evt-123');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { delivery_id: 'delivery-123' },
        order: { timestamp: 'DESC' },
      });
    });

    it('should throw NotFoundException when no event found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findLatestByDelivery('delivery-456')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTrackingCode', () => {
    it('should return events for a tracking code', async () => {
      const mockEvents = [mockEvent];
      mockQueryBuilder.getMany.mockResolvedValue(mockEvents);

      const result = await service.findByTrackingCode('NXS202412180001');

      expect(result).toEqual(mockEvents);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('event.delivery', 'delivery');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'delivery.tracking_code = :trackingCode',
        { trackingCode: 'NXS202412180001' },
      );
    });

    it('should throw NotFoundException when no events found', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await expect(service.findByTrackingCode('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findLatestByTrackingCode', () => {
    it('should return the latest event for a tracking code', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockEvent);

      const result = await service.findLatestByTrackingCode('NXS202412180001');

      expect(result).toEqual(mockEvent);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('event.timestamp', 'DESC');
    });

    it('should throw NotFoundException when no event found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findLatestByTrackingCode('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findRoutePointsByTrackingCode', () => {
    it('should return events with location', async () => {
      const mockEvents = [mockEvent];
      mockQueryBuilder.getMany.mockResolvedValue(mockEvents);

      const result = await service.findRoutePointsByTrackingCode('NXS202412180001');

      expect(result).toEqual(mockEvents);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('event.location IS NOT NULL');
    });

    it('should return empty array when no events with location', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.findRoutePointsByTrackingCode('NXS202412180001');

      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const mockEvents = [mockEvent];
      mockRepository.findAndCount.mockResolvedValue([mockEvents, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total_pages).toBe(1);
      expect(result.meta.has_previous).toBe(false);
      expect(result.meta.has_next).toBe(false);
    });

    it('should apply filters correctly', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        page: 1,
        limit: 10,
        delivery_id: 'delivery-123',
        event_type: EventType.IN_TRANSIT,
      });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            delivery_id: 'delivery-123',
            event_type: EventType.IN_TRANSIT,
          }),
        }),
      );
    });

    it('should limit maximum results to 100', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 500 });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an event by event_id', async () => {
      mockRepository.findOne.mockResolvedValue(mockEvent);

      const result = await service.findOne('evt-123');

      expect(result.event_id).toBe('evt-123');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { event_id: 'evt-123' },
      });
    });

    it('should throw NotFoundException when event not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft remove an event', async () => {
      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.softRemove.mockResolvedValue(mockEvent);

      await service.remove('evt-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { event_id: 'evt-123' },
      });
      expect(mockRepository.softRemove).toHaveBeenCalledWith(mockEvent);
    });

    it('should throw NotFoundException when event not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateTrackingEventDto = {
      notes: 'Updated notes',
      event_status: EventStatus.WARNING,
    };

    it('should update an event successfully', async () => {
      const updatedEvent = { ...mockEvent, ...updateDto };
      mockRepository.findOne.mockResolvedValue({ ...mockEvent });
      mockRepository.save.mockResolvedValue(updatedEvent);

      const result = await service.update('evt-123', updateDto);

      expect(result.notes).toBe('Updated notes');
      expect(result.event_status).toBe(EventStatus.WARNING);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when event not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('invalid-id', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for future timestamp in update', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockEvent });

      const futureUpdateDto: UpdateTrackingEventDto = {
        timestamp: new Date(Date.now() + 86400000).toISOString(),
      };

      await expect(service.update('evt-123', futureUpdateDto)).rejects.toThrow(BadRequestException);
    });

    it('should validate coordinates when updating location', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockEvent });

      const invalidLocationDto: UpdateTrackingEventDto = {
        location: {
          latitude: 95,
          longitude: -46.6333,
        },
      };

      await expect(service.update('evt-123', invalidLocationDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createBatch', () => {
    const batchDto: BatchTrackingEventsDto = {
      events: [
        {
          delivery_id: 'delivery-123',
          driver_id: 'driver-123',
          event_type: EventType.CREATED,
          event_status: EventStatus.SUCCESS,
          timestamp: '2025-12-18T10:00:00Z',
          is_automatic: false,
        },
        {
          delivery_id: 'delivery-123',
          driver_id: 'driver-123',
          event_type: EventType.ASSIGNED,
          event_status: EventStatus.SUCCESS,
          timestamp: '2025-12-18T11:00:00Z',
          is_automatic: false,
        },
      ],
    };

    it('should create multiple events successfully', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockEvent, event_type: EventType.CREATED });
      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockResolvedValue(mockEvent);

      const result = await service.createBatch(batchDto);

      expect(result).toHaveLength(2);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle partial failures in batch', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save
        .mockResolvedValueOnce(mockEvent)
        .mockRejectedValueOnce(new Error('Save failed'));

      const result = await service.createBatch(batchDto);

      expect(result).toHaveLength(1);
    });

    it('should return empty array when all events fail', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockRejectedValue(new Error('Save failed'));

      const result = await service.createBatch(batchDto);

      expect(result).toHaveLength(0);
    });
  });

  describe('findActiveDeliveries', () => {
    it('should return active deliveries', async () => {
      const activeEvent = { ...mockEvent, event_type: EventType.IN_TRANSIT };
      mockQueryBuilder.getMany.mockResolvedValue([activeEvent]);

      const result = await service.findActiveDeliveries();

      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should return empty array when no active deliveries', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.findActiveDeliveries();

      expect(result).toEqual([]);
    });
  });

  describe('findDriverCurrentLocation', () => {
    it('should return driver current location', async () => {
      const locationEvent = { ...mockEvent, event_type: EventType.IN_TRANSIT };
      mockRepository.findOne.mockResolvedValue(locationEvent);

      const result = await service.findDriverCurrentLocation('driver-123');

      expect(result.driver_id).toBe('driver-123');
    });

    it('should throw NotFoundException when no location found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findDriverCurrentLocation('driver-456')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findRouteProgress', () => {
    it('should return route progress events', async () => {
      const mockEvents = [mockEvent];
      mockRepository.find.mockResolvedValue(mockEvents);

      const result = await service.findRouteProgress('route-123');

      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { route_id: 'route-123' },
        order: { timestamp: 'ASC' },
      });
    });
  });

  describe('validateEventSequence (private method)', () => {
    it('should allow valid event transitions', async () => {
      const lastEvent = { ...mockEvent, event_type: EventType.CREATED };
      mockRepository.findOne.mockResolvedValue(lastEvent);

      const createDto: CreateTrackingEventDto = {
        delivery_id: 'delivery-123',
        driver_id: 'driver-123',
        event_type: EventType.ASSIGNED,
        event_status: EventStatus.SUCCESS,
        timestamp: '2025-12-18T10:00:00Z',
        is_automatic: false,
      };

      mockRepository.create.mockReturnValue({ ...mockEvent, event_type: EventType.ASSIGNED });
      mockRepository.save.mockResolvedValue({ ...mockEvent, event_type: EventType.ASSIGNED });

      await expect(service.create(createDto)).resolves.toBeDefined();
    });

    it('should throw BadRequestException for invalid transitions', async () => {
      const lastEvent = { ...mockEvent, event_type: EventType.DELIVERED };
      mockRepository.findOne.mockResolvedValue(lastEvent);

      const createDto: CreateTrackingEventDto = {
        delivery_id: 'delivery-123',
        driver_id: 'driver-123',
        event_type: EventType.IN_TRANSIT,
        event_status: EventStatus.SUCCESS,
        timestamp: '2025-12-18T10:00:00Z',
        is_automatic: false,
      };

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });
});
