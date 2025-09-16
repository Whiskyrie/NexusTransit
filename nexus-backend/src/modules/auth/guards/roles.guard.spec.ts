import { Test, type TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    const mockContext = createMockExecutionContext({});
    reflector.getAllAndOverride.mockReturnValue(null);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      mockContext.getHandler(),
      mockContext.getClass(),
    ]);
  });

  it('should deny access when user is not authenticated', () => {
    const mockContext = createMockExecutionContext({});
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it('should deny access when user has no roles', () => {
    const mockContext = createMockExecutionContext({
      user: { id: 'user-123', email: 'test@example.com' },
    });
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it('should allow access when user has required role', () => {
    const mockContext = createMockExecutionContext({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        roles: [{ id: 'role-1', name: Role.ADMIN, permissions: [] }],
      },
    });
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should allow access when user has one of multiple required roles', () => {
    const mockContext = createMockExecutionContext({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        roles: [{ id: 'role-1', name: Role.CLIENTE, permissions: [] }],
      },
    });
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.CLIENTE]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    const mockContext = createMockExecutionContext({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        roles: [{ id: 'role-1', name: Role.CLIENTE, permissions: [] }],
      },
    });
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it('should allow access when user has multiple roles and one matches', () => {
    const mockContext = createMockExecutionContext({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        roles: [
          { id: 'role-1', name: Role.CLIENTE, permissions: [] },
          { id: 'role-2', name: Role.MOTORISTA, permissions: [] },
        ],
      },
    });
    reflector.getAllAndOverride.mockReturnValue([Role.MOTORISTA]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });
});

function createMockExecutionContext(requestData: Partial<AuthenticatedRequest>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => requestData,
      getResponse: () => ({}),
      getNext: () => jest.fn(),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    getArgs: () => [],
    getArgByIndex: () => ({}),
    switchToRpc: () => ({
      getContext: () => ({}),
      getData: () => ({}),
    }),
    switchToWs: () => ({
      getClient: () => ({}),
      getData: () => ({}),
    }),
    getType: () => 'http' as const,
  };
}
