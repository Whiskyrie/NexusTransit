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

  /** Issued at - timestamp de emissão */
  iat: number;

  /** Expires at - timestamp de expiração */
  exp: number;

  /** Session ID (opcional) */
  sessionId?: string;
}
