/**
 * Auditable Utils
 *
 * Utilitários para auditoria de entidades.
 *
 * Fornece métodos para:
 * - Comparação de entidades
 * - Detecção de campos alterados
 * - Sanitização de dados de auditoria
 * - Formatação de logs de auditoria
 *
 * @module Routes/Utils
 */

/**
 * Interface para campo alterado
 */
export interface ChangedField {
  /**
   * Nome do campo
   */
  field_name: string;

  /**
   * Valor antigo
   */
  old_value: unknown;

  /**
   * Valor novo
   */
  new_value: unknown;

  /**
   * Tipo de mudança (opcional)
   */
  change_type?: 'added' | 'modified' | 'removed';
}

/**
 * Interface para log de auditoria
 */
export interface AuditLog {
  /**
   * Timestamp da mudança
   */
  timestamp: Date;

  /**
   * Tipo de operação
   */
  operation: 'CREATE' | 'UPDATE' | 'DELETE';

  /**
   * Nome da entidade
   */
  entity_name: string;

  /**
   * ID da entidade
   */
  entity_id: string;

  /**
   * Campos alterados
   */
  changed_fields?: ChangedField[];

  /**
   * ID do usuário que fez a alteração
   */
  user_id?: string;

  /**
   * Informações adicionais
   */
  metadata?: Record<string, unknown>;
}

/**
 * Classe utilitária para auditoria
 */
export class AuditableUtils {
  /**
   * Campos que devem ser excluídos da auditoria por padrão
   */
  private static readonly DEFAULT_EXCLUDE_FIELDS = [
    'created_at',
    'updated_at',
    'deleted_at',
    'password',
    'password_hash',
    'token',
    'refresh_token',
    'secret',
  ];

  /**
   * Obtém campos que foram alterados entre duas versões de uma entidade
   *
   * @param original - Entidade original
   * @param updated - Entidade atualizada
   * @param excludeFields - Campos a excluir da comparação
   * @returns Array de campos alterados
   *
   * @example
   * ```typescript
   * const original = { id: '1', name: 'Old', status: 'ACTIVE' };
   * const updated = { id: '1', name: 'New', status: 'ACTIVE' };
   * const changes = AuditableUtils.getChangedFields(original, updated);
   * // [{ field_name: 'name', old_value: 'Old', new_value: 'New' }]
   * ```
   */
  static getChangedFields<T extends Record<string, unknown>>(
    original: T,
    updated: Partial<T>,
    excludeFields: string[] = [],
  ): ChangedField[] {
    const changed: ChangedField[] = [];
    const fieldsToExclude = [...this.DEFAULT_EXCLUDE_FIELDS, ...excludeFields];

    // Iterar sobre campos da entidade atualizada
    Object.keys(updated).forEach(key => {
      // Ignorar campos excluídos
      if (fieldsToExclude.includes(key)) {
        return;
      }

      const oldValue = original[key];
      const newValue = updated[key];

      // Verificar se houve mudança
      if (!this.areValuesEqual(oldValue, newValue) && newValue !== undefined) {
        changed.push({
          field_name: key,
          old_value: oldValue,
          new_value: newValue,
          change_type: oldValue === undefined ? 'added' : 'modified',
        });
      }
    });

    return changed;
  }

