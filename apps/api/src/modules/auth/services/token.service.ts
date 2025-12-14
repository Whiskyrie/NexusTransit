import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { JwtPayload } from '@nexus/auth';
import { randomBytes } from 'crypto';

/**
 * Par de tokens (access e refresh)
 */
interface TokenPair {
  access_token: string;
  refresh_token: string;
}

/**
 * Payload específico para refresh token
 */
interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

/**
 * Token Service
 *
 * Serviço responsável por:
 * - Geração de tokens JWT (access e refresh)
 * - Validação de tokens
 * - Decodificação de tokens
 * - Geração de tokens de recuperação de senha
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Gera access token JWT
   *
   * @param payload - Dados do usuário para o token
   * @returns Access token JWT
   */
  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const expiresIn = this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m');
    const options: JwtSignOptions = { expiresIn: this.parseTimeToSeconds(expiresIn) };

    return this.jwtService.sign({ ...payload }, options);
  }

  /**
   * Gera refresh token JWT
   *
   * @param userId - ID do usuário
   * @returns Refresh token JWT
   */
  generateRefreshToken(userId: string): string {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN', '7d');
    const options: JwtSignOptions = { expiresIn: this.parseTimeToSeconds(expiresIn) };

    const payload: RefreshTokenPayload = {
      sub: userId,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, options);
  }

  /**
   * Gera ambos tokens (access e refresh)
   *
   * @param payload - Dados do usuário
   * @returns Objeto com access_token e refresh_token
   */
  generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    return {
      access_token: this.generateAccessToken(payload),
      refresh_token: this.generateRefreshToken(payload.sub),
    };
  }

  /**
   * Valida token JWT
   *
   * @param token - Token para validar
   * @returns Payload do token se válido
   * @throws Error se token inválido
   */
  validateToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Token inválido: ${errorMessage}`);
      throw new Error('Token inválido ou expirado');
    }
  }

  /**
   * Decodifica token sem validar
   *
   * @param token - Token para decodificar
   * @returns Payload do token
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  /**
   * Extrai tempo de expiração do token em segundos
   *
   * @param token - Token JWT
   * @returns Tempo em segundos até expiração
   */
  getTokenExpiration(token: string): number {
    const decoded = this.decodeToken(token);
    if (!decoded?.exp) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - now);
  }

  /**
   * Gera token aleatório para recuperação de senha
   *
   * @param length - Tamanho do token em bytes (padrão: 32)
   * @returns Token hexadecimal
   */
  generateResetToken(length = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Extrai tempo de expiração em segundos da configuração
   *
   * @returns Tempo de expiração do access token em segundos
   */
  getAccessTokenExpiresIn(): number {
    const expiresIn = this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m');

    return this.parseTimeToSeconds(expiresIn);
  }

  /**
   * Converte string de tempo para segundos
   *
   * @param time - Tempo em formato string (ex: '15m', '7d', '1h')
   * @returns Tempo em segundos
   */
  private parseTimeToSeconds(time: string): number {
    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    const match = /^(\d+)([smhd])$/.exec(time);
    if (!match) {
      this.logger.warn(`Formato de tempo inválido: ${time}, usando 900s como padrão`);
      return 900;
    }

    const [, value, unit] = match;
    return parseInt(value, 10) * units[unit];
  }
}
