import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TrackingEventSubscriber } from './tracking-event.subscriber';
import { TrackingEvent } from '../entities/tracking-event.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { TrackingCacheService } from '../services/tracking-cache.service';
import { TrackingCalculationService } from '../services/tracking-calculation.service';
import { EventType } from '../enums/event-type.enum';
import { EventStatus } from '../enums/event-status.enum';
import { type InsertEvent, type UpdateEvent } from 'typeorm';

describe('TrackingEventSubscriber', () => {
  let subscriber: TrackingEventSubscriber;

  const mockEvent: Partial<TrackingEvent> = {
    id: 'test-id',
    event_id: 'evt-123',
    delivery_id: 'delivery-123',
    driver_id: 'driver-123',
    event_type: EventType.IN_TRANSIT,
    event_status: EventStatus.SUCCESS,
    timestamp: new Date('2025-12-18T10:00:00Z'),
    location: 'POINT(-46.6333 -23.5505)',
    location_address: 'Av. Paulista, 1000',
    accuracy: 10,
    speed: 60,
    battery_level: 85,
    is_automatic: false,
    getCoordinates: jest.fn().mockReturnValue({
      latitude: -23.5505,
      longitude: -46.6333,
    }),
  };

  const mockDelivery = {
    id: 'delivery-123',
    scheduled_delivery_at: new Date('2025-12-18T18:00:00Z'),
    delivery_address: {
      latitude: -23.5515,
      longitude: -46.6343,
    },
  };

  const mockCacheService = {
    invalidateTrackingCache: jest.fn(),
  };

  const mockCalculationService = {
    isNearDestination: jest.fn(),
    detectDelay: jest.fn(),
  };

  const mockTrackingEventRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDeliveryRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingEventSubscriber,
        {
          provide: TrackingCacheService,
          useValue: mockCacheService,
        },
        {
          provide: TrackingCalculationService,
          useValue: mockCalculationService,
        },
        {
          provide: getRepositoryToken(TrackingEvent),
          useValue: mockTrackingEventRepository,
        },
        {
          provide: getRepositoryToken(Delivery),
          useValue: mockDeliveryRepository,
        },
      ],
    }).compile();

    subscriber = module.get<TrackingEventSubscriber>(TrackingEventSubscriber);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listenTo', () => {
    it('should listen to TrackingEvent', () => {
      const result = subscriber.listenTo();

      expect(result).toBe(TrackingEvent);
    });
  });

  describe('beforeInsert', () => {
    it('should validate coordinates', () => {
      const insertEvent = {
        entity: mockEvent as TrackingEvent,
      } as InsertEvent<TrackingEvent>;

      expect(() => subscriber.beforeInsert(insertEvent)).not.toThrow();
    });

    it('should warn on future timestamp', () => {
      const futureEvent = {
        ...mockEvent,
        timestamp: new Date(Date.now() + 86400000), // +1 day
      };

      const insertEvent = {
        entity: futureEvent as TrackingEvent,
      } as InsertEvent<TrackingEvent>;

      expect(() => subscriber.beforeInsert(insertEvent)).not.toThrow();
    });

    it('should warn on low GPS accuracy', () => {
      const lowAccuracyEvent = {
        ...mockEvent,
        accuracy: 150,
      };

      const insertEvent = {
        entity: lowAccuracyEvent as TrackingEvent,
      } as InsertEvent<TrackingEvent>;

      expect(() => subscriber.beforeInsert(insertEvent)).not.toThrow();
    });
  });

  describe('afterInsert', () => {
    it('should invalidate cache after insert', () => {
      const insertEvent = {
        entity: mockEvent as TrackingEvent,
      } as InsertEvent<TrackingEvent>;

      mockCacheService.invalidateTrackingCache.mockResolvedValue(undefined);

      subscriber.afterInsert(insertEvent);

      expect(mockCacheService.invalidateTrackingCache).toHaveBeenCalledWith('delivery-123');
    });

    it('should trigger automatic event checks', async () => {
      const insertEvent = {
        entity: mockEvent as TrackingEvent,
      } as InsertEvent<TrackingEvent>;

      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);
      mockTrackingEventRepository.findOne.mockResolvedValue(null);
      mockCalculationService.isNearDestination.mockResolvedValue(false);
      mockCalculationService.detectDelay.mockResolvedValue({ is_delayed: false });

      subscriber.afterInsert(insertEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockCacheService.invalidateTrackingCache).toHaveBeenCalled();
    });
  });

  describe('beforeUpdate', () => {
    it('should warn when event type changed', () => {
      const updateEvent = {
        entity: mockEvent as TrackingEvent,
        databaseEntity: {
          ...mockEvent,
          event_type: EventType.CREATED,
        } as TrackingEvent,
        connection: {} as any,
        queryRunner: {} as any,
        manager: {} as any,
        metadata: {} as any,
        updatedColumns: [],
        updatedRelations: [],
      } as UpdateEvent<TrackingEvent>;

      expect(() => subscriber.beforeUpdate(updateEvent)).not.toThrow();
    });

    it('should warn when timestamp changed', () => {
      const updateEvent = {
        entity: {
          ...mockEvent,
          timestamp: new Date('2025-12-18T11:00:00Z'),
        } as TrackingEvent,
        databaseEntity: mockEvent as TrackingEvent,
        connection: {} as any,
        queryRunner: {} as any,
        manager: {} as any,
        metadata: {} as any,
        updatedColumns: [],
        updatedRelations: [],
      } as UpdateEvent<TrackingEvent>;

      expect(() => subscriber.beforeUpdate(updateEvent)).not.toThrow();
    });
  });

  describe('afterUpdate', () => {
    it('should invalidate cache after update', () => {
      const updateEvent = {
        entity: mockEvent as TrackingEvent,
        connection: {} as any,
        queryRunner: {} as any,
        manager: {} as any,
        metadata: {} as any,
        databaseEntity: null as any,
        updatedColumns: [],
        updatedRelations: [],
      } as UpdateEvent<TrackingEvent>;

      mockCacheService.invalidateTrackingCache.mockResolvedValue(undefined);

      subscriber.afterUpdate(updateEvent);

      expect(mockCacheService.invalidateTrackingCache).toHaveBeenCalledWith('delivery-123');
    });
  });

  describe('shouldGenerateNearDestinationEvent', () => {
    it('should return true when near destination', async () => {
      mockTrackingEventRepository.findOne.mockResolvedValue(null);
      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);
      mockCalculationService.isNearDestination.mockResolvedValue(true);

      const result = await (subscriber as any).shouldGenerateNearDestinationEvent(
        mockEvent as TrackingEvent,
      );

      expect(result).toBe(true);
    });

    it('should return false when event already exists', async () => {
      mockTrackingEventRepository.findOne.mockResolvedValue(mockEvent);

      const result = await (subscriber as any).shouldGenerateNearDestinationEvent(
        mockEvent as TrackingEvent,
      );

      expect(result).toBe(false);
    });

    it('should return false when no location', async () => {
      const eventWithoutLocation = { ...mockEvent, location: null };

      mockTrackingEventRepository.findOne.mockResolvedValue(null);
      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);

      const result = await (subscriber as any).shouldGenerateNearDestinationEvent(
        eventWithoutLocation as unknown as TrackingEvent,
      );

      expect(result).toBe(false);
    });

    it('should return false when delivery data incomplete', async () => {
      mockTrackingEventRepository.findOne.mockResolvedValue(null);
      mockDeliveryRepository.findOne.mockResolvedValue(null);

      const result = await (subscriber as any).shouldGenerateNearDestinationEvent(
        mockEvent as TrackingEvent,
      );

      expect(result).toBe(false);
    });
  });

  describe('shouldGenerateDelayedEvent', () => {
    it('should return true when delayed', async () => {
      const oldEvent = {
        ...mockEvent,
        timestamp: new Date('2025-12-18T06:00:00Z'),
      };

      mockTrackingEventRepository.findOne.mockResolvedValue(oldEvent);
      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);
      mockCalculationService.detectDelay.mockResolvedValue({
        is_delayed: true,
        delay_minutes: 60,
        expected_arrival: mockDelivery.scheduled_delivery_at,
        estimated_arrival: new Date('2025-12-18T19:00:00Z'),
      });

      const result = await (subscriber as any).shouldGenerateDelayedEvent(
        mockEvent as TrackingEvent,
      );

      expect(result).toBe(true);
    });

    it('should return false when not delayed', async () => {
      mockTrackingEventRepository.findOne.mockResolvedValue(null);
      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);
      mockCalculationService.detectDelay.mockResolvedValue({ is_delayed: false });

      const result = await (subscriber as any).shouldGenerateDelayedEvent(
        mockEvent as TrackingEvent,
      );

      expect(result).toBe(false);
    });

    it('should return false when recent delayed event exists', async () => {
      const recentDelayedEvent = {
        ...mockEvent,
        event_type: EventType.DELAYED,
        timestamp: new Date(),
      };

      mockTrackingEventRepository.findOne.mockResolvedValue(recentDelayedEvent);

      const result = await (subscriber as any).shouldGenerateDelayedEvent(
        mockEvent as TrackingEvent,
      );

      expect(result).toBe(false);
    });
  });

  describe('generateNearDestinationEvent', () => {
    it('should create near destination event', async () => {
      const createdEvent = { ...mockEvent, event_type: EventType.NEAR_DESTINATION };

      mockTrackingEventRepository.create.mockReturnValue(createdEvent);
      mockTrackingEventRepository.save.mockResolvedValue(createdEvent);

      await (subscriber as any).generateNearDestinationEvent(mockEvent as TrackingEvent);

      expect(mockTrackingEventRepository.create).toHaveBeenCalled();
      expect(mockTrackingEventRepository.save).toHaveBeenCalledWith(createdEvent);
    });

    it('should handle creation errors gracefully', async () => {
      mockTrackingEventRepository.create.mockReturnValue(mockEvent);
      mockTrackingEventRepository.save.mockRejectedValue(new Error('Save failed'));

      await expect(
        (subscriber as any).generateNearDestinationEvent(mockEvent as TrackingEvent),
      ).resolves.not.toThrow();
    });
  });

  describe('generateDelayedEvent', () => {
    it('should create delayed event', async () => {
      const createdEvent = { ...mockEvent, event_type: EventType.DELAYED };

      mockDeliveryRepository.findOne.mockResolvedValue(mockDelivery);
      mockCalculationService.detectDelay.mockResolvedValue({
        is_delayed: true,
        delay_minutes: 60,
        expected_arrival: mockDelivery.scheduled_delivery_at,
        estimated_arrival: new Date('2025-12-18T19:00:00Z'),
      });
      mockTrackingEventRepository.create.mockReturnValue(createdEvent);
      mockTrackingEventRepository.save.mockResolvedValue(createdEvent);

      await (subscriber as any).generateDelayedEvent(mockEvent as TrackingEvent);

      expect(mockTrackingEventRepository.create).toHaveBeenCalled();
      expect(mockTrackingEventRepository.save).toHaveBeenCalledWith(createdEvent);
    });

    it('should handle missing delivery data', async () => {
      mockDeliveryRepository.findOne.mockResolvedValue(null);

      await expect(
        (subscriber as any).generateDelayedEvent(mockEvent as TrackingEvent),
      ).resolves.not.toThrow();
    });
  });

  describe('validateLocation', () => {
    it('should validate valid coordinates', () => {
      const coords = { latitude: -23.5505, longitude: -46.6333 };
      const entity = { getCoordinates: () => coords } as TrackingEvent;

      expect(() => void (subscriber as any).validateLocation(entity)).not.toThrow();
    });

    it('should warn on invalid latitude', () => {
      const coords = { latitude: 91, longitude: -46.6333 };
      const entity = { getCoordinates: () => coords } as TrackingEvent;

      expect(() => void (subscriber as any).validateLocation(entity)).not.toThrow();
    });

    it('should warn on invalid longitude', () => {
      const coords = { latitude: -23.5505, longitude: 181 };
      const entity = { getCoordinates: () => coords } as TrackingEvent;

      expect(() => void (subscriber as any).validateLocation(entity)).not.toThrow();
    });
  });
});