  /**
   * Compara duas entidades e retorna se são iguais
   *
   * @param entity1 - Primeira entidade
   * @param entity2 - Segunda entidade
   * @param excludeFields - Campos a excluir da comparação
   * @returns true se entidades são iguais
   *
   * @example
   * ```typescript
   * const entity1 = { id: '1', name: 'Test', updated_at: new Date() };
   * const entity2 = { id: '1', name: 'Test', updated_at: new Date() };
   * AuditableUtils.compareEntities(entity1, entity2, ['updated_at']); // true
   * ```
   */
  static compareEntities<T extends Record<string, unknown>>(
    entity1: T,
    entity2: T,
    excludeFields: string[] = [],
  ): boolean {
    const fieldsToExclude = [...this.DEFAULT_EXCLUDE_FIELDS, ...excludeFields];

    // Obter todas as chaves das duas entidades
    const allKeys = new Set([...Object.keys(entity1), ...Object.keys(entity2)]);

    // Verificar cada campo
    for (const key of allKeys) {
      if (fieldsToExclude.includes(key)) {
        continue;
      }

      if (!this.areValuesEqual(entity1[key], entity2[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sanitiza dados de auditoria removendo informações sensíveis
   *
   * @param data - Dados para sanitizar
   * @param sensitiveFields - Campos sensíveis adicionais
   * @returns Dados sanitizados
   *
   * @example
   * ```typescript
   * const data = { name: 'John', password: '123', email: 'john@test.com' };
   * const sanitized = AuditableUtils.sanitizeAuditData(data);
   * // { name: 'John', password: '***', email: 'john@test.com' }
   * ```
   */
  static sanitizeAuditData<T extends Record<string, unknown>>(
    data: T,
    sensitiveFields: string[] = [],
  ): T {
    const sensitiveFieldsList = [
      'password',
      'password_hash',
      'token',
      'refresh_token',
      'secret',
      'api_key',
      'private_key',
      ...sensitiveFields,
    ];

    const sanitized = { ...data } as Record<string, unknown>;

    sensitiveFieldsList.forEach(field => {
      if (field in sanitized && sanitized[field] !== undefined) {
        sanitized[field] = '***';
      }
    });

    return sanitized as T;
  }

  /**
   * Formata log de auditoria para string legível
   *
   * @param log - Log de auditoria
   * @returns String formatada
   *
   * @example
   * ```typescript
   * const log = {
   *   timestamp: new Date(),
   *   operation: 'UPDATE',
   *   entity_name: 'Route',
   *   entity_id: '123',
   *   changed_fields: [{ field_name: 'status', old_value: 'PLANNED', new_value: 'IN_PROGRESS' }]
   * };
   * const formatted = AuditableUtils.formatAuditLog(log);
   * ```
   */
  static formatAuditLog(log: AuditLog): string {
    const parts: string[] = [];

    parts.push(`[${log.timestamp.toISOString()}]`);
    parts.push(`${log.operation}:`);
    parts.push(`${log.entity_name}#${log.entity_id}`);

    if (log.user_id) {
      parts.push(`by user ${log.user_id}`);
    }

    if (log.changed_fields && log.changed_fields.length > 0) {
      const changes = log.changed_fields
        .map(cf => `${cf.field_name}: ${String(cf.old_value)} → ${String(cf.new_value)}`)
        .join(', ');
      parts.push(`(${changes})`);
    }

    return parts.join(' ');
  }

  /**
   * Cria log de auditoria a partir de dados
   *
   * @param operation - Tipo de operação
   * @param entityName - Nome da entidade
   * @param entityId - ID da entidade
   * @param changedFields - Campos alterados (opcional)
   * @param userId - ID do usuário (opcional)
   * @param metadata - Metadados adicionais (opcional)
   * @returns Log de auditoria
   */
  static createAuditLog(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    entityName: string,
    entityId: string,
    changedFields?: ChangedField[],
    userId?: string,
    metadata?: Record<string, unknown>,
  ): AuditLog {
    const log: AuditLog = {
      timestamp: new Date(),
      operation,
      entity_name: entityName,
      entity_id: entityId,
    };

    if (changedFields) {
      log.changed_fields = changedFields;
    }

    if (userId) {
      log.user_id = userId;
    }

    if (metadata) {
      log.metadata = metadata;
    }

    return log;
  }

  /**
   * Compara dois valores de forma profunda
   *
   * @param value1 - Primeiro valor
   * @param value2 - Segundo valor
   * @returns true se valores são iguais
   */
  private static areValuesEqual(value1: unknown, value2: unknown): boolean {
    // Comparação básica
    if (value1 === value2) {
      return true;
    }

    // Se um é null/undefined e o outro não
    if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) {
      return value1 === value2;
    }

    // Comparar datas
    if (value1 instanceof Date && value2 instanceof Date) {
      return value1.getTime() === value2.getTime();
    }

    // Comparar arrays
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length !== value2.length) {
        return false;
      }
      return value1.every((item, index) => this.areValuesEqual(item, value2[index]));
    }

    // Comparar objetos
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      const keys1 = Object.keys(value1 as Record<string, unknown>);
      const keys2 = Object.keys(value2 as Record<string, unknown>);

      if (keys1.length !== keys2.length) {
        return false;
      }

      return keys1.every(key =>
        this.areValuesEqual(
          (value1 as Record<string, unknown>)[key],
          (value2 as Record<string, unknown>)[key],
        ),
      );
    }

    return false;
  }

  /**
   * Verifica se campo deve ser auditado
   *
   * @param fieldName - Nome do campo
   * @param excludeFields - Campos a excluir
   * @returns true se deve ser auditado
   */
  static shouldAuditField(fieldName: string, excludeFields: string[] = []): boolean {
    const allExcludedFields = [...this.DEFAULT_EXCLUDE_FIELDS, ...excludeFields];
    return !allExcludedFields.includes(fieldName);
  }

  /**
   * Extrai metadados úteis de uma entidade para auditoria
   *
   * @param entity - Entidade para extrair metadados
   * @returns Objeto com metadados
   */
  static extractMetadata(entity: Record<string, unknown>): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    // Campos comuns que são úteis em logs
    const usefulFields = ['status', 'type', 'route_code', 'name', 'id'];

    usefulFields.forEach(field => {
      if (field in entity && entity[field] !== undefined) {
        metadata[field] = entity[field];
      }
    });

    return metadata;
  }
}
