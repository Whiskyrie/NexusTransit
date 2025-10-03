import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between, Like, FindOptionsWhere } from 'typeorm';
import { AuditLogEntity } from './entities/auditEntities';
import { CreateAuditLogDto, QueryAuditLogsDto } from './dto/auditDto';
import { AuditAction } from './enums/auditEnums';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

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
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

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
      whereConditions.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereConditions.createdAt = new Date(startDate);
    }

    if (search) {
      // Simple text search in description field
      whereConditions.description = Like(`%${search}%`);
    }

    const options: FindManyOptions<AuditLogEntity> = {
      where: whereConditions,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    };

    const [logs, total] = await this.auditLogRepository.findAndCount(options);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findLogById(id: string): Promise<AuditLogEntity | null> {
    return this.auditLogRepository.findOne({ where: { id } });
  }

  async findLogsByUserId(userId: string, limit = 50): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findLogsByResource(
    resourceType: string,
    resourceId: string,
    limit = 50,
  ): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.find({
      where: { resourceType, resourceId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async deleteExpiredLogs(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :date', { date: thirtyDaysAgo })
      .andWhere('retention_period_days IS NULL OR retention_period_days <= 30')
      .execute();

    this.logger.log(`Deleted ${result.affected} expired audit logs`);
    return result.affected ?? 0;
  }

  async getStatistics(days = 30): Promise<{
    totalLogs: number;
    loginAttempts: number;
    failedLogins: number;
    successfulLogins: number;
    topActions: { action: string; count: number }[];
    topCategories: { category: string; count: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalLogs = await this.auditLogRepository.count({
      where: { createdAt: Between(startDate, new Date()) },
    });

    const loginAttempts = await this.auditLogRepository.count({
      where: {
        action: AuditAction.LOGIN,
        createdAt: Between(startDate, new Date()),
      },
    });

    const failedLogins = await this.auditLogRepository.count({
      where: {
        action: AuditAction.FAILED_LOGIN,
        createdAt: Between(startDate, new Date()),
      },
    });

    const successfulLogins = loginAttempts - failedLogins;

    const topActionsQuery = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('audit.createdAt >= :startDate', { startDate })
      .groupBy('audit.action')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany<{ action: string; count: string }>();

    const topCategoriesQuery = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('audit.createdAt >= :startDate', { startDate })
      .groupBy('audit.category')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany<{ category: string; count: string }>();

    return {
      totalLogs,
      loginAttempts,
      failedLogins,
      successfulLogins,
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
