import { Test, type TestingModule } from '@nestjs/testing';
import { RateLimitService } from './rate-limit.service';
import { RedisService } from '../../redis/redis.service';
import type { RateLimitResult } from '../interfaces/rate-limit.interface';

interface RateLimitEntry {
  requests: number[];
  lastReset: number;
}

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

      expect(redisService.set).toHaveBeenCalledWith(
        key,
        expect.objectContaining({
          requests: expect.arrayContaining([expect.any(Number)]),
          lastReset: expect.any(Number),
        }),
        Math.ceil(windowMs / 1000),
      );
    });

    it('should allow request when under limit (existing key)', async () => {
      const now = Date.now();
      const existingEntry: RateLimitEntry = {
        requests: [now - 30000, now - 20000], // 2 requests within window
        lastReset: now - 60000,
      };

      redisService.get.mockResolvedValue(existingEntry);
      redisService.set.mockResolvedValue(true);

      const result: RateLimitResult = await service.checkLimit(key, limit, windowMs);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(limit);
      expect(result.current).toBe(3); // 2 existing + 1 new
      expect(result.remaining).toBe(2); // 5 - 3
      expect(result.resetTime).toBeGreaterThan(Date.now());

      expect(redisService.set).toHaveBeenCalledWith(
        key,
        expect.objectContaining({
          requests: expect.arrayContaining([expect.any(Number)]),
        }),
        Math.ceil(windowMs / 1000),
      );
    });

    it('should deny request when limit exceeded', async () => {
      const now = Date.now();
      const existingEntry: RateLimitEntry = {
        requests: [now - 10000, now - 20000, now - 30000, now - 40000, now - 50000], // 5 requests within window (at limit)
        lastReset: now - 60000,
      };

      redisService.get.mockResolvedValue(existingEntry);

      const result: RateLimitResult = await service.checkLimit(key, limit, windowMs);

      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(limit);
      expect(result.current).toBe(5);
      expect(result.remaining).toBe(0);

      // Should not update Redis when at limit
      expect(redisService.set).not.toHaveBeenCalled();
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

    it('should filter out expired requests', async () => {
      const now = Date.now();
      const existingEntry: RateLimitEntry = {
        requests: [
          now - 70000, // Expired (outside window)
          now - 80000, // Expired (outside window)
          now - 30000, // Valid
          now - 40000, // Valid
        ],
        lastReset: now - 90000,
      };

      redisService.get.mockResolvedValue(existingEntry);
      redisService.set.mockResolvedValue(true);

      const result: RateLimitResult = await service.checkLimit(key, limit, windowMs);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(3); // 2 valid + 1 new
      expect(result.remaining).toBe(2);

      // Should save updated entry with filtered requests
      expect(redisService.set).toHaveBeenCalledWith(
        key,
        expect.objectContaining({
          requests: expect.arrayContaining([expect.any(Number)]),
        }),
        Math.ceil(windowMs / 1000),
      );
    });
  });

  describe('resetLimit', () => {
    it('should reset rate limit for given key', async () => {
      redisService.delete.mockResolvedValue(true);

      await service.resetLimit('reset:key');

      expect(redisService.delete).toHaveBeenCalledWith('reset:key');
    });

    it('should handle reset errors gracefully', async () => {
      redisService.delete.mockRejectedValue(new Error('Redis error'));

      // Should not throw
      await expect(service.resetLimit('reset:key')).resolves.toBeUndefined();
    });
  });

  describe('getLimitStatus', () => {
    const key = 'status:key';
    const limit = 10;
    const windowMs = 60000;

    it('should return current rate limit status for existing key', async () => {
      const now = Date.now();
      const existingEntry: RateLimitEntry = {
        requests: [now - 10000, now - 20000, now - 30000], // 3 requests
        lastReset: now - 60000,
      };

      redisService.get.mockResolvedValue(existingEntry);

      const result = await service.getLimitStatus(key, limit, windowMs);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(limit);
      expect(result.current).toBe(3);
      expect(result.remaining).toBe(7);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should handle non-existent key', async () => {
      redisService.get.mockResolvedValue(null);

      const result = await service.getLimitStatus(key, limit, windowMs);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(limit);
      expect(result.current).toBe(0);
      expect(result.remaining).toBe(limit);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should handle errors gracefully', async () => {
      redisService.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.getLimitStatus(key, limit, windowMs);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(limit);
      expect(result.current).toBe(0);
      expect(result.remaining).toBe(limit);
    });
  });

  describe('cleanup', () => {
    it('should log that cleanup is handled by TTL', () => {
      const logSpy = jest.spyOn(service['logger'], 'log');

      service.cleanup();

      expect(logSpy).toHaveBeenCalledWith('Rate limit cleanup not needed with Keyv TTL');
    });
  });
});
