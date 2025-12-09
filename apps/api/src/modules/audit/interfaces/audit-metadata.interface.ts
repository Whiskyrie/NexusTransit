/**
 * Interface para metadados de auditoria
 *
 * Representa dados adicionais armazenados com o log de auditoria
 */
export interface IAuditMetadata {
  /**
   * Dados antigos antes da modificação
   */
  oldValues?: Record<string, unknown> | null;

  /**
   * Dados novos após a modificação
   */
  newValues?: Record<string, unknown> | null;

  /**
   * Metadados customizados adicionais
   */
  metadata?: Record<string, unknown> | null;

  /**
   * Código de status HTTP da resposta
   */
  statusCode?: number | null;

  /**
   * Tempo de execução em milissegundos
   */
  executionTimeMs?: number | null;

  /**
   * Descrição textual da operação
   */
  description?: string | null;

  /**
   * ID do recurso afetado
   */
  resourceId?: string | null;

  /**
   * Tipo do recurso afetado
   */
  resourceType?: string;
}

/**
 * Interface para campos relacionados à LGPD
 */
export interface IAuditLGPDData {
  /**
   * ID do titular dos dados (data subject)
   */
  dataSubjectId?: string | null;

  /**
   * Base legal para o processamento
   */
  legalBasis?: string | null;

  /**
   * Indica se contém dados sensíveis
   */
  sensitiveData?: boolean;

  /**
   * Período de retenção em dias
   */
  retentionPeriodDays?: number | null;
}
