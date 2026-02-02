import { type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import {
  PERMISSIONS_KEY,
  PERMISSION_MODE_KEY,
  PermissionMode,
} from '../decorators/permissions.decorator';
import { InsufficientPermissionsException } from '../exceptions';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: '123',
      permissions: ['users.read', 'users.write', 'roles.read'],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    guard = new PermissionsGuard(mockReflector as unknown as Reflector);
  });

  describe('canActivate', () => {
    it('should allow access when no permissions are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has all required permissions (AND mode)', () => {
      mockReflector.getAllAndOverride.mockImplementation(key => {
        if (key === PERMISSIONS_KEY) {
          return ['users.read', 'users.write'];
        }
        if (key === PERMISSION_MODE_KEY) {
          return PermissionMode.AND;
        }
        return undefined;
      });

      mockExecutionContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
      });

      const result = guard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has at least one required permission (OR mode)', () => {
      mockReflector.getAllAndOverride.mockImplementation(key => {
        if (key === PERMISSIONS_KEY) {
          return ['users.read', 'admin.*'];
        }
        if (key === PERMISSION_MODE_KEY) {
          return PermissionMode.OR;
        }
        return undefined;
      });

      mockExecutionContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
      });

      const result = guard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny access when user lacks required permissions (AND mode)', () => {
      mockReflector.getAllAndOverride.mockImplementation(key => {
        if (key === PERMISSIONS_KEY) {
          return ['users.read', 'admin.*'];
        }
        if (key === PERMISSION_MODE_KEY) {
          return PermissionMode.AND;
        }
        return undefined;
      });

      mockExecutionContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
      });

      expect(() => guard.canActivate(mockExecutionContext as unknown as ExecutionContext)).toThrow(
        InsufficientPermissionsException,
      );
    });

    it('should deny access when user lacks all required permissions (OR mode)', () => {
      mockReflector.getAllAndOverride.mockImplementation(key => {
        if (key === PERMISSIONS_KEY) {
          return ['admin.*', 'super.*'];
        }
        if (key === PERMISSION_MODE_KEY) {
          return PermissionMode.OR;
        }
        return undefined;
      });

      mockExecutionContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
      });

      expect(() => guard.canActivate(mockExecutionContext as unknown as ExecutionContext)).toThrow(
        InsufficientPermissionsException,
      );
    });

    it('should support wildcard permissions', () => {
      mockReflector.getAllAndOverride.mockImplementation(key => {
        if (key === PERMISSIONS_KEY) {
          return ['users.*'];
        }
        if (key === PERMISSION_MODE_KEY) {
          return PermissionMode.AND;
        }
        return undefined;
      });

      mockExecutionContext.switchToHttp.mockReturnValue({
        getRequest: () => mockRequest,
      });

      const result = guard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny access when user is not authenticated', () => {
      mockReflector.getAllAndOverride.mockImplementation(key => {
        if (key === PERMISSIONS_KEY) {
          return ['users.read'];
        }
        if (key === PERMISSION_MODE_KEY) {
          return PermissionMode.AND;
        }
        return undefined;
      });

      mockExecutionContext.switchToHttp.mockReturnValue({
        getRequest: () => ({ user: null }),
      });

      const result = guard.canActivate(mockExecutionContext as unknown as ExecutionContext);

      expect(result).toBe(false);
    });

    it('should handle empty user permissions array', () => {
      mockReflector.getAllAndOverride.mockImplementation(key => {
        if (key === PERMISSIONS_KEY) {
          return ['users.read'];
        }
        if (key === PERMISSION_MODE_KEY) {
          return PermissionMode.AND;
        }
        return undefined;
      });

      mockExecutionContext.switchToHttp.mockReturnValue({
        getRequest: () => ({ user: { id: '123', permissions: [] } }),
      });

      expect(() => guard.canActivate(mockExecutionContext as unknown as ExecutionContext)).toThrow(
        InsufficientPermissionsException,
      );
    });

    it('should handle undefined user permissions', () => {
      mockReflector.getAllAndOverride.mockImplementation(key => {
        if (key === PERMISSIONS_KEY) {
          return ['users.read'];
        }
        if (key === PERMISSION_MODE_KEY) {
          return PermissionMode.AND;
        }
        return undefined;
      });

      mockExecutionContext.switchToHttp.mockReturnValue({
        getRequest: () => ({ user: { id: '123' } }),
      });

      expect(() => guard.canActivate(mockExecutionContext as unknown as ExecutionContext)).toThrow(
        InsufficientPermissionsException,
      );
    });
  });

  describe('hasPermission', () => {
    it('should return true for exact permission match', () => {
      const result = (guard as any).matchesPermission(['users.read'], 'users.read');
      expect(result).toBe(true);
    });

    it('should return true for wildcard match', () => {
      const result = (guard as any).matchesPermission(['users.*'], 'users.read');
      expect(result).toBe(true);
    });

    it('should return false for no match', () => {
      const result = (guard as any).matchesPermission(['roles.read'], 'users.read');
      expect(result).toBe(false);
    });

    it('should handle complex wildcard patterns', () => {
      const result = (guard as any).matchesPermission(['users.*'], 'users.read:admin');
      expect(result).toBe(true);
    });
  });
});
