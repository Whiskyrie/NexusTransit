import { Test, TestingModule } from "@nestjs/testing";
import { BlacklistService, BlacklistType } from "./blacklist.service";
import { RedisService } from "@nexus/redis";

describe("BlacklistService", () => {
  let service: BlacklistService;
  let mockRedisService: jest.Mocked<
    Pick<RedisService, "get" | "set" | "delete" | "getRedisClient">
  >;

  beforeEach(async () => {
    mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getRedisClient: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [BlacklistService, { provide: RedisService, useValue: mockRedisService }],
    }).compile();

    service = module.get<BlacklistService>(BlacklistService);
  });

  it("deve ser definido", () => {
    expect(service).toBeDefined();
  });

  describe("isWhitelisted", () => {
    it("deve retornar true quando identificador está na whitelist", async () => {
      mockRedisService.get.mockResolvedValue("1");

      const result = await service.isWhitelisted("192.168.1.1", "IP");

      expect(result).toBe(true);
    });

    it("deve retornar false quando identificador não está na whitelist", async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.isWhitelisted("192.168.1.1", "IP");

      expect(result).toBe(false);
    });

    it("deve retornar false em caso de erro no Redis", async () => {
      mockRedisService.get.mockRejectedValue(new Error("Redis error"));

      const result = await service.isWhitelisted("192.168.1.1", "IP");

      expect(result).toBe(false);
    });

    it("deve verificar pelo tipo correto na chave", async () => {
      mockRedisService.get.mockResolvedValue(null);

      await service.isWhitelisted("user-123", "USER");

      expect(mockRedisService.get).toHaveBeenCalledWith(
        expect.stringContaining("whitelist:user:user-123"),
      );
    });
  });

  describe("isBlacklisted", () => {
    it("deve retornar true quando identificador está na blacklist", async () => {
      mockRedisService.get.mockResolvedValue("1");

      const result = await service.isBlacklisted("bad-ip", "IP");

      expect(result).toBe(true);
    });

    it("deve retornar false quando identificador não está na blacklist", async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.isBlacklisted("clean-ip", "IP");

      expect(result).toBe(false);
    });

    it("deve falhar de forma segura (fail-safe) em erro de Redis", async () => {
      mockRedisService.get.mockRejectedValue(new Error("Connection refused"));

      const result = await service.isBlacklisted("ip-xyz", "IP");

      // Fail-safe: não bloquear quando Redis cair
      expect(result).toBe(false);
    });
  });

  describe("addToWhitelist", () => {
    it("deve adicionar à whitelist de forma permanente por padrão", async () => {
      await service.addToWhitelist("192.168.0.1", "IP");

      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining("whitelist:ip:192.168.0.1"),
        "1",
      );
    });

    it("deve adicionar à whitelist com TTL quando não for permanente", async () => {
      await service.addToWhitelist("192.168.0.1", "IP", false, 3600);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining("whitelist:ip:"),
        "1",
        3600,
      );
    });

    it("deve lançar erro em caso de falha no Redis", async () => {
      mockRedisService.set.mockRejectedValue(new Error("Set failed"));

      await expect(service.addToWhitelist("ip", "IP")).rejects.toThrow("Set failed");
    });
  });

  describe("removeFromWhitelist", () => {
    it("deve remover da whitelist pelo identificador", async () => {
      await service.removeFromWhitelist("192.168.0.1", "IP");

      expect(mockRedisService.delete).toHaveBeenCalledWith(
        expect.stringContaining("whitelist:ip:192.168.0.1"),
      );
    });
  });

  describe("addToBlacklist", () => {
    it("deve adicionar à blacklist sem expiração por padrão", async () => {
      await service.addToBlacklist("10.0.0.1", "IP");

      expect(mockRedisService.set).toHaveBeenCalledTimes(2);
    });

    it("deve adicionar à blacklist com TTL quando duration fornecida", async () => {
      await service.addToBlacklist("10.0.0.1", "IP", { durationSeconds: 900 });

      const calls = mockRedisService.set.mock.calls as [string, unknown, number?][];
      const callWithTTL = calls.find((c) => c[2] === 900);
      expect(callWithTTL).toBeDefined();
    });

    it("deve salvar informações do entry na blacklist", async () => {
      await service.addToBlacklist("10.0.0.1", "IP", {
        reason: "Abuse detected",
        createdBy: "admin",
      });

      const calls = mockRedisService.set.mock.calls as [string, unknown][];
      const infoCall = calls.find(
        ([key]) => typeof key === "string" && key.includes("blacklist_info"),
      );
      expect(infoCall).toBeDefined();
      expect((infoCall![1] as { reason: string }).reason).toBe("Abuse detected");
    });
  });

  describe("removeFromBlacklist", () => {
    it("deve remover chave e infoKey da blacklist", async () => {
      await service.removeFromBlacklist("10.0.0.1", "IP");

      expect(mockRedisService.delete).toHaveBeenCalledTimes(2);
    });

    it("deve lançar erro em caso de falha", async () => {
      mockRedisService.delete.mockRejectedValue(new Error("Delete failed"));

      await expect(service.removeFromBlacklist("ip", "IP")).rejects.toThrow("Delete failed");
    });
  });

  describe("getBlacklistInfo", () => {
    it("deve retornar null quando entrada não existe", async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getBlacklistInfo("10.0.0.1", "IP");

      expect(result).toBeNull();
    });

    it("deve retornar entry quando existir", async () => {
      const entry = {
        identifier: "10.0.0.1",
        type: "IP" as BlacklistType,
        reason: "spam",
        createdAt: new Date(),
      };
      mockRedisService.get.mockResolvedValue(entry);

      const result = await service.getBlacklistInfo("10.0.0.1", "IP");

      expect(result).toEqual(entry);
    });

    it("deve retornar null em caso de erro", async () => {
      mockRedisService.get.mockRejectedValue(new Error("Redis failed"));

      const result = await service.getBlacklistInfo("ip", "IP");

      expect(result).toBeNull();
    });
  });

  describe("recordViolation", () => {
    it("deve incrementar contador de violações", async () => {
      mockRedisService.get.mockResolvedValue(2);

      const count = await service.recordViolation("10.0.0.1", "IP");

      expect(count).toBe(3);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        "violations:ip:10.0.0.1",
        3,
        expect.any(Number),
      );
    });

    it("deve iniciar contador em 1 quando não há violações prévias", async () => {
      mockRedisService.get.mockResolvedValue(null);

      const count = await service.recordViolation("new-ip", "IP");

      expect(count).toBe(1);
    });

    it("deve acionar auto-blacklist após 5 violações", async () => {
      mockRedisService.get.mockResolvedValue(4); // retorna 4, então newCount = 5

      const autoBlacklistSpy = jest.spyOn(service, "autoBlacklist").mockResolvedValue(undefined);

      const count = await service.recordViolation("abuser-ip", "IP");

      expect(count).toBe(5);
      expect(autoBlacklistSpy).toHaveBeenCalledWith("abuser-ip", "IP", 5);
    });

    it("deve retornar 0 em caso de erro", async () => {
      mockRedisService.get.mockRejectedValue(new Error("Redis failed"));

      const count = await service.recordViolation("ip", "IP");

      expect(count).toBe(0);
    });
  });

  describe("autoBlacklist", () => {
    it("deve bloquear por 15 minutos com 1 violação", async () => {
      const addSpy = jest.spyOn(service, "addToBlacklist").mockResolvedValue(undefined);

      await service.autoBlacklist("ip", "IP", 1);

      expect(addSpy).toHaveBeenCalledWith(
        "ip",
        "IP",
        expect.objectContaining({ durationSeconds: 900 }),
      );
    });

    it("deve bloquear por 1 hora com 5 à 9 violações", async () => {
      const addSpy = jest.spyOn(service, "addToBlacklist").mockResolvedValue(undefined);

      await service.autoBlacklist("ip", "IP", 5);

      expect(addSpy).toHaveBeenCalledWith(
        "ip",
        "IP",
        expect.objectContaining({ durationSeconds: 3600 }),
      );
    });

    it("deve bloquear por 4 horas com 10 à 19 violações", async () => {
      const addSpy = jest.spyOn(service, "addToBlacklist").mockResolvedValue(undefined);

      await service.autoBlacklist("ip", "IP", 10);

      expect(addSpy).toHaveBeenCalledWith(
        "ip",
        "IP",
        expect.objectContaining({ durationSeconds: 14400 }),
      );
    });

    it("deve bloquear por 24 horas com 20+ violações", async () => {
      const addSpy = jest.spyOn(service, "addToBlacklist").mockResolvedValue(undefined);

      await service.autoBlacklist("ip", "IP", 20);

      expect(addSpy).toHaveBeenCalledWith(
        "ip",
        "IP",
        expect.objectContaining({ durationSeconds: 86400 }),
      );
    });
  });

  describe("getRecentViolations", () => {
    it("deve retornar 0 quando não há violações", async () => {
      mockRedisService.get.mockResolvedValue(null);

      const count = await service.getRecentViolations("ip", "IP");

      expect(count).toBe(0);
    });

    it("deve retornar contador quando existir", async () => {
      mockRedisService.get.mockResolvedValue(7);

      const count = await service.getRecentViolations("ip", "IP");

      expect(count).toBe(7);
    });

    it("deve retornar 0 em caso de erro", async () => {
      mockRedisService.get.mockRejectedValue(new Error("Redis failed"));

      const count = await service.getRecentViolations("ip", "IP");

      expect(count).toBe(0);
    });
  });

  describe("clearViolations", () => {
    it("deve deletar chave de violações", async () => {
      await service.clearViolations("10.0.0.1", "IP");

      expect(mockRedisService.delete).toHaveBeenCalledWith("violations:ip:10.0.0.1");
    });

    it("não deve lançar erro em caso de falha", async () => {
      mockRedisService.delete.mockRejectedValue(new Error("Delete failed"));

      await expect(service.clearViolations("ip", "IP")).resolves.not.toThrow();
    });
  });
});
