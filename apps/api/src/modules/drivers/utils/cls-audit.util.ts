import type { ClsService } from 'nestjs-cls';
import type { AuditContext } from '../interfaces/auditable.interface';

/**
 * Utilitários para trabalhar com ClsService e contexto de auditoria no módulo de motoristas
 *
 * Fornece helpers type-safe para extrair informações do CLS
 *
 * @class ClsAuditUtils
 */
export class ClsAuditUtils {
  /**
   * Extrai um valor tipado do ClsService
   *
   * @param clsService - Instância do ClsService
   * @param key - Chave a ser buscada
   * @returns Valor tipado como string ou undefined
   */
  static getClsValue(clsService: ClsService, key: string): string | undefined {
    const value: unknown = clsService.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Obtém o contexto completo de auditoria do ClsService
   *
   * @param clsService - Instância do ClsService
   * @returns Contexto de auditoria completo
   *
   * @example
   * ```typescript
   * const context = ClsAuditUtils.getAuditContext(clsService);
   * console.log(context.userId); // ID do usuário
   * console.log(context.requestId); // ID da requisição
   * ```
   */
  static getAuditContext(clsService: ClsService): AuditContext {
    try {
      const userId = this.getClsValue(clsService, 'userId');
      const userEmail = this.getClsValue(clsService, 'userEmail');
      const ipAddress = this.getClsValue(clsService, 'ipAddress');
      const userAgent = this.getClsValue(clsService, 'userAgent');
      const requestId = this.getClsValue(clsService, 'requestId');

      return {
        userId,
        userEmail,
        ipAddress,
        userAgent,
        requestId,
      };
    } catch {
      return {};
    }
  }

  /**
   * Verifica se há um contexto de auditoria ativo
   *
   * @param clsService - Instância do ClsService
   * @returns true se há contexto ativo
   */
  static hasActiveContext(clsService: ClsService): boolean {
    try {
      const requestId = this.getClsValue(clsService, 'requestId');
      return !!requestId;
    } catch {
      return false;
    }
  }
}
