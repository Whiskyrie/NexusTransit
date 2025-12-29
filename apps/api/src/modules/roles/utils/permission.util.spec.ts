import {
  isValidPermissionFormat,
  parsePermission,
  expandWildcard,
  deduplicatePermissions,
  groupPermissionsByResource,
  hasPermissions,
  matchesAnyPermission,
  diffPermissions,
  intersectPermissions,
  unionPermissions,
  areAllPermissionsValid,
  filterValidPermissions,
  formatPermissionDisplay,
  getPermissionSpecificity,
  sortBySpecificity,
} from './permission.util';

describe('PermissionUtil', () => {
  describe('isValidPermissionFormat', () => {
    it('should return true for valid permission format', () => {
      expect(isValidPermissionFormat('users:read')).toBe(true);
      expect(isValidPermissionFormat('users:write:admin')).toBe(true);
    });

    it('should return false for invalid permission format', () => {
      expect(isValidPermissionFormat('users')).toBe(false);
      expect(isValidPermissionFormat('users:read:write:delete')).toBe(false);
      expect(isValidPermissionFormat('')).toBe(false);
      expect(isValidPermissionFormat(':read')).toBe(false);
      expect(isValidPermissionFormat('users:')).toBe(false);
    });
  });

  describe('parsePermission', () => {
    it('should parse simple permission', () => {
      const result = parsePermission('users:read');
      expect(result).toEqual({
        resource: 'users',
        action: 'read',
        subAction: undefined,
      });
    });

    it('should parse permission with sub-action', () => {
      const result = parsePermission('users:read:admin');
      expect(result).toEqual({
        resource: 'users',
        action: 'read',
        subAction: 'admin',
      });
    });

    it('should return null for invalid permission', () => {
      const result = parsePermission('invalid');
      expect(result).toBeNull();
    });
  });

  describe('expandWildcard', () => {
    it('should expand wildcard permission', () => {
      const availablePermissions = ['users:read', 'users:write', 'users:delete'];
      const result = expandWildcard('users:*', availablePermissions);
      expect(result).toEqual(['users:read', 'users:write', 'users:delete']);
    });

    it('should return empty array for non-wildcard', () => {
      const result = expandWildcard('users:read', ['users:read']);
      expect(result).toEqual([]);
    });

    it('should return empty array when no matches', () => {
      const result = expandWildcard('roles:*', ['users:read']);
      expect(result).toEqual([]);
    });
  });

  describe('deduplicatePermissions', () => {
    it('should remove duplicate permissions', () => {
      const permissions = ['users:read', 'users:write', 'users:read'];
      const result = deduplicatePermissions(permissions);
      expect(result).toEqual(['users:read', 'users:write']);
    });

    it('should preserve order', () => {
      const permissions = ['users:read', 'users:write', 'users:read', 'roles:read'];
      const result = deduplicatePermissions(permissions);
      expect(result).toEqual(['users:read', 'users:write', 'roles:read']);
    });

    it('should handle empty array', () => {
      const result = deduplicatePermissions([]);
      expect(result).toEqual([]);
    });
  });

  describe('groupPermissionsByResource', () => {
    it('should group permissions by resource', () => {
      const permissions = ['users:read', 'users:write', 'roles:read', 'roles:delete'];
      const result = groupPermissionsByResource(permissions);
      expect(result).toEqual({
        users: ['users:read', 'users:write'],
        roles: ['roles:read', 'roles:delete'],
      });
    });

    it('should handle empty array', () => {
      const result = groupPermissionsByResource([]);
      expect(result).toEqual({});
    });
  });

  describe('hasPermissions', () => {
    it('should return true when user has all required permissions', () => {
      const userPermissions = ['users:read', 'users:write', 'roles:read'];
      const required = ['users:read', 'users:write'];
      const result = hasPermissions(userPermissions, required);
      expect(result).toBe(true);
    });

    it('should return false when user lacks required permissions', () => {
      const userPermissions = ['users:read'];
      const required = ['users:read', 'users:write'];
      const result = hasPermissions(userPermissions, required);
      expect(result).toBe(false);
    });

    it('should support wildcard in user permissions', () => {
      const userPermissions = ['users:*'];
      const required = ['users:read', 'users:write'];
      const result = hasPermissions(userPermissions, required);
      expect(result).toBe(true);
    });

    it('should support wildcard in required permissions', () => {
      const userPermissions = ['users:read', 'users:write'];
      const required = ['users:*'];
      const result = hasPermissions(userPermissions, required);
      expect(result).toBe(true);
    });
  });

  describe('matchesAnyPermission', () => {
    it('should return true when user has at least one required permission', () => {
      const userPermissions = ['users:read'];
      const required = ['users:read', 'users:write'];
      const result = matchesAnyPermission(userPermissions, required);
      expect(result).toBe(true);
    });

    it('should return false when user has none of the required permissions', () => {
      const userPermissions = ['users:read'];
      const required = ['roles:read', 'roles:write'];
      const result = matchesAnyPermission(userPermissions, required);
      expect(result).toBe(false);
    });
  });

  describe('diffPermissions', () => {
    it('should return permissions to add and remove', () => {
      const current = ['users:read', 'users:write'];
      const target = ['users:read', 'users:delete'];
      const result = diffPermissions(current, target);
      expect(result).toEqual({
        toAdd: ['users:delete'],
        toRemove: ['users:write'],
      });
    });

    it('should return empty arrays when permissions are equal', () => {
      const current = ['users:read', 'users:write'];
      const target = ['users:read', 'users:write'];
      const result = diffPermissions(current, target);
      expect(result).toEqual({
        toAdd: [],
        toRemove: [],
      });
    });
  });

  describe('intersectPermissions', () => {
    it('should return common permissions', () => {
      const permissions1 = ['users:read', 'users:write', 'roles:read'];
      const permissions2 = ['users:read', 'users:delete', 'roles:read'];
      const result = intersectPermissions(permissions1, permissions2);
      expect(result).toEqual(['users:read', 'roles:read']);
    });

    it('should return empty array when no common permissions', () => {
      const permissions1 = ['users:read'];
      const permissions2 = ['roles:read'];
      const result = intersectPermissions(permissions1, permissions2);
      expect(result).toEqual([]);
    });
  });

  describe('unionPermissions', () => {
    it('should return all unique permissions', () => {
      const permissions1 = ['users:read', 'users:write'];
      const permissions2 = ['users:read', 'users:delete', 'roles:read'];
      const result = unionPermissions(permissions1, permissions2);
      expect(result).toEqual(['users:read', 'users:write', 'users:delete', 'roles:read']);
    });
  });

  describe('areAllPermissionsValid', () => {
    it('should return true when all permissions are valid', () => {
      const permissions = ['users:read', 'users:write', 'roles:delete'];
      const validPermissions = ['users:read', 'users:write', 'roles:delete'];
      const result = areAllPermissionsValid(permissions, validPermissions);
      expect(result).toBe(true);
    });

    it('should return false when some permissions are invalid', () => {
      const permissions = ['users:read', 'invalid:permission'];
      const validPermissions = ['users:read', 'users:write'];
      const result = areAllPermissionsValid(permissions, validPermissions);
      expect(result).toBe(false);
    });

    it('should support wildcards in valid permissions', () => {
      const permissions = ['users:read', 'users:write'];
      const validPermissions = ['users:*'];
      const result = areAllPermissionsValid(permissions, validPermissions);
      expect(result).toBe(true);
    });
  });

  describe('filterValidPermissions', () => {
    it('should filter out invalid permissions', () => {
      const permissions = ['users:read', 'invalid:permission', 'users:write'];
      const validPermissions = ['users:read', 'users:write', 'roles:delete'];
      const result = filterValidPermissions(permissions, validPermissions);
      expect(result).toEqual(['users:read', 'users:write']);
    });

    it('should support wildcards in valid permissions', () => {
      const permissions = ['users:read', 'users:write', 'roles:read'];
      const validPermissions = ['users:*'];
      const result = filterValidPermissions(permissions, validPermissions);
      expect(result).toEqual(['users:read', 'users:write']);
    });
  });

  describe('formatPermissionDisplay', () => {
    it('should format permission for display', () => {
      const result = formatPermissionDisplay('users:read');
      expect(result).toBe('Read Users');
    });

    it('should handle unknown actions', () => {
      const result = formatPermissionDisplay('users:custom');
      expect(result).toBe('Custom Users');
    });
  });

  describe('getPermissionSpecificity', () => {
    it('should return higher specificity for specific permissions', () => {
      const specific = getPermissionSpecificity('users:read');
      const wildcard = getPermissionSpecificity('users:*');
      expect(specific).toBeGreaterThan(wildcard);
    });

    it('should return 0 for wildcard', () => {
      const result = getPermissionSpecificity('users:*');
      expect(result).toBe(0);
    });

    it('should return 1 for simple permission', () => {
      const result = getPermissionSpecificity('users:read');
      expect(result).toBe(1);
    });

    it('should return 2 for permission with sub-action', () => {
      const result = getPermissionSpecificity('users:read:admin');
      expect(result).toBe(2);
    });
  });

  describe('sortBySpecificity', () => {
    it('should sort permissions by specificity (descending)', () => {
      const permissions = ['users:*', 'users:read', 'users:read:admin'];
      const result = sortBySpecificity(permissions);
      expect(result).toEqual(['users:read:admin', 'users:read', 'users:*']);
    });

    it('should handle empty array', () => {
      const result = sortBySpecificity([]);
      expect(result).toEqual([]);
    });
  });
});
