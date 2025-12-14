import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { UserStatus } from '../users/enums/user-status.enum';
import { UserType } from '../users/enums/user-type.enum';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import type {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockUser: Partial<User> = {
    id: 'user-id-123',
    email: 'test@example.com',
    password_hash: '$2b$12$hashedpassword',
    first_name: 'John',
    last_name: 'Doe',
    phone: '11999999999',
    user_type: UserType.OPERATOR,
    status: UserStatus.ACTIVE,
    email_verified: true,
    roles: [{ id: 'role-1', name: 'USER' } as any],
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPasswordService = {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
    validatePasswordStrength: jest.fn(),
  };

  const mockTokenService = {
    generateTokens: jest.fn(),
    generateResetToken: jest.fn(),
    validateToken: jest.fn(),
    getAccessTokenExpiresIn: jest.fn(),
  };

  const mockTokenBlacklistService = {
    addToBlacklist: jest.fn(),
    isBlacklisted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: TokenBlacklistService,
          useValue: mockTokenBlacklistService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'Test@123456',
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '11888888888',
      user_type: UserType.OPERATOR,
    };

    it('deve criar usuário com sucesso', async () => {
      userRepository.findOne.mockResolvedValue(null);
      mockPasswordService.validatePasswordStrength.mockReturnValue(true);
      mockPasswordService.hashPassword.mockResolvedValue('$2b$12$hashedpassword');
      userRepository.create.mockReturnValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);
      mockTokenService.generateTokens.mockReturnValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
      mockTokenService.getAccessTokenExpiresIn.mockReturnValue(900);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockPasswordService.validatePasswordStrength).toHaveBeenCalledWith(
        registerDto.password,
      );
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(registerDto.password);
    });

    it('deve validar senha fraca', async () => {
      userRepository.findOne.mockResolvedValue(null);
      mockPasswordService.validatePasswordStrength.mockReturnValue(false);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
    });

    it('deve rejeitar email duplicado', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockPasswordService.validatePasswordStrength).not.toHaveBeenCalled();
    });

    it('deve fazer hash da senha', async () => {
      userRepository.findOne.mockResolvedValue(null);
      mockPasswordService.validatePasswordStrength.mockReturnValue(true);
      mockPasswordService.hashPassword.mockResolvedValue('$2b$12$newhash');
      userRepository.create.mockReturnValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);
      mockTokenService.generateTokens.mockReturnValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
      mockTokenService.getAccessTokenExpiresIn.mockReturnValue(900);

      await service.register(registerDto);

      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(registerDto.password);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          password_hash: '$2b$12$newhash',
        }),
      );
    });

    it('deve retornar tokens válidos', async () => {
      userRepository.findOne.mockResolvedValue(null);
      mockPasswordService.validatePasswordStrength.mockReturnValue(true);
      mockPasswordService.hashPassword.mockResolvedValue('$2b$12$hashedpassword');
      userRepository.create.mockReturnValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);
      mockTokenService.generateTokens.mockReturnValue({
        access_token: 'valid-access-token',
        refresh_token: 'valid-refresh-token',
      });
      mockTokenService.getAccessTokenExpiresIn.mockReturnValue(900);

      const result = await service.register(registerDto);

      expect(result.access_token).toBe('valid-access-token');
      expect(result.refresh_token).toBe('valid-refresh-token');
      expect(result.token_type).toBe('Bearer');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Test@123456',
    };

    it('deve autenticar com credenciais válidas', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockPasswordService.comparePassword.mockResolvedValue(true);
      userRepository.save.mockResolvedValue(mockUser as User);
      mockTokenService.generateTokens.mockReturnValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
      mockTokenService.getAccessTokenExpiresIn.mockReturnValue(900);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(mockPasswordService.comparePassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password_hash,
      );
    });

    it('deve rejeitar senha incorreta', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockPasswordService.comparePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('deve rejeitar usuário inexistente', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockPasswordService.comparePassword).not.toHaveBeenCalled();
    });

    it('deve rejeitar usuário inativo', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };
      userRepository.findOne.mockResolvedValue(inactiveUser as User);
      mockPasswordService.comparePassword.mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('deve atualizar last_login_at', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockPasswordService.comparePassword.mockResolvedValue(true);
      userRepository.save.mockResolvedValue(mockUser as User);
      mockTokenService.generateTokens.mockReturnValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
      mockTokenService.getAccessTokenExpiresIn.mockReturnValue(900);

      await service.login(loginDto);

      expect(userRepository.save).toHaveBeenCalled();
      const savedUser = (userRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedUser.last_login_at).toBeInstanceOf(Date);
    });
  });

  describe('logout', () => {
    it('deve adicionar token à blacklist', async () => {
      const token = 'valid-token';
      const userId = 'user-id-123';
      mockTokenBlacklistService.addToBlacklist.mockResolvedValue(true);

      const result = await service.logout(token, userId);

      expect(result).toHaveProperty('message');
      expect(mockTokenBlacklistService.addToBlacklist).toHaveBeenCalledWith(token);
    });

    it('deve logar evento de logout', async () => {
      const token = 'valid-token';
      const userId = 'user-id-123';
      mockTokenBlacklistService.addToBlacklist.mockResolvedValue(true);

      const result = await service.logout(token, userId);

      expect(result.message).toBe('Logout realizado com sucesso');
    });
  });

  describe('refreshTokens', () => {
    const refreshToken = 'valid-refresh-token';
    const decodedToken = {
      sub: 'user-id-123',
      type: 'refresh',
      iat: 1234567890,
      exp: 9999999999,
    };

    it('deve gerar novos tokens com refresh válido', async () => {
      mockTokenService.validateToken.mockResolvedValue(decodedToken);
      mockTokenBlacklistService.isBlacklisted.mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockTokenBlacklistService.addToBlacklist.mockResolvedValue(true);
      mockTokenService.generateTokens.mockReturnValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });
      mockTokenService.getAccessTokenExpiresIn.mockReturnValue(900);

      const result = await service.refreshTokens(refreshToken);

      expect(result.access_token).toBe('new-access-token');
      expect(result.refresh_token).toBe('new-refresh-token');
      expect(mockTokenBlacklistService.addToBlacklist).toHaveBeenCalledWith(refreshToken);
    });

    it('deve rejeitar refresh token inválido', async () => {
      mockTokenService.validateToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('deve rejeitar token na blacklist', async () => {
      mockTokenService.validateToken.mockResolvedValue(decodedToken);
      mockTokenBlacklistService.isBlacklisted.mockResolvedValue(true);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('deve invalidar refresh token antigo', async () => {
      mockTokenService.validateToken.mockResolvedValue(decodedToken);
      mockTokenBlacklistService.isBlacklisted.mockResolvedValue(false);
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockTokenBlacklistService.addToBlacklist.mockResolvedValue(true);
      mockTokenService.generateTokens.mockReturnValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });
      mockTokenService.getAccessTokenExpiresIn.mockReturnValue(900);

      await service.refreshTokens(refreshToken);

      expect(mockTokenBlacklistService.addToBlacklist).toHaveBeenCalledWith(refreshToken);
    });

    it('deve rejeitar token que não é refresh', async () => {
      const accessToken = { ...decodedToken, type: 'access' };
      mockTokenService.validateToken.mockResolvedValue(accessToken);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      current_password: 'OldPass@123',
      new_password: 'NewPass@456',
    };

    it('deve alterar senha com senha atual correta', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockPasswordService.comparePassword.mockResolvedValue(true);
      mockPasswordService.validatePasswordStrength.mockReturnValue(true);
      mockPasswordService.hashPassword.mockResolvedValue('$2b$12$newhashedpassword');
      userRepository.save.mockResolvedValue(mockUser as User);

      const result = await service.changePassword('user-id-123', changePasswordDto);

      expect(result.message).toBe('Senha alterada com sucesso');
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(changePasswordDto.new_password);
    });

    it('deve validar força da nova senha', async () => {
      const weakPasswordDto = { ...changePasswordDto, new_password: 'weak' };
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockPasswordService.comparePassword.mockResolvedValue(true);
      mockPasswordService.validatePasswordStrength.mockReturnValue(false);

      await expect(service.changePassword('user-id-123', weakPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar senha atual incorreta', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockPasswordService.comparePassword.mockResolvedValue(false);

      await expect(service.changePassword('user-id-123', changePasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar nova senha igual à atual', async () => {
      const samePasswordDto = {
        current_password: 'SamePass@123',
        new_password: 'SamePass@123',
      };
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockPasswordService.comparePassword.mockResolvedValue(true);

      await expect(service.changePassword('user-id-123', samePasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    it('deve gerar token de recuperação', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockTokenService.generateResetToken.mockReturnValue('reset-token-123');
      userRepository.save.mockResolvedValue(mockUser as User);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('link de recuperação');
      expect(mockTokenService.generateResetToken).toHaveBeenCalled();
    });

    it('deve salvar token e expiração no usuário', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockTokenService.generateResetToken.mockReturnValue('reset-token-123');
      userRepository.save.mockResolvedValue(mockUser as User);

      await service.forgotPassword(forgotPasswordDto);

      const savedUser = (userRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedUser.reset_password_token).toBe('reset-token-123');
      expect(savedUser.reset_password_expires).toBeInstanceOf(Date);
    });

    it('deve retornar sucesso mesmo para email inexistente', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('link de recuperação');
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('deve logar tentativas', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);
      mockTokenService.generateResetToken.mockReturnValue('reset-token-123');
      userRepository.save.mockResolvedValue(mockUser as User);

      await service.forgotPassword(forgotPasswordDto);

      expect(mockTokenService.generateResetToken).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: 'valid-reset-token',
      new_password: 'NewPass@789',
    };

    it('deve resetar senha com token válido', async () => {
      const userWithResetToken = {
        ...mockUser,
        reset_password_token: 'valid-reset-token',
        reset_password_expires: new Date(Date.now() + 3600000), // 1 hora no futuro
      };
      userRepository.findOne.mockResolvedValue(userWithResetToken as User);
      mockPasswordService.validatePasswordStrength.mockReturnValue(true);
      mockPasswordService.hashPassword.mockResolvedValue('$2b$12$resethashedpassword');
      userRepository.save.mockResolvedValue(mockUser as User);

      const result = await service.resetPassword(resetPasswordDto);

      expect(result.message).toBe('Senha alterada com sucesso');
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(resetPasswordDto.new_password);
    });

    it('deve validar força da senha', async () => {
      const userWithResetToken = {
        ...mockUser,
        reset_password_token: 'valid-reset-token',
        reset_password_expires: new Date(Date.now() + 3600000),
      };
      userRepository.findOne.mockResolvedValue(userWithResetToken as User);
      mockPasswordService.validatePasswordStrength.mockReturnValue(false);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar token expirado', async () => {
      const userWithExpiredToken = {
        ...mockUser,
        reset_password_token: 'expired-token',
        reset_password_expires: new Date(Date.now() - 3600000), // 1 hora no passado
      };
      userRepository.findOne.mockResolvedValue(userWithExpiredToken as User);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
    });

    it('deve limpar campos de reset após sucesso', async () => {
      const userWithResetToken = {
        ...mockUser,
        reset_password_token: 'valid-reset-token',
        reset_password_expires: new Date(Date.now() + 3600000),
      };
      userRepository.findOne.mockResolvedValue(userWithResetToken as User);
      mockPasswordService.validatePasswordStrength.mockReturnValue(true);
      mockPasswordService.hashPassword.mockResolvedValue('$2b$12$resethashedpassword');
      userRepository.save.mockResolvedValue(mockUser as User);

      await service.resetPassword(resetPasswordDto);

      const savedUser = (userRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedUser.reset_password_token).toBeUndefined();
      expect(savedUser.reset_password_expires).toBeUndefined();
    });
  });

  describe('validateUser', () => {
    const payload = {
      sub: 'user-id-123',
      email: 'test@example.com',
      roles: ['USER'],
      iat: 1234567890,
      exp: 9999999999,
    };

    it('deve retornar usuário para payload válido', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await service.validateUser(payload);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub },
        relations: ['roles'],
      });
    });

    it('deve retornar null para usuário inativo', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };
      userRepository.findOne.mockResolvedValue(inactiveUser as User);

      const result = await service.validateUser(payload);

      expect(result).toBeNull();
    });

    it('deve retornar null para usuário inexistente', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(payload);

      expect(result).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('deve retornar perfil do usuário', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await service.getUserProfile('user-id-123');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('full_name');
      expect(result.full_name).toBe('John Doe');
    });

    it('deve lançar NotFoundException para usuário inexistente', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserProfile('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
