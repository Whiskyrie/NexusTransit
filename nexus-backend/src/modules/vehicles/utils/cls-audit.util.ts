import type { ClsService } from 'nestjs-cls';
import type { AuditContext } from '../interfaces/auditable.interface';

/**
 * Utilitários para trabalhar com ClsService e contexto de auditoria
 */
export class ClsAuditUtils {
  /**
   * Extrai um valor tipado do ClsService
   */
  static getClsValue(clsService: ClsService, key: string): string | undefined {
    const value: unknown = clsService.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Obtém o contexto completo de auditoria do ClsService
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
    } catch (error) {
      console.warn('Erro ao obter contexto de auditoria:', error);
      return {};
    }
  }
}
