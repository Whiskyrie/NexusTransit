import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import type { JwtPayload } from '@nexus/auth';

describe('TokenService', () => {
  let service: TokenService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('deve gerar access token com payload válido', () => {
      const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: 'user-id',
        email: 'test@example.com',
        roles: ['USER'],
      };

      const expectedToken = 'access-token';
      mockConfigService.get.mockReturnValue('15m');
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = service.generateAccessToken(payload);

      expect(result).toBe(expectedToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith(payload, { expiresIn: '15m' });
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m');
    });

    it('deve usar tempo de expiração da configuração', () => {
      const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: 'user-id',
        email: 'test@example.com',
        roles: ['USER'],
      };

      mockConfigService.get.mockReturnValue('30m');
      mockJwtService.sign.mockReturnValue('token');

      service.generateAccessToken(payload);

      expect(mockJwtService.sign).toHaveBeenCalledWith(payload, { expiresIn: '30m' });
    });
  });

  describe('generateRefreshToken', () => {
    it('deve gerar refresh token com userId', () => {
      const userId = 'user-id';
      const expectedToken = 'refresh-token';

      mockConfigService.get.mockReturnValue('7d');
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = service.generateRefreshToken(userId);

      expect(result).toBe(expectedToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: userId, type: 'refresh' },
        { expiresIn: '7d' },
      );
    });

    it('deve usar tempo de expiração da configuração', () => {
      const userId = 'user-id';

      mockConfigService.get.mockReturnValue('14d');
      mockJwtService.sign.mockReturnValue('token');

      service.generateRefreshToken(userId);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: userId, type: 'refresh' },
        { expiresIn: '14d' },
      );
    });
  });

  describe('generateTokens', () => {
    it('deve gerar access e refresh tokens', () => {
      const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: 'user-id',
        email: 'test@example.com',
        roles: ['USER'],
      };

      mockConfigService.get.mockReturnValue('15m');
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = service.generateTokens(payload);

      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateToken', () => {
    it('deve validar token válido', () => {
      const token = 'valid-token';
      const payload: JwtPayload = {
        sub: 'user-id',
        email: 'test@example.com',
        roles: ['USER'],
        iat: 1234567890,
        exp: 1234567890,
      };

      mockJwtService.verify.mockReturnValue(payload);

      const result = service.validateToken(token);

      expect(result).toEqual(payload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
    });

    it('deve lançar erro para token inválido', () => {
      const token = 'invalid-token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Token inválido');
      });

      expect(() => service.validateToken(token)).toThrow('Token inválido ou expirado');
    });

    it('deve lançar erro para token expirado', () => {
      const token = 'expired-token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      expect(() => service.validateToken(token)).toThrow('Token inválido ou expirado');
    });
  });

  describe('decodeToken', () => {
    it('deve decodificar token válido', () => {
      const token = 'valid-token';
      const payload: JwtPayload = {
        sub: 'user-id',
        email: 'test@example.com',
        roles: ['USER'],
        iat: 1234567890,
        exp: 1234567890,
      };

      mockJwtService.decode.mockReturnValue(payload);

      const result = service.decodeToken(token);

      expect(result).toEqual(payload);
      expect(mockJwtService.decode).toHaveBeenCalledWith(token);
    });

    it('deve retornar null para token inválido', () => {
      const token = 'invalid-token';

      mockJwtService.decode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = service.decodeToken(token);

      expect(result).toBeNull();
    });
  });

  describe('getTokenExpiration', () => {
    it('deve retornar tempo de expiração em segundos', () => {
      const token = 'valid-token';
      const futureTime = Math.floor(Date.now() / 1000) + 900; // 15 minutos

      mockJwtService.decode.mockReturnValue({
        exp: futureTime,
      });

      const result = service.getTokenExpiration(token);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(900);
    });

    it('deve retornar 0 para token expirado', () => {
      const token = 'expired-token';
      const pastTime = Math.floor(Date.now() / 1000) - 1000;

      mockJwtService.decode.mockReturnValue({
        exp: pastTime,
      });

      const result = service.getTokenExpiration(token);

      expect(result).toBe(0);
    });

    it('deve retornar 0 se exp não existir', () => {
      const token = 'invalid-token';

      mockJwtService.decode.mockReturnValue({});

      const result = service.getTokenExpiration(token);

      expect(result).toBe(0);
    });

    it('deve retornar 0 se decode retornar null', () => {
      const token = 'invalid-token';

      mockJwtService.decode.mockReturnValue(null);

      const result = service.getTokenExpiration(token);

      expect(result).toBe(0);
    });
  });

  describe('generateResetToken', () => {
    it('deve gerar token hexadecimal de 64 caracteres (32 bytes)', () => {
      const token = service.generateResetToken();

      expect(token).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    it('deve gerar token com tamanho customizado', () => {
      const length = 16;
      const token = service.generateResetToken(length);

      expect(token).toHaveLength(length * 2); // hex encoding doubles the length
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    it('deve gerar tokens diferentes a cada chamada', () => {
      const token1 = service.generateResetToken();
      const token2 = service.generateResetToken();
      const token3 = service.generateResetToken();

      expect(token1).not.toBe(token2);
      expect(token1).not.toBe(token3);
      expect(token2).not.toBe(token3);
    });
  });

  describe('getAccessTokenExpiresIn', () => {
    it('deve retornar tempo de expiração em segundos', () => {
      mockConfigService.get.mockReturnValue('15m');

      const result = service.getAccessTokenExpiresIn();

      expect(result).toBe(900); // 15 minutos = 900 segundos
    });

    it('deve converter tempo em horas', () => {
      mockConfigService.get.mockReturnValue('1h');

      const result = service.getAccessTokenExpiresIn();

      expect(result).toBe(3600);
    });

    it('deve converter tempo em dias', () => {
      mockConfigService.get.mockReturnValue('7d');

      const result = service.getAccessTokenExpiresIn();

      expect(result).toBe(604800);
    });

    it('deve converter tempo em segundos', () => {
      mockConfigService.get.mockReturnValue('30s');

      const result = service.getAccessTokenExpiresIn();

      expect(result).toBe(30);
    });

    it('deve retornar 900 (15m) para formato inválido', () => {
      mockConfigService.get.mockReturnValue('invalid');

      const result = service.getAccessTokenExpiresIn();

      expect(result).toBe(900);
    });
  });

  describe('parseTimeToSeconds', () => {
    it('deve converter minutos para segundos', () => {
      mockConfigService.get.mockReturnValue('15m');
      const result = service.getAccessTokenExpiresIn();
      expect(result).toBe(900);
    });

    it('deve converter horas para segundos', () => {
      mockConfigService.get.mockReturnValue('2h');
      const result = service.getAccessTokenExpiresIn();
      expect(result).toBe(7200);
    });

    it('deve converter dias para segundos', () => {
      mockConfigService.get.mockReturnValue('1d');
      const result = service.getAccessTokenExpiresIn();
      expect(result).toBe(86400);
    });

    it('deve converter segundos', () => {
      mockConfigService.get.mockReturnValue('60s');
      const result = service.getAccessTokenExpiresIn();
      expect(result).toBe(60);
    });
  });
});
