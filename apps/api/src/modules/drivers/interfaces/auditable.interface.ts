/**
 * Interface para entidades auditáveis no módulo de motoristas
 */
export interface AuditableEntity {
  id: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface para o contexto de auditoria
 */
export interface AuditContext {
  userId?: string | undefined;
  userEmail?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  requestId?: string | undefined;
}

/**
 * Interface para metadados de auditoria
 */
export interface AuditMetadata {
  changedColumns?: string[];
  oldValues?: Record<string, unknown> | null;
}

/**
 * Opções de configuração para auditoria de entidades
 */
export interface AuditableOptions {
  /** Se deve registrar operações CREATE */
  trackCreation?: boolean;
  /** Se deve registrar operações UPDATE */
  trackUpdates?: boolean;
  /** Se deve registrar operações DELETE */
  trackDeletion?: boolean;
  /** Campos que devem ser ignorados na auditoria */
  excludeFields?: string[];
  /** Se deve registrar valores antigos em updates */
  trackOldValues?: boolean;
  /** Nome personalizado para a entidade nos logs */
  entityDisplayName?: string;
}
