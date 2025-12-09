/**
 * JWT Payload Interface
 * Interface para o payload dos tokens JWT
 */
export interface JwtPayload {
  /** Subject - ID do usuário */
  sub: string;

  /** Email do usuário */
  email: string;

  /** Roles do usuário */
  roles: string[];

  /** Issued at - timestamp de emissão (gerado automaticamente pelo JWT) */
  iat?: number;

  /** Expires at - timestamp de expiração (gerado automaticamente pelo JWT) */
  exp?: number;

  /** Tipo do token (access ou refresh) */
  type: 'access' | 'refresh';

  /** Session ID para blacklist */
  jti?: string;
}
