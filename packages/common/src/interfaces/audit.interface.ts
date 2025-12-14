/**
 * Audit Interfaces
 *
 * Interfaces relacionadas ao contexto de auditoria e rastreamento de requisições.
 *
 * @module Common/Interfaces
 */

import type { Request as ExpressRequest } from "express";

/**
 * Interface para usuário autenticado extraído do request
 */
export interface RequestUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * Interface para o usuário bruto do request (antes da validação)
 */
export interface RawUser {
  id?: string;
  sub?: string;
  email?: string;
  username?: string;
  role?: string;
  [key: string]: unknown;
}

/**
 * Interface estendida do Request Express com propriedade user
 */
export interface RequestWithUser extends ExpressRequest {
  user?: RawUser;
}

/**
 * Interface para contexto de auditoria armazenado no CLS
 */
export interface AuditContext {
  requestId: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  path: string;
  method: string;
}
