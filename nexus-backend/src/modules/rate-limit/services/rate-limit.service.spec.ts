import { Test, type TestingModule } from '@nestjs/testing';
import { RateLimitService } from './rate-limit.service';
import { RedisService } from '../../redis/redis.service';
import type { RateLimitResult } from '../interfaces/rate-limit.interface';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let redisService: jest.Mocked<RedisService>;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
    redisService = module.get(RedisService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkLimit', () => {
    const key = 'test:key';
    const limit = 5;
    const windowMs = 60000; // 1 minute

    it('should allow request when under limit (new key)', async () => {
      // Simulate new key (no existing value)
      redisService.get.mockResolvedValue(null);
      redisService.set.mockResolvedValue(true);

      const result: RateLimitResult = await service.checkLimit(key, limit, windowMs);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(limit);
      expect(result.current).toBe(1);
      expect(result.remaining).toBe(limit - 1);
      expect(typeof result.resetTime).toBe('number');

      expect(mockRedisService.set).toHaveBeenCalledWith(
        key,
        expect.objectContaining({
          requests: expect.any(Array),
          lastReset: expect.any(Number),
        }),
        Math.ceil(windowMs / 1000),
      );
    });

    it('should allow request when under limit (existing key)', async () => {
      const now = Date.now();
      const existingEntry = {
        requests: [now - 30000, now - 20000], // 2 requests in the last minute
        lastReset: now - 30000,
      };

      redisService.get.mockResolvedValue(existingEntry);
      redisService.set.mockResolvedValue(true);

      const result: RateLimitResult = await service.checkLimit(key, limit, windowMs);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(limit);
      expect(result.current).toBe(3); // 2 existing + 1 new
      expect(result.remaining).toBe(2);
      expect(result.resetTime).toBeGreaterThan(Date.now());

      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should deny request when limit exceeded', async () => {
      const now = Date.now();
      const existingEntry = {
        requests: [
          now - 10000,
          now - 8000,
          now - 6000,
          now - 4000,
          now - 2000, // 5 requests (at limit)
        ],
        lastReset: now - 10000,
      };

      redisService.get.mockResolvedValue(existingEntry);

      const result: RateLimitResult = await service.checkLimit(key, limit, windowMs);

      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(limit);
      expect(result.current).toBe(5);
      expect(result.remaining).toBe(0);

      // Should not save when at limit
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('should handle redis errors gracefully', async () => {
      redisService.get.mockRejectedValue(new Error('Redis connection failed'));

      const result: RateLimitResult = await service.checkLimit(key, limit, windowMs);

      // Should allow request when Redis fails (fail open)
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(limit);
      expect(result.current).toBe(0);
      expect(result.remaining).toBe(limit);
    });

    it('should clean expired requests from window', async () => {
      const now = Date.now();
      const existingEntry = {
        requests: [
          now - 70000, // Expired (outside window)
          now - 65000, // Expired (outside window)
          now - 30000, // Valid
          now - 20000, // Valid
        ],
        lastReset: now - 70000,
      };

      redisService.get.mockResolvedValue(existingEntry);
      redisService.set.mockResolvedValue(true);

      const result: RateLimitResult = await service.checkLimit(key, limit, windowMs);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(3); // 2 valid + 1 new (expired ones removed)
      expect(result.remaining).toBe(2);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        key,
        expect.objectContaining({
          requests: expect.arrayContaining([
            expect.any(Number), // The new request timestamp
          ]),
        }),
        Math.ceil(windowMs / 1000),
      );
    });
  });

  describe('resetLimit', () => {
    it('should reset rate limit for given key', async () => {
      redisService.delete.mockResolvedValue(true);

      await service.resetLimit('reset:key');

      expect(mockRedisService.delete).toHaveBeenCalledWith('reset:key');
    });

    it('should handle reset errors gracefully', async () => {
      redisService.delete.mockRejectedValue(new Error('Redis error'));

      // Should not throw
      await expect(service.resetLimit('reset:key')).resolves.not.toThrow();
    });
  });

  describe('getLimitStatus', () => {
    const key = 'status:key';
    const limit = 10;
    const windowMs = 60000;

    it('should return current rate limit status', async () => {
      const now = Date.now();
      const existingEntry = {
        requests: [now - 30000, now - 20000, now - 10000],
        lastReset: now - 30000,
      };

      redisService.get.mockResolvedValue(existingEntry);

      const status = await service.getLimitStatus(key, limit, windowMs);

      expect(status.limit).toBe(limit);
      expect(status.current).toBe(3);
      expect(status.remaining).toBe(7);
      expect(status.allowed).toBe(true);
      expect(status.resetTime).toBeGreaterThan(Date.now());
    });

    it('should handle non-existent key', async () => {
      redisService.get.mockResolvedValue(null);

      const status = await service.getLimitStatus(key, limit, windowMs);

      expect(status.limit).toBe(limit);
      expect(status.current).toBe(0);
      expect(status.remaining).toBe(limit);
      expect(status.allowed).toBe(true);
      expect(status.resetTime).toBeGreaterThan(Date.now());
    });

    it('should handle errors gracefully', async () => {
      redisService.get.mockRejectedValue(new Error('Redis error'));

      const status = await service.getLimitStatus(key, limit, windowMs);

      expect(status.allowed).toBe(true);
      expect(status.current).toBe(0);
      expect(status.remaining).toBe(limit);
    });
  });

  describe('cleanup', () => {
    it('should call cleanup method', () => {
      // This method just logs, so we test it doesn't throw
      expect(() => service.cleanup()).not.toThrow();
    });
  });
});
