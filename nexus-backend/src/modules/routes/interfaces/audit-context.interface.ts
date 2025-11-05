/**
 * Audit Context Interfaces
 *
 * Interfaces relacionadas ao contexto de auditoria e rastreamento de requisições.
 *
 * @module Routes/Interfaces
 */

import type { Request as ExpressRequest } from 'express';

/**
 * Interface para usuário autenticado extraído do request
 *
 * Representa o usuário após validação e normalização
 */
export interface RequestUser {
  /** ID único do usuário */
  id: string;
  /** Email do usuário */
  email: string;
  /** Papel/função do usuário no sistema (opcional) */
  role?: string;
}

/**
 * Interface para o usuário bruto do request (antes da validação)
 */
export interface RawUser {
  /** ID do usuário (formato padrão) */
  id?: string;
  /** ID do usuário (formato JWT - subject) */
  sub?: string;
  /** Email do usuário */
  email?: string;
  /** Nome de usuário (alternativa ao email) */
  username?: string;
  /** Papel/função do usuário */
  role?: string;
  /** Campos adicionais do payload JWT/OAuth */
  [key: string]: unknown;
}

/**
 * Interface estendida do Request Express com propriedade user
 */
export interface RequestWithUser extends ExpressRequest {
  /** Usuário autenticado injetado pelo middleware de autenticação */
  user?: RawUser;
}

/**
 * Interface para contexto de auditoria armazenado no CLS
 */
export interface AuditContext {
  /** ID único da requisição (UUID v4) */
  requestId: string;
  /** ID do usuário autenticado */
  userId?: string;
  /** Email do usuário autenticado */
  userEmail?: string;
  /** Role/papel do usuário */
  userRole?: string;
  /** Endereço IP do cliente */
  ipAddress?: string;
  /** User Agent do cliente */
  userAgent?: string;
  /** Timestamp da requisição */
  timestamp: Date;
  /** Caminho da requisição HTTP */
  path: string;
  /** Método HTTP */
  method: string;
}
