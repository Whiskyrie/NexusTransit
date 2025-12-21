import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AuditService } from "./audit.service";
import { AuditLogEntity } from "./entities/audit-log.entity";
import { AuditAction, AuditCategory } from "./enums";
import type { AuditFilterDto } from "./dto";

describe("AuditService", () => {
  let service: AuditService;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 0 }),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLogEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);

    jest.spyOn(Logger.prototype, "log").mockImplementation();
    jest.spyOn(Logger.prototype, "error").mockImplementation();
    jest.spyOn(Logger.prototype, "warn").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("deve criar um log de auditoria", async () => {
      const auditData = {
        action: AuditAction.CREATE,
        category: AuditCategory.USER_MANAGEMENT,
        userId: "user-123",
        resourceType: "User",
        resourceId: "resource-1",
      };

      const savedLog = { id: "log-123", ...auditData, created_at: new Date() };
      mockRepository.create.mockReturnValue(savedLog);
      mockRepository.save.mockResolvedValue(savedLog);

      const result = await service.create(auditData);

      expect(result).toEqual(savedLog);
      expect(mockRepository.create).toHaveBeenCalledWith(auditData);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe("logAction", () => {
    it("deve criar log com todos os parâmetros", async () => {
      const params = {
        action: AuditAction.UPDATE,
        category: AuditCategory.VEHICLE_MANAGEMENT,
        userId: "user-123",
        userEmail: "user@example.com",
        resourceType: "Vehicle",
        resourceId: "vehicle-123",
        description: "Vehicle updated",
        oldValues: { status: "inactive" },
        newValues: { status: "active" },
      };

      const savedLog = {
        id: "log-456",
        ...params,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.create.mockReturnValue(savedLog);
      mockRepository.save.mockResolvedValue(savedLog);

      await service.logAction(params);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: params.action,
          category: params.category,
          userId: params.userId,
          resourceType: params.resourceType,
        }),
      );
    });
  });

  describe("findAll", () => {
    it("deve retornar logs paginados com filtros", async () => {
      const filterDto: AuditFilterDto = {
        page: 1,
        limit: 10,
        action: AuditAction.CREATE,
      };

      const mockLogs = [
        { id: "1", action: AuditAction.CREATE, created_at: new Date() },
        { id: "2", action: AuditAction.CREATE, created_at: new Date() },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, 2]);

      const result = await service.findAll(filterDto);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it("deve aplicar filtro de busca textual", async () => {
      const filterDto: AuditFilterDto = {
        page: 1,
        limit: 10,
        search: "test search",
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining("description ILIKE :search"),
        expect.any(Object),
      );
    });
  });

  describe("findOne", () => {
    it("deve retornar um log específico", async () => {
      const mockLog = {
        id: "log-1",
        action: AuditAction.CREATE,
        created_at: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockLog);

      const result = await service.findOne("log-1");

      expect(result).toEqual(mockLog);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "log-1" },
      });
    });

    it("deve lançar erro quando não encontrar", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("nonexistent")).rejects.toThrow("Audit log with ID");
    });
  });

  describe("findByEntity", () => {
    it("deve retornar logs de uma entidade específica", async () => {
      const mockLogs = [
        {
          id: "1",
          resourceType: "Vehicle",
          resourceId: "vehicle-1",
          created_at: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByEntity("Vehicle", "vehicle-1");

      expect(result).toEqual(mockLogs);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { resourceType: "Vehicle", resourceId: "vehicle-1" },
        order: { created_at: "DESC" },
      });
    });
  });

  describe("findByUser", () => {
    it("deve retornar logs de um usuário", async () => {
      const mockLogs = [
        { id: "1", userId: "user-123", created_at: new Date() },
        { id: "2", userId: "user-123", created_at: new Date() },
      ];

      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByUser("user-123");

      expect(result).toHaveLength(2);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        order: { created_at: "DESC" },
        take: 100,
      });
    });
  });

  describe("findByAction", () => {
    it("deve retornar logs de uma ação específica", async () => {
      const mockLogs = [{ id: "1", action: AuditAction.DELETE, created_at: new Date() }];

      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByAction(AuditAction.DELETE);

      expect(result).toEqual(mockLogs);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { action: AuditAction.DELETE },
        order: { created_at: "DESC" },
        take: 100,
      });
    });
  });

  describe("findByDateRange", () => {
    it("deve retornar logs em um período", async () => {
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-31");

      const mockLogs = [{ id: "1", created_at: new Date("2025-01-15") }];

      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByDateRange(startDate, endDate);

      expect(result).toEqual(mockLogs);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe("getStatistics", () => {
    it("deve retornar estatísticas agregadas", async () => {
      const mockByAction = [
        { action: AuditAction.CREATE, count: "10" },
        { action: AuditAction.UPDATE, count: "5" },
      ];

      const mockByCategory = [{ category: AuditCategory.USER_MANAGEMENT, count: "8" }];

      mockRepository.count.mockResolvedValue(15);
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce(mockByAction)
        .mockResolvedValueOnce(mockByCategory);
      mockQueryBuilder.getRawOne.mockResolvedValue({ avg: "120" });

      const result = await service.getStatistics();

      expect(result.totalLogs).toBe(15);
      expect(result.byAction[AuditAction.CREATE]).toBe(10);
      expect(result.byCategory[AuditCategory.USER_MANAGEMENT]).toBe(8);
      expect(result.avgExecutionTime).toBe(120);
    });
  });

  describe("cleanOldLogs", () => {
    it("deve deletar logs antigos", async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 50 });

      const result = await service.cleanOldLogs(365);

      expect(result.deleted).toBe(50);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
    });

    it("deve usar período padrão de 365 dias", async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 10 });

      await service.cleanOldLogs(365);

      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });
  });
});
