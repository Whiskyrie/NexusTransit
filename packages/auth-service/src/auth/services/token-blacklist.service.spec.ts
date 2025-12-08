import { Test, type TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { TokenBlacklistService } from './token-blacklist.service';
import { RedisService } from '../../redis/redis.service';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let redisService: jest.Mocked<RedisService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    has: jest.fn(),
    clear: jest.fn(),
  };

  const mockJwtService = {
    decode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
    redisService = module.get(RedisService);
    jwtService = module.get(JwtService);

    // Reset all mocks
    Object.values(mockRedisService).forEach(mock => mock.mockReset());
    Object.values(mockJwtService).forEach(mock => mock.mockReset());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToBlacklist', () => {
    it('should add valid token to blacklist with TTL', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      const mockDecoded = {
        sub: 'user123',
        exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes from now
        jti: 'token-id-123',
      };

      jwtService.decode.mockReturnValue(mockDecoded);
      redisService.set.mockResolvedValue(true);

      const result = await service.addToBlacklist(token);

      expect(result).toBe(true);
      expect(mockJwtService.decode).toHaveBeenCalledWith(token);
      expect(() =>
        redisService.set(
          'blacklist:token-id-123',
          expect.objectContaining({
            userId: 'user123',
            reason: 'logout',
          }),
          0,
        ),
      ).not.toThrow();
    });

    it('should not add expired token to blacklist', async () => {
      const token = 'expired_token';
      const mockDecoded = {
        sub: 'user123',
        exp: Math.floor(Date.now() / 1000) - 100, // Expired 100 seconds ago
      };

      jwtService.decode.mockReturnValue(mockDecoded);

      const result = await service.addToBlacklist(token);

      expect(result).toBe(true);
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('should return false for invalid token', async () => {
      const token = 'invalid_token';
      jwtService.decode.mockReturnValue(null);

      const result = await service.addToBlacklist(token);

      expect(result).toBe(false);
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });
  });

  describe('isBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      const token = 'blacklisted_token';
      const mockDecoded = {
        sub: 'user123',
        jti: 'token-id-123',
      };

      jwtService.decode.mockReturnValue(mockDecoded);
      redisService.has.mockResolvedValue(true);

      const result = await service.isBlacklisted(token);

      expect(result).toBe(true);
      expect(mockRedisService.has).toHaveBeenCalledWith('blacklist:token-id-123');
    });

    it('should return false for non-blacklisted token', async () => {
      const token = 'valid_token';
      const mockDecoded = {
        sub: 'user123',
        jti: 'token-id-456',
      };

      jwtService.decode.mockReturnValue(mockDecoded);
      redisService.has.mockResolvedValue(false);

      const result = await service.isBlacklisted(token);

      expect(result).toBe(false);
      expect(mockRedisService.has).toHaveBeenCalledWith('blacklist:token-id-456');
    });

    it('should return true for invalid token', async () => {
      const token = 'invalid_token';
      jwtService.decode.mockReturnValue(null);

      const result = await service.isBlacklisted(token);

      expect(result).toBe(true);
    });

    it('should handle Redis errors gracefully', async () => {
      const token = 'test_token';
      const mockDecoded = { sub: 'user123', jti: 'token-id' };

      jwtService.decode.mockReturnValue(mockDecoded);
      redisService.has.mockRejectedValue(new Error('Redis connection failed'));

      const result = await service.isBlacklisted(token);

      expect(result).toBe(true); // Should default to true on error
    });
  });

  describe('removeFromBlacklist', () => {
    it('should remove token from blacklist', async () => {
      const token = 'token_to_remove';
      const mockDecoded = {
        sub: 'user123',
        jti: 'token-id-123',
      };

      jwtService.decode.mockReturnValue(mockDecoded);
      redisService.delete.mockResolvedValue(true);

      const result = await service.removeFromBlacklist(token);

      expect(result).toBe(true);
      expect(mockRedisService.delete).toHaveBeenCalledWith('blacklist:token-id-123');
    });

    it('should return false if token was not in blacklist', async () => {
      const token = 'non_existent_token';
      const mockDecoded = {
        sub: 'user123',
        jti: 'token-id-456',
      };

      jwtService.decode.mockReturnValue(mockDecoded);
      redisService.delete.mockResolvedValue(false);

      const result = await service.removeFromBlacklist(token);

      expect(result).toBe(false);
    });
  });

  describe('blacklistAllUserTokens', () => {
    it('should blacklist all tokens for a user', async () => {
      const userId = 'user123';
      redisService.set.mockResolvedValue(true);

      const result = await service.blacklistAllUserTokens(userId);

      expect(result).toBe(true);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'blacklist:user:user123',
        expect.objectContaining({
          reason: 'user_tokens_revoked',
        }),
        expect.any(Number),
      );
    });
  });

  describe('areUserTokensBlacklisted', () => {
    it('should check if user tokens are blacklisted', async () => {
      const userId = 'user123';
      redisService.has.mockResolvedValue(true);

      const result = await service.areUserTokensBlacklisted(userId);

      expect(result).toBe(true);
      expect(mockRedisService.has).toHaveBeenCalledWith('blacklist:user:user123');
    });
  });

  describe('clearBlacklist', () => {
    it('should clear all blacklisted tokens', async () => {
      redisService.clear.mockResolvedValue(undefined);

      await service.clearBlacklist();

      expect(mockRedisService.clear).toHaveBeenCalled();
    });
  });
});
