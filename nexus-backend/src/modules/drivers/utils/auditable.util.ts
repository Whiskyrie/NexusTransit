import type { AuditableOptions } from '../interfaces/auditable.interface';
import { AUDITABLE_ENTITY_KEY } from '../constants/auditable.constants';

/**
 * Utilitários para trabalhar com entidades auditáveis no módulo de motoristas
 */
export class AuditableUtils {
  /**
   * Verifica se uma entidade é auditável
   *
   * @param target - Target da classe
   * @returns true se a entidade é auditável
   */
  static isAuditable(target: object): boolean {
    try {
      const metadata: unknown = Reflect.getMetadata(AUDITABLE_ENTITY_KEY, target);
      return !!metadata;
    } catch {
      return false;
    }
  }

  /**
   * Obtém as opções de auditoria de uma entidade
   *
   * @param target - Target da classe
   * @returns Opções de auditoria ou undefined
   */
  static getAuditableOptions(target: object): AuditableOptions | undefined {
    try {
      return Reflect.getMetadata(AUDITABLE_ENTITY_KEY, target) as AuditableOptions | undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Remove campos sensíveis de um objeto antes de registrar
   *
   * @param data - Dados a serem sanitizados
   * @param excludeFields - Campos a serem excluídos
   * @returns Dados sanitizados
   */
  static sanitizeAuditData(
    data: Record<string, unknown>,
    excludeFields: string[] = [],
  ): Record<string, unknown> {
    const sanitized = { ...data };

    excludeFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });

    return sanitized;
  }

  /**
   * Compara dois objetos e retorna os campos que mudaram
   *
   * @param oldData - Dados antigos
   * @param newData - Dados novos
   * @returns Array de campos que mudaram
   */
  static getChangedFields(
    oldData: Record<string, unknown> | null,
    newData: Record<string, unknown> | null,
  ): string[] {
    if (!oldData || !newData) {
      return [];
    }

    const changedFields: string[] = [];

    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key]) {
        changedFields.push(key);
      }
    });

    return changedFields;
  }
}
