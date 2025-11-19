import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  Like,
  MoreThanOrEqual,
  Repository,
  FindManyOptions,
  FindOptionsWhere,
} from 'typeorm';
import { AuditLogEntity } from './entities';
import { CreateAuditLogDto, QueryAuditLogsDto } from './dto';
import { AuditAction } from './enums';
import {
  AUDIT_RETENTION_DAYS,
  AUDIT_DEFAULT_PAGE_SIZE,
  AUDIT_MAX_LOGS_PER_QUERY,
} from './constants/audit.constants';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  /**
   * Cria um novo log de auditoria
   */
  async createLog(createAuditLogDto: CreateAuditLogDto): Promise<AuditLogEntity> {
    try {
      const auditLog = this.auditLogRepository.create(createAuditLogDto);
      const savedLog = await this.auditLogRepository.save(auditLog);

      this.logger.debug(`Audit log created: ${savedLog.id}`);
      return savedLog;
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Busca logs com filtros e paginação
   */
  async findLogs(queryDto: QueryAuditLogsDto): Promise<{
    logs: AuditLogEntity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      action,
      category,
      userId,
      userEmail,
      resourceType,
      resourceId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = AUDIT_DEFAULT_PAGE_SIZE,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = queryDto;

    // Limitar máximo de resultados por consulta
    const safeLimit = Math.min(limit, AUDIT_MAX_LOGS_PER_QUERY);

    const whereConditions: FindOptionsWhere<AuditLogEntity> = {};

    if (action) {
      whereConditions.action = action;
    }

    if (category) {
      whereConditions.category = category;
    }

    if (userId) {
      whereConditions.userId = userId;
    }

    if (userEmail) {
      whereConditions.userEmail = Like(`%${userEmail}%`);
    }

    if (resourceType) {
      whereConditions.resourceType = resourceType;
    }

    if (resourceId) {
      whereConditions.resourceId = resourceId;
    }

    if (startDate && endDate) {
      whereConditions.created_at = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereConditions.created_at = MoreThanOrEqual(new Date(startDate));
    }

    if (search) {
      whereConditions.description = Like(`%${search}%`);
    }

    // Mapear campos de ordenação camelCase para snake_case se necessário
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy;

    const options: FindManyOptions<AuditLogEntity> = {
      where: whereConditions,
      order: { [sortColumn]: sortOrder },
      skip: (page - 1) * safeLimit,
      take: safeLimit,
    };

    const [logs, total] = await this.auditLogRepository.findAndCount(options);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * Busca log por ID
   */
  async findLogById(id: string): Promise<AuditLogEntity | null> {
    return this.auditLogRepository.findOne({ where: { id } });
  }

  /**
   * Busca logs de um usuário específico
   */
  async findLogsByUserId(userId: string, limit = 50): Promise<AuditLogEntity[]> {
    const safeLimit = Math.min(limit, AUDIT_MAX_LOGS_PER_QUERY);

    return this.auditLogRepository.find({
      where: { userId },
      order: { created_at: 'DESC' },
      take: safeLimit,
    });
  }

  /**
   * Busca logs de um recurso específico
   */
  async findLogsByResource(
    resourceType: string,
    resourceId: string,
    limit = 50,
  ): Promise<AuditLogEntity[]> {
    const safeLimit = Math.min(limit, AUDIT_MAX_LOGS_PER_QUERY);

    return this.auditLogRepository.find({
      where: { resourceType, resourceId },
      order: { created_at: 'DESC' },
      take: safeLimit,
    });
  }

  /**
   * Remove logs expirados baseado no período de retenção
   */
  async deleteExpiredLogs(): Promise<number> {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - AUDIT_RETENTION_DAYS);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :date', { date: retentionDate })
      .andWhere('retention_period_days IS NULL OR retention_period_days <= :retentionDays', {
        retentionDays: AUDIT_RETENTION_DAYS,
      })
      .execute();

    const deletedCount = result.affected ?? 0;
    this.logger.log(`Deleted ${deletedCount} expired audit logs`);

    return deletedCount;
  }

  /**
   * Obtém estatísticas de auditoria
   */
  async getStatistics(days = AUDIT_RETENTION_DAYS): Promise<{
    totalLogs: number;
    loginAttempts: number;
    failedLogins: number;
    successfulLogins: number;
    createOperations: number;
    updateOperations: number;
    deleteOperations: number;
    topActions: { action: string; count: number }[];
    topCategories: { category: string; count: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalLogs = await this.auditLogRepository.count({
      where: { created_at: Between(startDate, new Date()) },
    });

    const loginAttempts = await this.auditLogRepository.count({
      where: {
        action: AuditAction.LOGIN,
        created_at: Between(startDate, new Date()),
      },
    });

    const failedLogins = await this.auditLogRepository.count({
      where: {
        action: AuditAction.FAILED_LOGIN,
        created_at: Between(startDate, new Date()),
      },
    });

    const createOperations = await this.auditLogRepository.count({
      where: {
        action: AuditAction.CREATE,
        created_at: Between(startDate, new Date()),
      },
    });

    const updateOperations = await this.auditLogRepository.count({
      where: {
        action: AuditAction.UPDATE,
        created_at: Between(startDate, new Date()),
      },
    });

    const deleteOperations = await this.auditLogRepository.count({
      where: {
        action: AuditAction.DELETE,
        created_at: Between(startDate, new Date()),
      },
    });

    const successfulLogins = loginAttempts - failedLogins;

    const topActionsQuery = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('audit.created_at >= :startDate', { startDate })
      .groupBy('audit.action')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany<{ action: string; count: string }>();

    const topCategoriesQuery = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('audit.created_at >= :startDate', { startDate })
      .groupBy('audit.category')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany<{ category: string; count: string }>();

    return {
      totalLogs,
      loginAttempts,
      failedLogins,
      successfulLogins,
      createOperations,
      updateOperations,
      deleteOperations,
      topActions: topActionsQuery.map(item => ({
        action: item.action,
        count: parseInt(item.count, 10),
      })),
      topCategories: topCategoriesQuery.map(item => ({
        category: item.category,
        count: parseInt(item.count, 10),
      })),
    };
  }
}
