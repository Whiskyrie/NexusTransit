import type { Request } from "express";

/**
 * User interface mínima para autenticação
 * Cada aplicação pode estender com suas próprias propriedades
 */
export interface AuthUser {
  id: string;
  email: string;
  roles: Array<{ name: string }>;
  [key: string]: unknown;
}

/**
 * Authenticated Request Interface
 * Extensão do Request do Express com usuário autenticado
 */
export interface AuthenticatedRequest<
  T extends AuthUser = AuthUser,
> extends Request {
  user: T;
}
