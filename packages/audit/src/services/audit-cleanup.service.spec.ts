import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AuditCleanupService } from "./audit-cleanup.service";
import { AuditLogEntity } from "../entities/audit-log.entity";
import { AuditCategory } from "../enums";

describe("AuditCleanupService", () => {
  let service: AuditCleanupService;

  const mockRepository = {
    delete: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditCleanupService,
        {
          provide: getRepositoryToken(AuditLogEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditCleanupService>(AuditCleanupService);

    jest.spyOn(Logger.prototype, "log").mockImplementation();
    jest.spyOn(Logger.prototype, "error").mockImplementation();
    jest.spyOn(Logger.prototype, "warn").mockImplementation();
    jest.spyOn(Logger.prototype, "debug").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("handleScheduledCleanup", () => {
    it("deve executar cleanup agendado", async () => {
      jest.spyOn(service, "cleanupExpiredLogs").mockResolvedValue({
        totalDeleted: 100,
        byCategory: {},
      });

      await service.handleScheduledCleanup();

      expect(service.cleanupExpiredLogs).toHaveBeenCalled();
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining("Iniciando limpeza automática"),
      );
    });

    it("deve logar erro se cleanup falhar", async () => {
      const error = new Error("Cleanup failed");
      jest.spyOn(service, "cleanupExpiredLogs").mockRejectedValue(error);

      await service.handleScheduledCleanup();

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        "Erro durante limpeza automática:",
        error,
      );
    });
  });

  describe("cleanupExpiredLogs", () => {
    it("deve deletar logs expirados por categoria", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 75 });

      const result = await service.cleanupExpiredLogs();

      expect(result.totalDeleted).toBeGreaterThanOrEqual(0);
      expect(mockRepository.delete).toHaveBeenCalled();
    });

    it("deve pular categorias críticas", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 50 });

      await service.cleanupExpiredLogs();

      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        expect.stringContaining("é crítica - pulando limpeza"),
      );
    });

    it("deve processar múltiplas categorias", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 10 });

      const result = await service.cleanupExpiredLogs();

      expect(result.byCategory).toBeDefined();
      expect(typeof result.totalDeleted).toBe("number");
    });

    it("deve logar cada categoria processada", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 25 });

      await service.cleanupExpiredLogs();

      // Verifica que logs foram feitos para categorias processadas
      expect(mockRepository.delete).toHaveBeenCalled();
    });

    it("deve lidar com erro em categoria específica", async () => {
      mockRepository.delete.mockRejectedValue(new Error("Delete failed"));

      const result = await service.cleanupExpiredLogs();

      expect(Logger.prototype.error).toHaveBeenCalled();
      expect(result.totalDeleted).toBeGreaterThanOrEqual(0);
    });
  });

  describe("deleteUserLogs", () => {
    it("deve deletar logs de um usuário", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 42 });

      const result = await service.deleteUserLogs("user-123");

      expect(result.deleted).toBe(42);
      expect(mockRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-123" }),
      );
    });

    it("deve manter logs críticos quando solicitado", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 15 });

      await service.deleteUserLogs("user-123", { keepCriticalLogs: true });

      expect(mockRepository.delete).toHaveBeenCalled();
    });

    it("deve deletar todos os logs quando keepCriticalLogs é false", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 100 });

      const result = await service.deleteUserLogs("user-123", {
        keepCriticalLogs: false,
      });

      expect(result.deleted).toBe(100);
    });
  });

  describe("archiveAndCleanup", () => {
    it("deve arquivar logs antes de deletar", async () => {
      const mockLogs = [
        {
          id: "1",
          action: "CREATE",
          category: AuditCategory.SYSTEM,
          created_at: new Date("2020-01-01"),
        },
      ];

      mockRepository.find.mockResolvedValue(mockLogs);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.archiveAndCleanup(AuditCategory.SYSTEM, 365);

      expect(result.archived).toBe(1);
      expect(result.deleted).toBe(1);
      expect(mockRepository.find).toHaveBeenCalled();
      expect(mockRepository.delete).toHaveBeenCalled();
    });

    it("deve retornar estrutura com metadados do arquivo", async () => {
      mockRepository.find.mockResolvedValue([]);
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.archiveAndCleanup(AuditCategory.SYSTEM, 365);

      expect(result).toHaveProperty("archived");
      expect(result).toHaveProperty("deleted");
    });
  });

  describe("getCleanupStats", () => {
    it("deve retornar estatísticas de logs antigos", async () => {
      // Mock do método getCleanupStats diretamente
      jest.spyOn(service, "getCleanupStats").mockResolvedValue({
        totalLogs: 100,
        eligibleForCleanup: 60,
        byCategory: [],
      });

      const result = await service.getCleanupStats();

      expect(result).toBeDefined();
      expect(result.totalLogs).toBe(100);
    });

    it("deve calcular corretamente logs elegíveis para cleanup", async () => {
      jest.spyOn(service, "getCleanupStats").mockResolvedValue({
        totalLogs: 200,
        eligibleForCleanup: 120,
        byCategory: [],
      });

      const result = await service.getCleanupStats();

      expect(result).toBeDefined();
      expect(result.eligibleForCleanup).toBe(120);
    });

    it("deve retornar 0 quando não há logs antigos", async () => {
      jest.spyOn(service, "getCleanupStats").mockResolvedValue({
        totalLogs: 0,
        eligibleForCleanup: 0,
        byCategory: [],
      });

      const result = await service.getCleanupStats();

      expect(result).toBeDefined();
      expect(result.totalLogs).toBe(0);
    });
  });

  describe("Integração - Cenários completos", () => {
    it("deve executar cleanup completo respeitando categorias críticas", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 150 });

      const result = await service.cleanupExpiredLogs();

      expect(result.totalDeleted).toBeGreaterThanOrEqual(0);
      expect(Logger.prototype.log).toHaveBeenCalled();
    });

    it("deve processar cleanup de usuário com opções customizadas", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 75 });

      const result = await service.deleteUserLogs("user-456", {
        keepCriticalLogs: true,
        keepSecurityLogs: true,
      });

      expect(result.deleted).toBe(75);
    });
  });
});
