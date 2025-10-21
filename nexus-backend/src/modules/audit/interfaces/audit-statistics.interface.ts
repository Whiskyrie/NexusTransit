import type { AuditAction, AuditCategory } from '../enums';

/**
 * Interface para estatísticas de auditoria
 */
export interface IAuditStatistics {
  /**
   * Número total de logs no período
   */
  totalLogs: number;

  /**
   * Número de tentativas de login
   */
  loginAttempts: number;

  /**
   * Número de logins falhados
   */
  failedLogins: number;

  /**
   * Número de operações de criação
   */
  createOperations: number;

  /**
   * Número de operações de atualização
   */
  updateOperations: number;

  /**
   * Número de operações de deleção
   */
  deleteOperations: number;

  /**
   * Distribuição por categoria
   */
  byCategory: Record<AuditCategory, number>;

  /**
   * Distribuição por ação
   */
  byAction: Record<AuditAction, number>;

  /**
   * Usuários mais ativos
   */
  topUsers: {
    userId: string;
    userEmail: string;
    count: number;
  }[];

  /**
   * Recursos mais acessados
   */
  topResources: {
    resourceType: string;
    resourceId: string;
    count: number;
  }[];

  /**
   * Período analisado
   */
  period: {
    startDate: Date;
    endDate: Date;
    days: number;
  };
}

/**
 * Interface para estatísticas por período
 */
export interface IAuditStatisticsByPeriod {
  /**
   * Data do período
   */
  date: string;

  /**
   * Contagem de logs
   */
  count: number;
}

/**
 * Interface para estatísticas de recurso específico
 */
export interface IResourceAuditStatistics {
  /**
   * Tipo de recurso
   */
  resourceType: string;

  /**
   * ID do recurso
   */
  resourceId: string;

  /**
   * Total de operações
   */
  totalOperations: number;

  /**
   * Última modificação
   */
  lastModified: Date;

  /**
   * Usuário que fez a última modificação
   */
  lastModifiedBy: {
    userId: string;
    userEmail: string;
  };

  /**
   * Distribuição de ações
   */
  actionDistribution: Record<AuditAction, number>;
}
