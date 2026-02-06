import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import { Role } from "../enums/role.enum";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthUser, AuthenticatedRequest } from "../interfaces";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deve ser definido", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    it("deve permitir acesso quando não há roles requeridas", () => {
      const mockExecutionContext = createMockExecutionContext({});

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("deve permitir acesso quando array de roles está vazio", () => {
      const mockExecutionContext = createMockExecutionContext({});

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("deve negar acesso quando usuário não está presente", () => {
      const mockExecutionContext = createMockExecutionContext(null);

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it("deve negar acesso quando usuário não tem roles", () => {
      const mockExecutionContext = createMockExecutionContext({
        id: "user-123",
        email: "user@example.com",
        roles: undefined as any,
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it("deve negar acesso quando usuário tem array de roles vazio", () => {
      const mockExecutionContext = createMockExecutionContext({
        id: "user-123",
        email: "user@example.com",
        roles: [],
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it("deve permitir acesso quando usuário tem a role requerida", () => {
      const mockExecutionContext = createMockExecutionContext({
        id: "user-123",
        email: "admin@example.com",
        roles: [{ name: Role.ADMIN }],
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("deve permitir acesso quando usuário tem uma das roles requeridas", () => {
      const mockExecutionContext = createMockExecutionContext({
        id: "user-123",
        email: "user@example.com",
        roles: [{ name: Role.GESTOR }],
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([Role.ADMIN, Role.GESTOR, Role.MANAGER]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("deve negar acesso quando usuário não tem nenhuma das roles requeridas", () => {
      const mockExecutionContext = createMockExecutionContext({
        id: "user-123",
        email: "user@example.com",
        roles: [{ name: Role.DRIVER }],
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN, Role.MANAGER]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it("deve permitir acesso quando usuário tem múltiplas roles e uma delas é requerida", () => {
      const mockExecutionContext = createMockExecutionContext({
        id: "user-123",
        email: "user@example.com",
        roles: [{ name: Role.OPERATOR }, { name: Role.GESTOR }, { name: Role.DRIVER }],
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.GESTOR]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("deve verificar metadata em handler e classe", () => {
      const mockExecutionContext = createMockExecutionContext({
        id: "user-123",
        email: "user@example.com",
        roles: [{ name: Role.ADMIN }],
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);

      guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });
  });

  describe("casos edge", () => {
    it("deve lidar com roles como string comparando corretamente", () => {
      const mockExecutionContext = createMockExecutionContext({
        id: "user-123",
        email: "user@example.com",
        roles: [{ name: "admin" as Role }],
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("deve ser case-sensitive na comparação de roles", () => {
      const mockExecutionContext = createMockExecutionContext({
        id: "user-123",
        email: "user@example.com",
        roles: [{ name: "ADMIN" as Role }],
      });

      // O enum usa lowercase com underscores
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);

      const result = guard.canActivate(mockExecutionContext);

      // Não deve permitir se o case for diferente
      expect(result).toBe(false);
    });
  });
});

/**
 * Helper para criar um ExecutionContext mock com usuário
 */
function createMockExecutionContext(user: AuthUser | null | Record<string, any>): ExecutionContext {
  const mockHandler = jest.fn();
  const mockClass = jest.fn();

  const mockRequest: Partial<AuthenticatedRequest> = {
    user: user as AuthUser,
  };

  return {
    getHandler: () => mockHandler,
    getClass: () => mockClass,
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue({}),
    }),
    getType: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
  } as unknown as ExecutionContext;
}
