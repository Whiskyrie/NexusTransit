import type { JwtService } from '@nestjs/jwt';
import type { ConfigService } from '@nestjs/config';
import {
  AUTH_CONSTANTS,
  TOKEN_EXPIRATION_CONFIG,
  type TokenType,
} from '../constants/auth.constants';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Utilitários para manipulação de tokens JWT
 *
 * Funções auxiliares para geração, validação e extração
 * de tokens JWT seguindo as melhores práticas de segurança.
 */

/**
 * Gera um token JWT com payload e tipo específicos
 *
 * @param payload - Dados a serem incluídos no token
 * @param tokenType - Tipo do token (access, refresh, etc.)
 * @param expiresIn - Tempo de expiração em segundos (opcional)
 * @returns Promise<string> - Token JWT gerado
 *
 * @example
 * ```typescript
 * const token = await generateToken({ sub: 'user123', email: 'user@domain.com' }, TokenType.ACCESS);
 * console.log(token); // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * ```
 */
export async function generateToken(
  jwtService: JwtService,
  configService: ConfigService,
  payload: JwtPayload,
  tokenType: TokenType,
  expiresIn?: number,
): Promise<string> {
  const expiration = expiresIn ?? TOKEN_EXPIRATION_CONFIG[tokenType];

  const secret = configService.get<string>('JWT_SECRET');
  const issuer = configService.get<string>('JWT_ISSUER');
  const audience = configService.get<string>('JWT_AUDIENCE');

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwtService.signAsync(payload, {
    expiresIn: `${expiration}s`,
    secret,
    issuer,
    audience,
  });
}

/**
 * Valida e decodifica um token JWT
 *
 * @param jwtService - Instância do JwtService
 * @param token - Token JWT a ser validado
 * @returns Promise<JwtPayload | null> - Payload decodificado ou null se inválido
 *
 * @example
 * ```typescript
 * const payload = await verifyToken(jwtService, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 * if (payload) {
 *   console.log('User ID:', payload.sub);
 * }
 * ```
 */
export async function verifyToken(
  jwtService: JwtService,
  configService: ConfigService,
  token: string,
): Promise<JwtPayload | null> {
  try {
    const secret = configService.get<string>('JWT_SECRET');
    const issuer = configService.get<string>('JWT_ISSUER');
    const audience = configService.get<string>('JWT_AUDIENCE');

    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const payload = await jwtService.verifyAsync<JwtPayload>(token, {
      secret,
      issuer,
      audience,
    });

    return payload;
  } catch (error) {
    // Token inválido, expirado ou malformado - retorna null
    console.warn(
      'Token verification failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return null;
  }
}

/**
 * Extrai o token do header de autorização
 *
 * @param authHeader - Header Authorization completo
 * @returns string | null - Token extraído ou null se inválido
 *
 * @example
 * ```typescript
 * const token = extractTokenFromHeader('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 * console.log(token); // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * ```
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const [type, token] = authHeader.split(' ');

  if (type !== AUTH_CONSTANTS.TOKEN_PREFIX || !token) {
    return null;
  }

  return token;
}

/**
 * Verifica se um token está expirado
 *
 * @param payload - Payload do token JWT
 * @returns boolean - true se expirado, false caso contrário
 *
 * @example
 * ```typescript
 * const payload = { exp: 1640995200, iat: 1640991600 };
 * const isExpired = isTokenExpired(payload);
 * console.log(isExpired); // true
 * ```
 */
export function isTokenExpired(payload: JwtPayload): boolean {
  if (!payload.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Calcula o tempo restante até a expiração do token
 *
 * @param payload - Payload do token JWT
 * @returns number - Tempo restante em segundos
 *
 * @example
 * ```typescript
 * const payload = { exp: 1640995200, iat: 1640991600 };
 * const timeLeft = getTokenTimeLeft(payload);
 * console.log(timeLeft); // 3600
 * ```
 */
export function getTokenTimeLeft(payload: JwtPayload): number {
  if (!payload.exp) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - currentTime);
}

/**
 * Gera um payload JWT padrão para usuários
 *
 * @param user - Dados do usuário
 * @param additionalClaims - Claims adicionais (opcional)
 * @returns JwtPayload - Payload gerado
 *
 * @example
 * ```typescript
 * const payload = generateUserPayload(user);
 * console.log(payload); // { sub: 'user123', email: 'user@domain.com', ... }
 * ```
 */
export function generateUserPayload(
  user: { id: string; email: string; roles?: string[] },
  additionalClaims: Record<string, unknown> = {},
): JwtPayload {
  return {
    sub: user.id,
    email: user.email,
    roles: user.roles ?? [],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRATION,
    type: 'access',
    ...additionalClaims,
  };
}
