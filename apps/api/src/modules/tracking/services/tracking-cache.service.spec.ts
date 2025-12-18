import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TrackingCacheService } from './tracking-cache.service';
import { TrackingEvent } from '../entities/tracking-event.entity';
import { RedisService } from '@nexus/redis';
import {
  type CachedTrackingData,
  type CachedTrackingTimeline,
} from '../interfaces/cache.interface';
import { EventStatus, EventType } from '../enums';

describe('TrackingCacheService', () => {
  let service: TrackingCacheService;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    getRedisClient: jest.fn(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockCacheData: CachedTrackingData = {
    delivery_id: 'delivery-123',
    current_status: 'IN_TRANSIT',
    last_location: {
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'Av. Paulista, 1000',
    },
    last_update: new Date('2025-12-18T10:00:00Z'),
    events_count: 15,
  };

  const mockTimeline: CachedTrackingTimeline = {
    delivery_id: 'delivery-123',
    events: [
      {
        id: 'evt-123',
        event_id: 'evt-123',
        delivery_id: 'delivery-123',
        driver_id: 'driver-123',
        route_id: 'route-123',
        event_type: EventType.IN_TRANSIT,
        event_status: EventStatus.SUCCESS,
        timestamp: new Date('2025-12-18T10:00:00Z'),
        location: 'Av. Paulista, 1000',
        is_automatic: false,
        created_at: new Date('2025-12-18T10:00:00Z'),
        updated_at: new Date('2025-12-18T10:00:00Z'),
      },
    ],
    total_distance_km: 15.5,
    cached_at: new Date('2025-12-18T10:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingCacheService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: getRepositoryToken(TrackingEvent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TrackingCacheService>(TrackingCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTrackingData', () => {
    it('should return cached data when available', async () => {
      mockRedisService.get.mockResolvedValue(mockCacheData);

      const result = await service.getTrackingData('delivery-123');

      expect(result).toEqual(mockCacheData);
      expect(mockRedisService.get).toHaveBeenCalledWith('tracking:delivery-123');
    });

    it('should return null when cache miss', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getTrackingData('delivery-123');

      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisService.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.getTrackingData('delivery-123');

      expect(result).toBeNull();
    });
  });

  describe('setTrackingData', () => {
    it('should store data in cache', async () => {
      mockRedisService.set.mockResolvedValue(undefined);

      await service.setTrackingData('delivery-123', mockCacheData);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'tracking:delivery-123',
        mockCacheData,
        300000, // TTL in milliseconds
      );
    });

    it('should use custom TTL when provided', async () => {
      mockRedisService.set.mockResolvedValue(undefined);

      await service.setTrackingData('delivery-123', mockCacheData, 600);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'tracking:delivery-123',
        mockCacheData,
        600000,
      );
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisService.set.mockRejectedValue(new Error('Redis error'));

      await expect(service.setTrackingData('delivery-123', mockCacheData)).resolves.not.toThrow();
    });
  });

  describe('getTrackingTimeline', () => {
    it('should return cached timeline', async () => {
      mockRedisService.get.mockResolvedValue(mockTimeline);

      const result = await service.getTrackingTimeline('delivery-123');

      expect(result).toEqual(mockTimeline);
      expect(mockRedisService.get).toHaveBeenCalledWith('tracking:timeline:delivery-123');
    });

    it('should return null on cache miss', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getTrackingTimeline('delivery-123');

      expect(result).toBeNull();
    });
  });

  describe('setTrackingTimeline', () => {
    it('should store timeline in cache', async () => {
      mockRedisService.set.mockResolvedValue(undefined);

      await service.setTrackingTimeline('delivery-123', mockTimeline);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'tracking:timeline:delivery-123',
        mockTimeline,
        300000,
      );
    });
  });

  describe('invalidateTrackingCache', () => {
    it('should delete all cache keys for a delivery', async () => {
      mockRedisService.delete.mockResolvedValue(undefined);

      await service.invalidateTrackingCache('delivery-123');

      expect(mockRedisService.delete).toHaveBeenCalledTimes(2);
      expect(mockRedisService.delete).toHaveBeenCalledWith('tracking:delivery-123');
      expect(mockRedisService.delete).toHaveBeenCalledWith('tracking:timeline:delivery-123');
    });

    it('should handle deletion errors gracefully', async () => {
      mockRedisService.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(service.invalidateTrackingCache('delivery-123')).resolves.not.toThrow();
    });
  });

  describe('prewarmCache', () => {
    it('should prewarm cache for multiple deliveries', async () => {
      const mockEvent = {
        delivery_id: 'delivery-123',
        event_type: 'IN_TRANSIT',
        timestamp: new Date(),
        location: 'POINT(-46.6333 -23.5505)',
        location_address: 'Test address',
        getCoordinates: () => ({ latitude: -23.5505, longitude: -46.6333 }),
      };

      mockRepository.findOne.mockResolvedValue(mockEvent);
      mockRepository.count.mockResolvedValue(15);
      mockRedisService.set.mockResolvedValue(undefined);

      await service.prewarmCache(['delivery-123', 'delivery-456']);

      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should handle missing events gracefully', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.prewarmCache(['delivery-123'])).resolves.not.toThrow();
    });
  });

  describe('clearAllCache', () => {
    it('should clear entire cache', async () => {
      mockRedisService.clear.mockResolvedValue(undefined);

      await service.clearAllCache();

      expect(mockRedisService.clear).toHaveBeenCalled();
    });

    it('should handle clear errors gracefully', async () => {
      mockRedisService.clear.mockRejectedValue(new Error('Clear failed'));

      await expect(service.clearAllCache()).resolves.not.toThrow();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics when Redis client available', async () => {
      const mockRedisClient = {
        keys: jest
          .fn()
          .mockResolvedValue([
            'nexus:tracking:delivery-123',
            'nexus:tracking:timeline:delivery-123',
            'nexus:tracking:delivery-456',
          ]),
      };

      mockRedisService.getRedisClient.mockReturnValue(mockRedisClient);

      const result = await service.getCacheStats();

      expect(result.total_keys).toBe(3);
      expect(result.tracking_data_keys).toBe(2);
      expect(result.timeline_keys).toBe(1);
    });

    it('should return zero stats when Redis client unavailable', async () => {
      mockRedisService.getRedisClient.mockReturnValue(null);

      const result = await service.getCacheStats();

      expect(result.total_keys).toBe(0);
      expect(result.tracking_data_keys).toBe(0);
      expect(result.timeline_keys).toBe(0);
    });

    it('should handle stats errors gracefully', async () => {
      mockRedisService.getRedisClient.mockImplementation(() => {
        throw new Error('Stats failed');
      });

      const result = await service.getCacheStats();

      expect(result.total_keys).toBe(0);
    });
  });

  describe('publishCacheInvalidation', () => {
    it('should publish invalidation event', async () => {
      const mockRedisClient = {
        publish: jest.fn().mockResolvedValue(undefined),
      };

      mockRedisService.getRedisClient.mockReturnValue(mockRedisClient);

      await service.publishCacheInvalidation('delivery-123');

      expect(mockRedisClient.publish).toHaveBeenCalledWith(
        'nexus:tracking:invalidation',
        expect.stringContaining('delivery-123'),
      );
    });

    it('should handle publish errors gracefully', async () => {
      mockRedisService.getRedisClient.mockReturnValue(null);

      await expect(service.publishCacheInvalidation('delivery-123')).resolves.not.toThrow();
    });
  });

  describe('subscribeToCacheInvalidation', () => {
    it('should subscribe to invalidation events', async () => {
      const mockRedisClient = {
        subscribe: jest.fn().mockResolvedValue(undefined),
      };

      mockRedisService.getRedisClient.mockReturnValue(mockRedisClient);

      const callback = jest.fn();
      await service.subscribeToCacheInvalidation(callback);

      expect(mockRedisClient.subscribe).toHaveBeenCalledWith(
        'nexus:tracking:invalidation',
        expect.any(Function),
      );
    });

    it('should handle subscription errors gracefully', async () => {
      mockRedisService.getRedisClient.mockReturnValue(null);

      const callback = jest.fn();
      await expect(service.subscribeToCacheInvalidation(callback)).resolves.not.toThrow();
    });
  });
});
