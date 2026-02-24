import { Test, TestingModule } from "@nestjs/testing";
import { RedisService } from "./redis.service";

describe("RedisService", () => {
  let service: RedisService;

  const mockRedisClient = { quit: jest.fn() };

  const createMockKeyv = (storeOverride?: unknown) => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    opts: {
      store: storeOverride !== undefined ? storeOverride : { redis: mockRedisClient },
    },
  });

  async function buildService(mockKeyv: ReturnType<typeof createMockKeyv>) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: "KEYV_INSTANCE",
          useValue: mockKeyv,
        },
      ],
    }).compile();

    return module.get<RedisService>(RedisService);
  }

  describe("construtor / extractRedisClient", () => {
    it("deve extrair o redis client quando disponível na store", async () => {
      const mockKeyv = createMockKeyv({ redis: mockRedisClient });
      service = await buildService(mockKeyv);

      expect(service.getRedisClient()).toBe(mockRedisClient);
    });

    it("deve retornar null quando a store não possui redis client", async () => {
      const mockKeyv = createMockKeyv(null);
      service = await buildService(mockKeyv);

      expect(service.getRedisClient()).toBeNull();
    });

    it("deve retornar null quando a store está undefined", async () => {
      const mockKeyv = createMockKeyv(undefined);
      // Sobrescreve com store sem redis
      (mockKeyv as unknown as { opts: { store: unknown } }).opts.store = { other: true };
      service = await buildService(mockKeyv);

      expect(service.getRedisClient()).toBeNull();
    });

    it("deve capturar erros ao acessar a store sem propagar exceção", async () => {
      const mockKeyv = createMockKeyv();
      Object.defineProperty(mockKeyv.opts, "store", {
        get() {
          throw new Error("Store access error");
        },
      });
      service = await buildService(mockKeyv);

      expect(service.getRedisClient()).toBeNull();
    });
  });

  describe("get", () => {
    beforeEach(async () => {
      service = await buildService(createMockKeyv());
    });

    it("deve retornar o valor armazenado para a chave", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.get.mockResolvedValue({ data: "cached-value" });
      service = await buildService(mockKeyv);

      const result = await service.get("test-key");

      expect(mockKeyv.get).toHaveBeenCalledWith("test-key");
      expect(result).toEqual({ data: "cached-value" });
    });

    it("deve retornar undefined quando a chave não existe", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.get.mockResolvedValue(undefined);
      service = await buildService(mockKeyv);

      const result = await service.get("nonexistent-key");

      expect(mockKeyv.get).toHaveBeenCalledWith("nonexistent-key");
      expect(result).toBeUndefined();
    });

    it("deve propagar erros do keyv.get", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.get.mockRejectedValue(new Error("Redis error"));
      service = await buildService(mockKeyv);

      await expect(service.get("error-key")).rejects.toThrow("Redis error");
    });
  });

  describe("set", () => {
    it("deve armazenar valor sem TTL", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.set.mockResolvedValue(true);
      service = await buildService(mockKeyv);

      const result = await service.set("key", "value");

      expect(mockKeyv.set).toHaveBeenCalledWith("key", "value", undefined);
      expect(result).toBe(true);
    });

    it("deve armazenar valor com TTL", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.set.mockResolvedValue(true);
      service = await buildService(mockKeyv);

      const result = await service.set("key", "value", 3600);

      expect(mockKeyv.set).toHaveBeenCalledWith("key", "value", 3600);
      expect(result).toBe(true);
    });

    it("deve aceitar objetos como valor", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.set.mockResolvedValue(true);
      service = await buildService(mockKeyv);

      const payload = { id: 1, name: "test" };
      await service.set("object-key", payload);

      expect(mockKeyv.set).toHaveBeenCalledWith("object-key", payload, undefined);
    });

    it("deve propagar erros do keyv.set", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.set.mockRejectedValue(new Error("Set error"));
      service = await buildService(mockKeyv);

      await expect(service.set("key", "value")).rejects.toThrow("Set error");
    });
  });

  describe("delete", () => {
    it("deve remover uma chave existente e retornar true", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.delete.mockResolvedValue(true);
      service = await buildService(mockKeyv);

      const result = await service.delete("key-to-delete");

      expect(mockKeyv.delete).toHaveBeenCalledWith("key-to-delete");
      expect(result).toBe(true);
    });

    it("deve retornar false ao tentar remover chave inexistente", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.delete.mockResolvedValue(false);
      service = await buildService(mockKeyv);

      const result = await service.delete("nonexistent-key");

      expect(result).toBe(false);
    });

    it("deve propagar erros do keyv.delete", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.delete.mockRejectedValue(new Error("Delete error"));
      service = await buildService(mockKeyv);

      await expect(service.delete("key")).rejects.toThrow("Delete error");
    });
  });

  describe("has", () => {
    it("deve retornar true quando a chave existe no cache", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.get.mockResolvedValue("some-value");
      service = await buildService(mockKeyv);

      const result = await service.has("existing-key");

      expect(mockKeyv.get).toHaveBeenCalledWith("existing-key");
      expect(result).toBe(true);
    });

    it("deve retornar false quando a chave não existe no cache", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.get.mockResolvedValue(undefined);
      service = await buildService(mockKeyv);

      const result = await service.has("missing-key");

      expect(mockKeyv.get).toHaveBeenCalledWith("missing-key");
      expect(result).toBe(false);
    });

    it("deve retornar true para valores falsy não-undefined (ex: false, 0, null)", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.get.mockResolvedValue(null);
      service = await buildService(mockKeyv);

      const result = await service.has("null-key");

      // null !== undefined, portanto has() retorna true
      expect(result).toBe(true);
    });
  });

  describe("clear", () => {
    it("deve limpar todas as chaves do cache", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.clear.mockResolvedValue(undefined);
      service = await buildService(mockKeyv);

      await service.clear();

      expect(mockKeyv.clear).toHaveBeenCalledTimes(1);
    });

    it("deve propagar erros do keyv.clear", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.clear.mockRejectedValue(new Error("Clear error"));
      service = await buildService(mockKeyv);

      await expect(service.clear()).rejects.toThrow("Clear error");
    });
  });

  describe("getRedisClient", () => {
    it("deve retornar o redis client nativo quando extraído com sucesso", async () => {
      const mockKeyv = createMockKeyv({ redis: mockRedisClient });
      service = await buildService(mockKeyv);

      expect(service.getRedisClient()).toBe(mockRedisClient);
    });

    it("deve retornar null quando o redis client não foi extraído", async () => {
      const mockKeyv = createMockKeyv(null);
      service = await buildService(mockKeyv);

      expect(service.getRedisClient()).toBeNull();
    });
  });

  describe("onModuleDestroy", () => {
    it("deve desconectar o keyv ao destruir o módulo", async () => {
      const mockKeyv = createMockKeyv();
      service = await buildService(mockKeyv);

      await service.onModuleDestroy();

      expect(mockKeyv.disconnect).toHaveBeenCalledTimes(1);
    });

    it("deve propagar erros ao desconectar", async () => {
      const mockKeyv = createMockKeyv();
      mockKeyv.disconnect.mockRejectedValue(new Error("Disconnect error"));
      service = await buildService(mockKeyv);

      await expect(service.onModuleDestroy()).rejects.toThrow("Disconnect error");
    });
  });
});
