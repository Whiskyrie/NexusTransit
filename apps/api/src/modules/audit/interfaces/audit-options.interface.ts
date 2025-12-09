import type { AuditAction, AuditCategory } from '../enums/index';

/**
 * Interface para opções de configuração do subscriber de auditoria
 */
export interface IAuditableOptions {
  /**
   * Se deve rastrear operações de criação
   */
  trackCreation?: boolean;

  /**
   * Se deve rastrear operações de atualização
   */
  trackUpdates?: boolean;

  /**
   * Se deve rastrear operações de deleção
   */
  trackDeletion?: boolean;

  /**
   * Campos a serem excluídos do rastreamento
   */
  excludeFields?: string[];

  /**
   * Se deve rastrear valores antigos
   */
  trackOldValues?: boolean;

  /**
   * Nome de exibição da entidade
   */
  entityDisplayName?: string;

  /**
   * Categoria de auditoria para esta entidade
   */
  auditCategory?: AuditCategory;

  /**
   * Período de retenção customizado (em dias)
   */
  retentionPeriodDays?: number;
}

/**
 * Interface para resultado de operação auditada
 */
export interface IAuditOperationResult {
  /**
   * Se a operação foi bem-sucedida
   */
  success: boolean;

  /**
   * ID do log de auditoria criado
   */
  auditLogId?: string;

  /**
   * Mensagem de erro, se houver
   */
  error?: string;
}

/**
 * Interface para payload de auditoria customizada
 */
export interface ICustomAuditPayload {
  /**
   * Ação executada
   */
  action: AuditAction;

  /**
   * Categoria da operação
   */
  category: AuditCategory;

  /**
   * Tipo de recurso
   */
  resourceType: string;

  /**
   * ID do recurso (opcional)
   */
  resourceId?: string;

  /**
   * Descrição da operação
   */
  description?: string;

  /**
   * Metadados adicionais
   */
  metadata?: Record<string, unknown>;

  /**
   * Valores antigos (para updates)
   */
  oldValues?: Record<string, unknown>;

  /**
   * Valores novos (para creates/updates)
   */
  newValues?: Record<string, unknown>;
}
