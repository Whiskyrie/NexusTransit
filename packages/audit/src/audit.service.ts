import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, In } from "typeorm";
import { AuditLogEntity } from "./entities/audit-log.entity";
import { AuditAction, AuditCategory } from "./enums";
import { AuditFilterDto, AuditResponseDto, AuditStatisticsDto } from "./dto";
import { PaginatedResponseDto } from "@nexus/common";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  async create(data: Partial<AuditLogEntity>): Promise<AuditLogEntity> {
    try {
      const log = this.auditLogRepository.create(data);
      return await this.auditLogRepository.save(log);
    } catch (error) {
      this.logger.error("Failed to create audit log", error);
      throw error;
    }
  }

  async logAction(params: {
    action: AuditAction;
    category: AuditCategory;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    resourceType: string;
    resourceId?: string;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.create({
        ...params,
        resourceId: params.resourceId || null,
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        userRole: params.userRole || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        description: params.description || null,
        metadata: params.metadata || null,
        oldValues: params.oldValues || null,
        newValues: params.newValues || null,
      });
    } catch (error) {
      // Don't throw error to avoid breaking the main flow
      this.logger.error("Failed to log audit action", error);
    }
  }

  /**
   * Find all audit logs with filters and pagination
   */
  async findAll(filterDto: AuditFilterDto): Promise<PaginatedResponseDto<AuditResponseDto>> {
    const {
      page = 1,
      limit = 10,
      action,
      category,
      userId,
      resourceType,
      resourceId,
      startDate,
      endDate,
      ipAddress,
      search,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = filterDto;

    const queryBuilder = this.auditLogRepository.createQueryBuilder("audit_log");

    // Aplicar filtros
    if (action) {
      queryBuilder.andWhere("audit_log.action = :action", { action });
    }

    if (category) {
      queryBuilder.andWhere("audit_log.category = :category", { category });
    }

    if (userId) {
      queryBuilder.andWhere("audit_log.userId = :userId", { userId });
    }

    if (resourceType) {
      queryBuilder.andWhere("audit_log.resourceType = :resourceType", {
        resourceType,
      });
    }

    if (resourceId) {
      queryBuilder.andWhere("audit_log.resourceId = :resourceId", {
        resourceId,
      });
    }

    if (ipAddress) {
      queryBuilder.andWhere("audit_log.ipAddress = :ipAddress", { ipAddress });
    }

    // Filtro de data
    if (startDate || endDate) {
      const start = startDate
        ? startOfDay(new Date(startDate))
        : startOfDay(subDays(new Date(), 30));
      const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());

      queryBuilder.andWhere("audit_log.created_at BETWEEN :start AND :end", {
        start,
        end,
      });
    }

    // Busca textual
    if (search) {
      queryBuilder.andWhere(
        "(audit_log.description ILIKE :search OR CAST(audit_log.metadata AS TEXT) ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    // Ordenação
    const validSortFields = ["created_at", "action", "category", "resourceType"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
    queryBuilder.orderBy(`audit_log.${sortField}`, sortOrder);

    // Paginação
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Executar query
    const [logs, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: logs.map((log) => this.mapToResponseDto(log)),
      meta: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_previous: page > 1,
        has_next: page < totalPages,
      },
    };
  }

  /**
   * Find audit log by ID
   */
  async findOne(id: string): Promise<AuditResponseDto> {
    const log = await this.auditLogRepository.findOne({ where: { id } });

    if (!log) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return this.mapToResponseDto(log);
  }

  /**
   * Find audit logs by entity
   */
  async findByEntity(resourceType: string, resourceId: string): Promise<AuditResponseDto[]> {
    const logs = await this.auditLogRepository.find({
      where: { resourceType, resourceId },
      order: { created_at: "DESC" },
    });

    return logs.map((log) => this.mapToResponseDto(log));
  }

  /**
   * Find audit logs by user
   */
  async findByUser(userId: string): Promise<AuditResponseDto[]> {
    const logs = await this.auditLogRepository.find({
      where: { userId },
      order: { created_at: "DESC" },
      take: 100,
    });

    return logs.map((log) => this.mapToResponseDto(log));
  }

  /**
   * Find audit logs by action
   */
  async findByAction(action: AuditAction): Promise<AuditResponseDto[]> {
    const logs = await this.auditLogRepository.find({
      where: { action },
      order: { created_at: "DESC" },
      take: 100,
    });

    return logs.map((log) => this.mapToResponseDto(log));
  }

  /**
   * Find audit logs by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<AuditResponseDto[]> {
    const logs = await this.auditLogRepository.find({
      where: {
        created_at: Between(startOfDay(startDate), endOfDay(endDate)),
      },
      order: { created_at: "DESC" },
    });

    return logs.map((log) => this.mapToResponseDto(log));
  }

  /**
   * Get audit statistics
   */
  async getStatistics(period: "day" | "week" | "month" = "week"): Promise<AuditStatisticsDto> {
    const days = period === "day" ? 1 : period === "week" ? 7 : 30;
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // Total de logs
    const totalLogs = await this.auditLogRepository.count({
      where: {
        created_at: Between(startDate, endDate),
      },
    });

    // Logs por ação
    const byActionQuery = await this.auditLogRepository
      .createQueryBuilder("audit_log")
      .select("audit_log.action", "action")
      .addSelect("COUNT(*)", "count")
      .where("audit_log.created_at BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .groupBy("audit_log.action")
      .getRawMany();

    const byAction = Object.values(AuditAction).reduce(
      (acc, action) => {
        const found = byActionQuery.find((item) => item.action === action);
        acc[action] = found ? parseInt(found.count, 10) : 0;
        return acc;
      },
      {} as Record<AuditAction, number>,
    );

    // Logs por categoria
    const byCategoryQuery = await this.auditLogRepository
      .createQueryBuilder("audit_log")
      .select("audit_log.category", "category")
      .addSelect("COUNT(*)", "count")
      .where("audit_log.created_at BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .groupBy("audit_log.category")
      .getRawMany();

    const byCategory = Object.values(AuditCategory).reduce(
      (acc, category) => {
        const found = byCategoryQuery.find((item) => item.category === category);
        acc[category] = found ? parseInt(found.count, 10) : 0;
        return acc;
      },
      {} as Record<AuditCategory, number>,
    );

    // Top usuários
    const topUsers = await this.auditLogRepository
      .createQueryBuilder("audit_log")
      .select("audit_log.userId", "userId")
      .addSelect("audit_log.userEmail", "userEmail")
      .addSelect("COUNT(*)", "count")
      .where("audit_log.created_at BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("audit_log.userId IS NOT NULL")
      .groupBy("audit_log.userId, audit_log.userEmail")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();

    // Top entidades
    const topEntities = await this.auditLogRepository
      .createQueryBuilder("audit_log")
      .select("audit_log.resourceType", "entityName")
      .addSelect("COUNT(*)", "count")
      .where("audit_log.created_at BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .groupBy("audit_log.resourceType")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();

    // Tempo médio de execução
    const avgExecResult = await this.auditLogRepository
      .createQueryBuilder("audit_log")
      .select("AVG(audit_log.executionTimeMs)", "avg")
      .where("audit_log.created_at BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("audit_log.executionTimeMs IS NOT NULL")
      .getRawOne();

    const avgExecutionTime = avgExecResult?.avg ? parseFloat(avgExecResult.avg) : 0;

    // Taxa de erro (baseado em status code >= 400)
    const errorCount = await this.auditLogRepository.count({
      where: {
        created_at: Between(startDate, endDate),
        statusCode: In([400, 401, 403, 404, 500, 502, 503]),
      },
    });

    const errorRate = totalLogs > 0 ? (errorCount / totalLogs) * 100 : 0;

    // Dados por dia
    const dataByDay = await this.auditLogRepository
      .createQueryBuilder("audit_log")
      .select("DATE(audit_log.created_at)", "date")
      .addSelect("COUNT(*)", "count")
      .where("audit_log.created_at BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .groupBy("DATE(audit_log.created_at)")
      .orderBy("date", "ASC")
      .getRawMany();

    return {
      totalLogs,
      byAction,
      byCategory,
      topUsers: topUsers.map((u) => ({
        userId: u.userId,
        userEmail: u.userEmail,
        count: parseInt(u.count, 10),
      })),
      topEntities: topEntities.map((e) => ({
        entityName: e.entityName,
        count: parseInt(e.count, 10),
      })),
      avgExecutionTime: Math.round(avgExecutionTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      dataByDay: dataByDay.map((d) => ({
        date: format(new Date(d.date), "yyyy-MM-dd"),
        count: parseInt(d.count, 10),
      })),
      period: `last_${days}_days`,
    };
  }

  /**
   * Clean old logs based on retention period
   */
  async cleanOldLogs(retentionDays: number): Promise<{ deleted: number }> {
    const cutoffDate = subDays(new Date(), retentionDays);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where("created_at < :cutoffDate", { cutoffDate })
      .execute();

    this.logger.log(`Cleaned ${result.affected || 0} audit logs older than ${retentionDays} days`);

    return { deleted: result.affected || 0 };
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(entity: AuditLogEntity): AuditResponseDto {
    const dto = new AuditResponseDto();
    Object.assign(dto, entity);
    return dto;
  }
}
