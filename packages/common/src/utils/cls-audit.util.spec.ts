import { Test, TestingModule } from "@nestjs/testing";
import { ClsService } from "nestjs-cls";
import { ClsAuditUtils } from "./cls-audit.util";
import type { AuditContext } from "../interfaces/audit.interface";

describe("ClsAuditUtils", () => {
  let utils: ClsAuditUtils;
  let clsService: jest.Mocked<ClsService>;

  beforeEach(async () => {
    const mockClsService = {
      get: jest.fn(),
      set: jest.fn(),
      getId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClsAuditUtils,
        {
          provide: ClsService,
          useValue: mockClsService,
        },
      ],
    }).compile();

    utils = module.get<ClsAuditUtils>(ClsAuditUtils);
    clsService = module.get(ClsService) as jest.Mocked<ClsService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAuditContext", () => {
    it("deve retornar contexto completo de auditoria", () => {
      const mockContext: AuditContext = {
        requestId: "req-123",
        userId: "user-456",
        userEmail: "user@example.com",
        userRole: "ADMIN",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        timestamp: new Date("2025-01-15T10:00:00"),
        path: "/api/routes",
        method: "POST",
      };

      clsService.get.mockImplementation((key?: string | symbol) => {
        const map = mockContext as unknown as Record<string, unknown>;
        return map[key as string];
      });

      const context = utils.getAuditContext();

      expect(context).toEqual(mockContext);
      expect(clsService.get).toHaveBeenCalledWith("requestId");
    });

    it("deve retornar undefined quando não há requestId", () => {
      clsService.get.mockReturnValue(undefined);

      const context = utils.getAuditContext();

      expect(context).toBeUndefined();
    });

    it("deve usar valores padrão para timestamp e path", () => {
      clsService.get.mockImplementation((key?: string | symbol) => {
        if (key === "requestId") return "req-123";
        if (key === "method") return "GET";
        return undefined;
      });

      const context = utils.getAuditContext();

      expect(context).toBeDefined();
      expect(context?.timestamp).toBeInstanceOf(Date);
      expect(context?.path).toBe("");
      expect(context?.method).toBe("GET");
    });
  });

  describe("setAuditContext", () => {
    it("deve definir contexto completo no CLS", () => {
      const context: Partial<AuditContext> = {
        requestId: "req-123",
        userId: "user-456",
        userEmail: "user@example.com",
        userRole: "ADMIN",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        timestamp: new Date("2025-01-15T10:00:00"),
        path: "/api/routes",
        method: "POST",
      };

      utils.setAuditContext(context);

      expect(clsService.set).toHaveBeenCalledWith("requestId", context.requestId);
      expect(clsService.set).toHaveBeenCalledWith("userId", context.userId);
      expect(clsService.set).toHaveBeenCalledWith("userEmail", context.userEmail);
      expect(clsService.set).toHaveBeenCalledWith("userRole", context.userRole);
      expect(clsService.set).toHaveBeenCalledWith("ipAddress", context.ipAddress);
      expect(clsService.set).toHaveBeenCalledWith("userAgent", context.userAgent);
      expect(clsService.set).toHaveBeenCalledWith("timestamp", context.timestamp);
      expect(clsService.set).toHaveBeenCalledWith("path", context.path);
      expect(clsService.set).toHaveBeenCalledWith("method", context.method);
    });

    it("deve definir apenas campos fornecidos", () => {
      const context: Partial<AuditContext> = {
        requestId: "req-123",
        userId: "user-456",
      };

      utils.setAuditContext(context);

      expect(clsService.set).toHaveBeenCalledWith("requestId", "req-123");
      expect(clsService.set).toHaveBeenCalledWith("userId", "user-456");
      expect(clsService.set).toHaveBeenCalledTimes(2);
    });

    it("deve lidar com contexto vazio", () => {
      utils.setAuditContext({});

      expect(clsService.set).not.toHaveBeenCalled();
    });
  });

  describe("getCurrentUser", () => {
    it("deve retornar informações do usuário atual", () => {
      clsService.get.mockImplementation((key?: string | symbol) => {
        const map: Record<string, string> = {
          userId: "user-456",
          userEmail: "user@example.com",
          userRole: "ADMIN",
        };
        return map[key as string];
      });

      const user = utils.getCurrentUser();

      expect(user).toEqual({
        id: "user-456",
        email: "user@example.com",
        role: "ADMIN",
      });
    });

    it("deve retornar undefined quando não há userId", () => {
      clsService.get.mockReturnValue(undefined);

      const user = utils.getCurrentUser();

      expect(user).toBeUndefined();
    });
  });

  describe("getRequestId", () => {
    it("deve retornar requestId do CLS", () => {
      clsService.get.mockReturnValue("req-123");

      const requestId = utils.getRequestId();

      expect(requestId).toBe("req-123");
      expect(clsService.get).toHaveBeenCalledWith("requestId");
    });

    it("deve retornar undefined quando não há requestId", () => {
      clsService.get.mockReturnValue(undefined);

      const requestId = utils.getRequestId();

      expect(requestId).toBeUndefined();
    });
  });

  describe("getUserId", () => {
    it("deve retornar userId do CLS", () => {
      clsService.get.mockReturnValue("user-456");

      const userId = utils.getUserId();

      expect(userId).toBe("user-456");
      expect(clsService.get).toHaveBeenCalledWith("userId");
    });
  });

  describe("getUserEmail", () => {
    it("deve retornar userEmail do CLS", () => {
      clsService.get.mockReturnValue("user@example.com");

      const email = utils.getUserEmail();

      expect(email).toBe("user@example.com");
      expect(clsService.get).toHaveBeenCalledWith("userEmail");
    });
  });

  describe("getIpAddress", () => {
    it("deve retornar ipAddress do CLS", () => {
      clsService.get.mockReturnValue("192.168.1.1");

      const ip = utils.getIpAddress();

      expect(ip).toBe("192.168.1.1");
      expect(clsService.get).toHaveBeenCalledWith("ipAddress");
    });
  });

  describe("isContextActive", () => {
    it("deve retornar true quando há contexto ativo", () => {
      clsService.getId.mockReturnValue("cls-id-123");

      const isActive = utils.isContextActive();

      expect(isActive).toBe(true);
    });

    it("deve retornar false quando não há contexto ativo", () => {
      clsService.getId.mockReturnValue(undefined as unknown as string);

      const isActive = utils.isContextActive();

      expect(isActive).toBe(false);
    });
  });
});
