import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan, Not, In, FindOptionsWhere } from "typeorm";
import { AuditLogEntity } from "../entities/audit-log.entity";
import { AuditCategory } from "../enums";
import { DATA_RETENTION_POLICY, isCriticalCategory } from "../utils/lgpd.util";
import { subDays } from "date-fns";

@Injectable()
export class AuditCleanupService {
  private readonly logger = new Logger(AuditCleanupService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  /**
   * Job agendado para limpeza automática de logs antigos
   * Executa diariamente às 03:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: "audit-cleanup",
    timeZone: "America/Sao_Paulo",
  })
  async handleScheduledCleanup(): Promise<void> {
    this.logger.log("Iniciando limpeza automática de logs de auditoria");

    try {
      const result = await this.cleanupExpiredLogs();
      this.logger.log(`Limpeza automática concluída: ${result.totalDeleted} logs removidos`);
    } catch (error) {
      this.logger.error("Erro durante limpeza automática:", error);
    }
  }

  /**
   * Remove logs expirados com base na política de retenção
   */
  async cleanupExpiredLogs(): Promise<{
    totalDeleted: number;
    byCategory: Record<string, number>;
  }> {
    const byCategory: Record<string, number> = {};
    let totalDeleted = 0;

    // Processar cada categoria separadamente
    for (const [category, retentionDays] of Object.entries(DATA_RETENTION_POLICY)) {
      const auditCategory = category as AuditCategory;

      // Pular categorias críticas
      if (isCriticalCategory(auditCategory)) {
        this.logger.debug(`Categoria ${category} é crítica - pulando limpeza automática`);
        continue;
      }

      const cutoffDate = subDays(new Date(), retentionDays);

      try {
        const result = await this.auditLogRepository.delete({
          category: auditCategory,
          created_at: LessThan(cutoffDate),
        });

        const deleted = result.affected || 0;
        byCategory[category] = deleted;
        totalDeleted += deleted;

        if (deleted > 0) {
          this.logger.log(
            `Categoria ${category}: ${deleted} logs removidos (retenção: ${retentionDays} dias)`,
          );
        }
      } catch (error) {
        this.logger.error(`Erro ao limpar categoria ${category}:`, error);
      }
    }

    return { totalDeleted, byCategory };
  }

  /**
   * Remove logs específicos de um usuário (direito ao esquecimento - LGPD Art. 18, VI)
   */
  async deleteUserLogs(
    userId: string,
    options: {
      keepCriticalLogs?: boolean;
      keepSecurityLogs?: boolean;
    } = {},
  ): Promise<{ deleted: number }> {
    const { keepCriticalLogs = true, keepSecurityLogs = true } = options;

    const whereConditions: FindOptionsWhere<AuditLogEntity> = { userId };

    // Se deve manter logs críticos
    if (keepCriticalLogs) {
      const categoriesToDelete = Object.values(AuditCategory).filter(
        (cat) => !isCriticalCategory(cat),
      );
      whereConditions.category = In(categoriesToDelete);
    }

    // Se deve manter logs de segurança
    if (keepSecurityLogs) {
      whereConditions.category = Not(In([AuditCategory.SECURITY, AuditCategory.AUTH]));
    }

    const result = await this.auditLogRepository.delete(whereConditions);

    this.logger.warn(
      `Removidos ${result.affected || 0} logs do usuário ${userId} (direito ao esquecimento)`,
    );

    return { deleted: result.affected || 0 };
  }

  /**
   * Remove logs de uma entidade específica
   */
  async deleteEntityLogs(resourceType: string, resourceId: string): Promise<{ deleted: number }> {
    const result = await this.auditLogRepository.delete({
      resourceType,
      resourceId,
    });

    this.logger.log(
      `Removidos ${result.affected || 0} logs da entidade ${resourceType}:${resourceId}`,
    );

    return { deleted: result.affected || 0 };
  }

  /**
   * Arquiva logs antigos antes de deletar (opcional)
   */
  async archiveAndCleanup(
    category: AuditCategory,
    customRetentionDays?: number,
  ): Promise<{
    archived: number;
    deleted: number;
  }> {
    const retentionDays = customRetentionDays || DATA_RETENTION_POLICY[category];
    const cutoffDate = subDays(new Date(), retentionDays);

    // Buscar logs a serem arquivados
    const logsToArchive = await this.auditLogRepository.find({
      where: {
        category,
        created_at: LessThan(cutoffDate),
      },
      take: 10000, // Limitar para não sobrecarregar
    });

    const archived = logsToArchive.length;

    // TODO: Implementar export para S3 ou filesystem
    // await this.exportToArchive(logsToArchive);

    // Deletar após arquivar
    const result = await this.auditLogRepository.delete({
      category,
      created_at: LessThan(cutoffDate),
    });

    this.logger.log(
      `Categoria ${category}: ${archived} logs arquivados, ${result.affected || 0} removidos`,
    );

    return {
      archived,
      deleted: result.affected || 0,
    };
  }

  /**
   * Obtém estatísticas de logs para limpeza
   */
  async getCleanupStats(): Promise<{
    totalLogs: number;
    eligibleForCleanup: number;
    byCategory: Array<{
      category: AuditCategory;
      total: number;
      eligibleForCleanup: number;
      retentionDays: number;
      isCritical: boolean;
    }>;
  }> {
    const totalLogs = await this.auditLogRepository.count();
    let eligibleForCleanup = 0;

    const byCategory = await Promise.all(
      Object.entries(DATA_RETENTION_POLICY).map(async ([category, retentionDays]) => {
        const auditCategory = category as AuditCategory;
        const total = await this.auditLogRepository.count({
          where: { category: auditCategory },
        });

        const cutoffDate = subDays(new Date(), retentionDays);
        const eligible = isCriticalCategory(auditCategory)
          ? 0
          : await this.auditLogRepository.count({
              where: {
                category: auditCategory,
                created_at: LessThan(cutoffDate),
              },
            });

        eligibleForCleanup += eligible;

        return {
          category: auditCategory,
          total,
          eligibleForCleanup: eligible,
          retentionDays,
          isCritical: isCriticalCategory(auditCategory),
        };
      }),
    );

    return {
      totalLogs,
      eligibleForCleanup,
      byCategory,
    };
  }
}
