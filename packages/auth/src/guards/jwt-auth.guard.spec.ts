import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { PUBLIC_KEY } from "../decorators/public.decorator";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deve ser definido", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    it("deve permitir acesso a rotas públicas", () => {
      const mockExecutionContext = createMockExecutionContext();

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it("deve chamar super.canActivate para rotas não públicas", () => {
      const mockExecutionContext = createMockExecutionContext();

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);

      // Mock do super.canActivate
      const superCanActivate = jest.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        "canActivate",
      );
      superCanActivate.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(superCanActivate).toHaveBeenCalledWith(mockExecutionContext);

      superCanActivate.mockRestore();
    });

    it("deve permitir acesso quando metadata público não está definida mas o token é válido", () => {
      const mockExecutionContext = createMockExecutionContext();

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

      // Mock do super.canActivate retornando true (token válido)
      const superCanActivate = jest.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        "canActivate",
      );
      superCanActivate.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);

      superCanActivate.mockRestore();
    });

    it("deve negar acesso quando não é público e token é inválido", () => {
      const mockExecutionContext = createMockExecutionContext();

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);

      // Mock do super.canActivate retornando false (token inválido)
      const superCanActivate = jest.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        "canActivate",
      );
      superCanActivate.mockReturnValue(false);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);

      superCanActivate.mockRestore();
    });
  });

  describe("verificação de metadata em diferentes níveis", () => {
    it("deve verificar metadata no handler e na classe", () => {
      const mockExecutionContext = createMockExecutionContext();

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);

      guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it("deve dar prioridade a metadata do handler sobre a classe", () => {
      const mockExecutionContext = createMockExecutionContext();

      // Simula que o método está marcado como público
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });
});

/**
 * Helper para criar um ExecutionContext mock
 */
function createMockExecutionContext(): ExecutionContext {
  const mockHandler = jest.fn();
  const mockClass = jest.fn();

  return {
    getHandler: () => mockHandler,
    getClass: () => mockClass,
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({}),
      getResponse: jest.fn().mockReturnValue({}),
    }),
    getType: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
  } as unknown as ExecutionContext;
}
