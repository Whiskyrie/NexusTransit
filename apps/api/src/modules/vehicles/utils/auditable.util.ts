import { AUDITABLE_ENTITY_KEY } from '../constants/auditable.constants';
import type { AuditableOptions } from '../interfaces/auditable.interface';

/**
 * Utilitários para verificar e manipular entidades auditáveis
 */
export class AuditableUtils {
  /**
   * Verifica se uma entidade é auditável
   */
  static isAuditable(target: unknown): boolean {
    if (!target || typeof target !== 'object') {
      return false;
    }
    return Reflect.hasMetadata(AUDITABLE_ENTITY_KEY, target);
  }

  /**
   * Obtém as opções de auditoria de uma entidade
   */
  static getAuditOptions(target: unknown): AuditableOptions | null {
    if (!target || typeof target !== 'object') {
      return null;
    }
    const metadata = Reflect.getMetadata(AUDITABLE_ENTITY_KEY, target) as
      | AuditableOptions
      | undefined;
    return metadata ?? null;
  }

  /**
   * Verifica se uma operação específica deve ser rastreada
   */
  static shouldTrackOperation(target: unknown, operation: 'CREATE' | 'UPDATE' | 'DELETE'): boolean {
    const options = this.getAuditOptions(target);
    if (!options) {
      return false;
    }

    switch (operation) {
      case 'CREATE':
        return options.trackCreation ?? true;
      case 'UPDATE':
        return options.trackUpdates ?? true;
      case 'DELETE':
        return options.trackDeletion ?? true;
      default:
        return false;
    }
  }

  /**
   * Obtém os campos que devem ser excluídos da auditoria
   */
  static getExcludedFields(target: unknown): string[] {
    const options = this.getAuditOptions(target);
    return options?.excludeFields ?? ['updated_at', 'created_at'];
  }

  /**
   * Verifica se os valores antigos devem ser rastreados
   */
  static shouldTrackOldValues(target: unknown): boolean {
    const options = this.getAuditOptions(target);
    return options?.trackOldValues ?? true;
  }

  /**
   * Obtém o nome de exibição da entidade para logs
   */
  static getEntityDisplayName(target: unknown): string {
    const options = this.getAuditOptions(target);
    if (options?.entityDisplayName) {
      return options.entityDisplayName;
    }

    if (target && typeof target === 'object' && 'constructor' in target) {
      const constructor = target.constructor as { name?: string };
      return constructor.name ?? 'Unknown';
    }

    return 'Unknown';
  }
}
