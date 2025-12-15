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
 * @module Common/Utils
 */

/**
 * Interface para campo alterado
 */
export interface ChangedField {
  field_name: string;
  old_value: unknown;
  new_value: unknown;
  change_type?: "added" | "modified" | "removed";
}

/**
 * Interface para log de auditoria
 */
export interface AuditLog {
  timestamp: Date;
  operation: "CREATE" | "UPDATE" | "DELETE";
  entity_name: string;
  entity_id: string;
  changed_fields?: ChangedField[];
  user_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Classe utilitária para auditoria
 */
export class AuditableUtils {
  private static readonly DEFAULT_EXCLUDE_FIELDS = [
    "created_at",
    "updated_at",
    "deleted_at",
    "password",
    "password_hash",
    "token",
    "refresh_token",
    "secret",
  ];

  /**
   * Obtém campos que foram alterados entre duas versões de uma entidade
   */
  static getChangedFields<T extends Record<string, unknown>>(
    original: T,
    updated: Partial<T>,
    excludeFields: string[] = [],
  ): ChangedField[] {
    const changed: ChangedField[] = [];
    const fieldsToExclude = [...this.DEFAULT_EXCLUDE_FIELDS, ...excludeFields];

    Object.keys(updated).forEach((key) => {
      if (fieldsToExclude.includes(key)) {
        return;
      }

      const oldValue = original[key];
      const newValue = updated[key];

      if (!this.areValuesEqual(oldValue, newValue) && newValue !== undefined) {
        changed.push({
          field_name: key,
          old_value: oldValue,
          new_value: newValue,
          change_type: oldValue === undefined ? "added" : "modified",
        });
      }
    });

    return changed;
  }

  /**
   * Compara duas entidades e retorna se são iguais
   */
  static compareEntities<T extends Record<string, unknown>>(
    entity1: T,
    entity2: T,
    excludeFields: string[] = [],
  ): boolean {
    const fieldsToExclude = [...this.DEFAULT_EXCLUDE_FIELDS, ...excludeFields];
    const allKeys = new Set([...Object.keys(entity1), ...Object.keys(entity2)]);

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
   */
  static sanitizeAuditData<T extends Record<string, unknown>>(
    data: T,
    sensitiveFields: string[] = [],
  ): T {
    const sensitiveFieldsList = [
      "password",
      "password_hash",
      "token",
      "refresh_token",
      "secret",
      "api_key",
      "private_key",
      ...sensitiveFields,
    ];

    const sanitized = { ...data } as Record<string, unknown>;

    sensitiveFieldsList.forEach((field) => {
      if (field in sanitized && sanitized[field] !== undefined) {
        sanitized[field] = "***";
      }
    });

    return sanitized as T;
  }

  /**
   * Formata log de auditoria para string legível
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
        .map((cf) => `${cf.field_name}: ${String(cf.old_value)} → ${String(cf.new_value)}`)
        .join(", ");
      parts.push(`(${changes})`);
    }

    return parts.join(" ");
  }

  /**
   * Cria log de auditoria a partir de dados
   */
  static createAuditLog(
    operation: "CREATE" | "UPDATE" | "DELETE",
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
   */
  private static areValuesEqual(value1: unknown, value2: unknown): boolean {
    if (value1 === value2) {
      return true;
    }

    if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) {
      return value1 === value2;
    }

    if (value1 instanceof Date && value2 instanceof Date) {
      return value1.getTime() === value2.getTime();
    }

    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length !== value2.length) {
        return false;
      }
      return value1.every((item, index) => this.areValuesEqual(item, value2[index]));
    }

    if (typeof value1 === "object" && typeof value2 === "object") {
      const keys1 = Object.keys(value1 as Record<string, unknown>);
      const keys2 = Object.keys(value2 as Record<string, unknown>);

      if (keys1.length !== keys2.length) {
        return false;
      }

      return keys1.every((key) =>
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
   */
  static shouldAuditField(fieldName: string, excludeFields: string[] = []): boolean {
    const allExcludedFields = [...this.DEFAULT_EXCLUDE_FIELDS, ...excludeFields];
    return !allExcludedFields.includes(fieldName);
  }

  /**
   * Extrai metadados úteis de uma entidade para auditoria
   */
  static extractMetadata(entity: Record<string, unknown>): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};
    const usefulFields = ["status", "type", "code", "name", "id"];

    usefulFields.forEach((field) => {
      if (field in entity && entity[field] !== undefined) {
        metadata[field] = entity[field];
      }
    });

    return metadata;
  }
}
