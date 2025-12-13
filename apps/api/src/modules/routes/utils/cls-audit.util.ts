/**
 * CLS Audit Utils
 *
 * Utilitários para trabalhar com ClsService e contexto de auditoria.
 *
 * Fornece funções auxiliares para:
 * - Recuperar contexto de auditoria
 * - Obter informações do usuário atual
 * - Acessar request ID
 *
 * Baseado em melhores práticas 2025 para nestjs-cls
 *
 * @see https://github.com/papooch/nestjs-cls
 */

import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { AuditContext } from '../interfaces/audit-context.interface';

@Injectable()
export class ClsAuditUtils {
  constructor(private readonly clsService: ClsService) {}

  /**
   * Recupera o contexto completo de auditoria do CLS
   *
   * @returns Objeto com contexto de auditoria ou undefined se não disponível
   */
  getAuditContext(): AuditContext | undefined {
    const requestId = this.clsService.get<string>('requestId');

    if (!requestId) {
      return undefined;
    }

    return {
      requestId,
      userId: this.clsService.get<string>('userId'),
      userEmail: this.clsService.get<string>('userEmail'),
      userRole: this.clsService.get<string>('userRole'),
      ipAddress: this.clsService.get<string>('ipAddress'),
      userAgent: this.clsService.get<string>('userAgent'),
      timestamp: this.clsService.get<Date>('timestamp') ?? new Date(),
      path: this.clsService.get<string>('path') ?? '',
      method: this.clsService.get<string>('method') ?? '',
    };
  }

  /**
   * Define o contexto de auditoria no CLS
   *
   * @param context - Contexto de auditoria a ser armazenado
   */
  setAuditContext(context: Partial<AuditContext>): void {
    if (context.requestId) {
      this.clsService.set('requestId', context.requestId);
    }
    if (context.userId) {
      this.clsService.set('userId', context.userId);
    }
    if (context.userEmail) {
      this.clsService.set('userEmail', context.userEmail);
    }
    if (context.userRole) {
      this.clsService.set('userRole', context.userRole);
    }
    if (context.ipAddress) {
      this.clsService.set('ipAddress', context.ipAddress);
    }
    if (context.userAgent) {
      this.clsService.set('userAgent', context.userAgent);
    }
    if (context.timestamp) {
      this.clsService.set('timestamp', context.timestamp);
    }
    if (context.path) {
      this.clsService.set('path', context.path);
    }
    if (context.method) {
      this.clsService.set('method', context.method);
    }
  }

  /**
   * Recupera informações do usuário atual do CLS
   *
   * @returns Objeto com dados do usuário ou undefined
   */
  getCurrentUser(): { id?: string; email?: string; role?: string } | undefined {
    const userId = this.clsService.get<string>('userId');

    if (!userId) {
      return undefined;
    }

    return {
      id: userId,
      email: this.clsService.get<string>('userEmail'),
      role: this.clsService.get<string>('userRole'),
    };
  }

  /**
   * Recupera o request ID atual do CLS
   *
   * @returns Request ID ou undefined se não disponível
   */
  getRequestId(): string | undefined {
    return this.clsService.get<string>('requestId');
  }

  /**
   * Recupera o ID do usuário atual do CLS
   *
   * @returns User ID ou undefined se não disponível
   */
  getUserId(): string | undefined {
    return this.clsService.get<string>('userId');
  }

  /**
   * Recupera o email do usuário atual do CLS
   *
   * @returns Email do usuário ou undefined se não disponível
   */
  getUserEmail(): string | undefined {
    return this.clsService.get<string>('userEmail');
  }

  /**
   * Recupera o IP address do cliente atual do CLS
   *
   * @returns IP address ou undefined se não disponível
   */
  getIpAddress(): string | undefined {
    return this.clsService.get<string>('ipAddress');
  }

  /**
   * Verifica se há um contexto CLS ativo
   *
   * @returns true se o contexto está ativo
   */
  isContextActive(): boolean {
    return this.clsService.getId() !== undefined;
  }
}
