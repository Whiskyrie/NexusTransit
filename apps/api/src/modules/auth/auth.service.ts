import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditCategory } from '../audit/enums';
import { generateToken, verifyToken, generateUserPayload } from './utils/token.util';
import { hashPassword, comparePassword } from './utils/password.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Autentica usuário com email e senha
   */
  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResponseDto> {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);

      if (!user) {
        await this.logFailedLogin(loginDto.email, 'Invalid credentials', ipAddress, userAgent);
        throw new UnauthorizedException('Credenciais inválidas');
      }

      if (!user.is_active) {
        await this.logFailedLogin(loginDto.email, 'User inactive', ipAddress, userAgent);
        throw new UnauthorizedException('Usuário inativo');
      }

      if (!user.email_verified) {
        await this.logFailedLogin(loginDto.email, 'Email not verified', ipAddress, userAgent);
        throw new UnauthorizedException('Email não verificado');
      }

      const tokens = await this.generateTokens(user);

      // Atualizar último login
      await this.usersService.updateLastLogin(user.id);

      // Log login bem-sucedido
      await this.logSuccessfulLogin(user, ipAddress, userAgent);

      return this.mapToLoginResponseDto(user, tokens);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Erro durante login', error);
      await this.logFailedLogin(loginDto.email, 'System error', ipAddress, userAgent);
      throw new UnauthorizedException('Erro interno do servidor');
    }
  }

  /**
   * Obtém perfil do usuário autenticado
   */
  async getProfile(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.usersService.findOne(userId);

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      if (!user.is_active) {
        throw new UnauthorizedException('Usuário inativo');
      }

      // Log acesso ao perfil
      await this.logProfileAccess(user, ipAddress, userAgent);

      return UserResponseDto.fromUser(user);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Erro ao obter perfil do usuário', error);
      throw new UnauthorizedException('Erro ao obter perfil');
    }
  }

  /**
   * Gera tokens de acesso e refresh
   */
  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const basePayload = generateUserPayload({
      id: user.id,
      email: user.email,
      roles: user.roles?.map(role => role.name) || [],
    });

    const accessToken = await generateToken(
      this.jwtService,
      this.configService,
      { ...basePayload, type: 'access' as const },
      'access',
    );

    const refreshToken = await generateToken(
      this.jwtService,
      this.configService,
      { ...basePayload, type: 'refresh' as const },
      'refresh',
    );

    return { accessToken, refreshToken };
  }

  /**
   * Mapeia usuário para DTO de resposta
   */
  private mapToLoginResponseDto(
    user: User,
    tokens: { accessToken: string; refreshToken: string },
  ): LoginResponseDto {
    const response = new LoginResponseDto();
    response.access_token = tokens.accessToken;
    response.refresh_token = tokens.refreshToken;
    response.token_type = 'Bearer';
    response.expires_in = this.getAccessTokenExpiresIn();
    response.user = UserResponseDto.fromUser(user);

    return response;
  }

  /**
   * Valida credenciais do usuário
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        return null;
      }

      const isPasswordValid = await comparePassword(password, user.password_hash);

      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error('Erro ao validar usuário', error);
      return null;
    }
  }

  /**
   * Renova access token usando refresh token
   */
  async refreshToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResponseDto> {
    try {
      const payload = await verifyToken(this.jwtService, this.configService, refreshToken);

      if (!payload || payload.type !== 'refresh') {
        throw new UnauthorizedException('Token inválido');
      }

      const user = await this.usersService.findOne(payload.sub);

      if (!user?.is_active) {
        throw new UnauthorizedException('Usuário inválido');
      }

      if (!user.email_verified) {
        throw new UnauthorizedException('Email não verificado');
      }

      const tokens = await this.generateTokens(user);

      // Log refresh token
      await this.logTokenRefresh(user, ipAddress, userAgent);

      return this.mapToLoginResponseDto(user, tokens);
    } catch (error) {
      this.logger.error('Erro ao atualizar refresh token', error);
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  /**
   * Valida se senha atende aos critérios de segurança
   */
  validatePassword(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    return (
      password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    );
  }

  /**
   * Hash da senha usando util
   */
  async hashPasswordForUser(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
    return hashPassword(password, saltRounds);
  }

  /**
   * Log auditoria para login bem-sucedido
   */
  private async logSuccessfulLogin(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const auditData = {
        action: AuditAction.LOGIN,
        category: AuditCategory.AUTH,
        userId: user.id,
        userEmail: user.email,
        resourceType: 'auth',
        resourceId: user.id,
        description: `Successful login for user ${user.email}`,
        metadata: {
          userRoles: user.roles?.map(role => role.name) || [],
          lastLogin: user.last_login_at,
        },
        ...(user.roles?.[0]?.name && { userRole: user.roles[0].name }),
        ...(ipAddress && { ipAddress }),
        ...(userAgent && { userAgent }),
      };

      await this.auditLogService.createLog(auditData);
    } catch (error) {
      this.logger.error('Failed to log successful login audit', error);
    }
  }

  /**
   * Log auditoria para tentativas de login falhadas
   */
  private async logFailedLogin(
    email: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const auditData = {
        action: AuditAction.FAILED_LOGIN,
        category: AuditCategory.AUTH,
        userEmail: email,
        resourceType: 'auth',
        description: `Failed login attempt for ${email}: ${reason}`,
        metadata: {
          reason,
          timestamp: new Date().toISOString(),
        },
        ...(ipAddress && { ipAddress }),
        ...(userAgent && { userAgent }),
      };

      await this.auditLogService.createLog(auditData);
    } catch (error) {
      this.logger.error('Failed to log failed login audit', error);
    }
  }

  /**
   * Log auditoria para acesso ao perfil
   */
  private async logProfileAccess(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const auditData = {
        action: AuditAction.READ,
        category: AuditCategory.AUTH,
        userId: user.id,
        userEmail: user.email,
        resourceType: 'user_profile',
        resourceId: user.id,
        description: `User ${user.email} accessed their profile`,
        metadata: {
          timestamp: new Date().toISOString(),
        },
        ...(ipAddress && { ipAddress }),
        ...(userAgent && { userAgent }),
      };

      await this.auditLogService.createLog(auditData);
    } catch (error) {
      this.logger.error('Failed to log profile access audit', error);
    }
  }

  /**
   * Log auditoria para refresh token
   */
  private async logTokenRefresh(user: User, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const auditData = {
        action: AuditAction.UPDATE,
        category: AuditCategory.AUTH,
        userId: user.id,
        userEmail: user.email,
        resourceType: 'auth',
        resourceId: user.id,
        description: `Token refreshed for user ${user.email}`,
        metadata: {
          timestamp: new Date().toISOString(),
        },
        ...(ipAddress && { ipAddress }),
        ...(userAgent && { userAgent }),
      };

      await this.auditLogService.createLog(auditData);
    } catch (error) {
      this.logger.error('Failed to log token refresh audit', error);
    }
  }

  /**
   * Log auditoria para logout
   */
  async logLogout(
    userId: string,
    userEmail: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const auditData = {
        action: AuditAction.LOGOUT,
        category: AuditCategory.AUTH,
        userId,
        userEmail,
        resourceType: 'auth',
        resourceId: userId,
        description: `User ${userEmail} logged out`,
        metadata: {
          timestamp: new Date().toISOString(),
        },
        ...(ipAddress && { ipAddress }),
        ...(userAgent && { userAgent }),
      };

      await this.auditLogService.createLog(auditData);
    } catch (error) {
      this.logger.error('Failed to log logout audit', error);
    }
  }

  /**
   * Obtém tempo de expiração do access token em segundos
   */
  private getAccessTokenExpiresIn(): number {
    const expiresIn = this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m');

    // Converte string como "15m" para segundos
    if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn.slice(0, -1)) * 60;
    }
    if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn.slice(0, -1)) * 60 * 60;
    }
    if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn.slice(0, -1)) * 60 * 60 * 24;
    }

    return parseInt(expiresIn) || 900; // default 15 minutes
  }
}
