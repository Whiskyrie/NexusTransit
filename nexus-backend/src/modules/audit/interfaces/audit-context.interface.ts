import type { Request } from 'express';

/**
 * Interface para contexto de auditoria
 *
 * Representa informações contextuais sobre uma operação auditada
 */
export interface IAuditContext {
  /**
   * ID do usuário que executou a ação
   */
  userId?: string | null;

  /**
   * Email do usuário que executou a ação
   */
  userEmail?: string | null;

  /**
   * Role/função do usuário
   */
  userRole?: string | null;

  /**
   * Endereço IP da requisição
   */
  ipAddress?: string | null;

  /**
   * User Agent do navegador/cliente
   */
  userAgent?: string | null;

  /**
   * ID da sessão
   */
  sessionId?: string | null;

  /**
   * ID de correlação para rastreamento distribuído
   */
  correlationId?: string | null;

  /**
   * Método HTTP da requisição
   */
  requestMethod?: string | null;

  /**
   * URL da requisição
   */
  requestUrl?: string | null;
}

/**
 * Extrai contexto de auditoria de uma requisição HTTP
 */
export function extractAuditContext(request: Request): IAuditContext {
  return {
    ipAddress: request.ip ?? request.socket.remoteAddress ?? null,
    userAgent: request.get('user-agent') ?? null,
    requestMethod: request.method,
    requestUrl: request.originalUrl ?? request.url,
    correlationId: (request.headers['x-correlation-id'] as string) ?? null,
    sessionId: (request.headers['x-session-id'] as string) ?? null,
  };
}
