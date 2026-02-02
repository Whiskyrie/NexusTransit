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
      expect(isValidPermissionFormat('users.read')).toBe(true);
      expect(isValidPermissionFormat('users.write.admin')).toBe(true);
    });

    it('should return false for invalid permission format', () => {
      expect(isValidPermissionFormat('users')).toBe(false);
      expect(isValidPermissionFormat('')).toBe(false);
      expect(isValidPermissionFormat('.read')).toBe(false);
    });
  });

  describe('parsePermission', () => {
    it('should parse simple permission', () => {
      const result = parsePermission('users.read');
      expect(result).toEqual({
        resource: 'users',
        action: 'read',
      });
    });

    it('should parse permission with sub-action', () => {
      const result = parsePermission('users.profile.update');
      expect(result).toEqual({
        resource: 'users.profile',
        action: 'update',
      });
    });

    it('should return null for invalid permission', () => {
      const result = parsePermission('invalid');
      expect(result).toBeNull();
    });
  });

  describe('expandWildcard', () => {
    it('should expand wildcard permission', () => {
      const availablePermissions = ['users.read', 'users.write', 'users.delete'];
      const result = expandWildcard('users.*', availablePermissions);
      expect(result).toEqual(['users.read', 'users.write', 'users.delete']);
    });

    it('should return the same permission for non-wildcard', () => {
      const result = expandWildcard('users.read', ['users.read']);
      expect(result).toEqual(['users.read']);
    });

    it('should return empty array when no matches', () => {
      const result = expandWildcard('roles.*', ['users.read']);
      expect(result).toEqual([]);
    });
  });

  describe('deduplicatePermissions', () => {
    it('should remove duplicate permissions', () => {
      const permissions = ['users.read', 'users.write', 'users.read'];
      const result = deduplicatePermissions(permissions);
      expect(result).toEqual(['users.read', 'users.write']);
    });

    it('should preserve order', () => {
      const permissions = ['users.read', 'users.write', 'users.read', 'roles.read'];
      const result = deduplicatePermissions(permissions);
      expect(result).toEqual(['users.read', 'users.write', 'roles.read']);
    });

    it('should handle empty array', () => {
      const result = deduplicatePermissions([]);
      expect(result).toEqual([]);
    });
  });

  describe('groupPermissionsByResource', () => {
    it('should group permissions by resource', () => {
      const permissions = ['users.read', 'users.write', 'roles.read', 'roles.delete'];
      const result = groupPermissionsByResource(permissions);
      expect(result).toEqual({
        users: ['read', 'write'],
        roles: ['read', 'delete'],
      });
    });

    it('should handle empty array', () => {
      const result = groupPermissionsByResource([]);
      expect(result).toEqual({});
    });
  });

  describe('hasPermissions', () => {
    it('should return true when user has all required permissions', () => {
      const userPermissions = ['users.read', 'users.write', 'roles.read'];
      const required = ['users.read', 'users.write'];
      const result = hasPermissions(userPermissions, required);
      expect(result).toBe(true);
    });

    it('should return false when user lacks required permissions', () => {
      const userPermissions = ['users.read'];
      const required = ['users.read', 'users.write'];
      const result = hasPermissions(userPermissions, required);
      expect(result).toBe(false);
    });

    it('should support wildcard in user permissions', () => {
      const userPermissions = ['users.*'];
      const required = ['users.read', 'users.write'];
      const result = hasPermissions(userPermissions, required);
      expect(result).toBe(true);
    });

    it('should support wildcard in required permissions', () => {
      const userPermissions = ['users.read', 'users.write'];
      const required = ['users.*'];
      const result = hasPermissions(userPermissions, required);
      expect(result).toBe(true);
    });
  });

  describe('matchesAnyPermission', () => {
    it('should return true when user has at least one required permission', () => {
      const userPermissions = ['users.read'];
      const result = matchesAnyPermission(userPermissions, 'users.read');
      expect(result).toBe(true);
    });

    it('should return false when user has none of the required permissions', () => {
      const userPermissions = ['users.read'];
      const result = matchesAnyPermission(userPermissions, 'roles.read');
      expect(result).toBe(false);
    });

    it('should match with user wildcard permission', () => {
      const userPermissions = ['users.*'];
      const result = matchesAnyPermission(userPermissions, 'users.read');
      expect(result).toBe(true);
    });

    it('should match with required wildcard permission', () => {
      const userPermissions = ['users.read', 'users.write'];
      const result = matchesAnyPermission(userPermissions, 'users.*');
      expect(result).toBe(true);
    });
  });

  describe('diffPermissions', () => {
    it('should return permissions in A but not in B', () => {
      const current = ['users.read', 'users.write'];
      const target = ['users.read', 'users.delete'];
      const result = diffPermissions(current, target);
      expect(result).toEqual(['users.write']);
    });

    it('should return empty array when all permissions are in both sets', () => {
      const current = ['users.read', 'users.write'];
      const target = ['users.read', 'users.write'];
      const result = diffPermissions(current, target);
      expect(result).toEqual([]);
    });
  });

  describe('intersectPermissions', () => {
    it('should return common permissions', () => {
      const permissions1 = ['users.read', 'users.write', 'roles.read'];
      const permissions2 = ['users.read', 'users.delete', 'roles.read'];
      const result = intersectPermissions(permissions1, permissions2);
      expect(result).toEqual(['users.read', 'roles.read']);
    });

    it('should return empty array when no common permissions', () => {
      const permissions1 = ['users.read'];
      const permissions2 = ['roles.read'];
      const result = intersectPermissions(permissions1, permissions2);
      expect(result).toEqual([]);
    });
  });

  describe('unionPermissions', () => {
    it('should return all unique permissions', () => {
      const permissions1 = ['users.read', 'users.write'];
      const permissions2 = ['users.read', 'users.delete', 'roles.read'];
      const result = unionPermissions(permissions1, permissions2);
      expect(result).toEqual(['users.read', 'users.write', 'users.delete', 'roles.read']);
    });
  });

  describe('areAllPermissionsValid', () => {
    it('should return true when all permissions have valid format', () => {
      const permissions = ['users.read', 'users.write', 'roles.delete'];
      const result = areAllPermissionsValid(permissions);
      expect(result).toBe(true);
    });

    it('should return false when some permissions have invalid format', () => {
      const permissions = ['users.read', 'invalid'];
      const result = areAllPermissionsValid(permissions);
      expect(result).toBe(false);
    });

    it('should return true for permissions with sub-actions', () => {
      const permissions = ['users.read', 'users.write.admin'];
      const result = areAllPermissionsValid(permissions);
      expect(result).toBe(true);
    });

    it('should return true for empty array', () => {
      const result = areAllPermissionsValid([]);
      expect(result).toBe(true);
    });
  });

  describe('filterValidPermissions', () => {
    it('should filter out invalid permissions', () => {
      const permissions = ['users.read', 'invalid', 'users.write'];
      const result = filterValidPermissions(permissions);
      expect(result).toEqual(['users.read', 'users.write']);
    });

    it('should keep all valid permissions including wildcards', () => {
      const permissions = ['users.read', 'users.write', 'roles.*'];
      const result = filterValidPermissions(permissions);
      expect(result).toEqual(['users.read', 'users.write', 'roles.*']);
    });
  });

  describe('formatPermissionDisplay', () => {
    it('should format permission for display', () => {
      const result = formatPermissionDisplay('users.read');
      expect(result).toBe('Users: Read');
    });

    it('should handle unknown actions', () => {
      const result = formatPermissionDisplay('users.custom');
      expect(result).toBe('Users: Custom');
    });

    it('should handle underscores and hyphens', () => {
      const result = formatPermissionDisplay('service_orders.create');
      expect(result).toBe('Service Orders: Create');
    });
  });

  describe('getPermissionSpecificity', () => {
    it('should return higher specificity for specific permissions', () => {
      const specific = getPermissionSpecificity('users.read');
      const wildcard = getPermissionSpecificity('users.*');
      expect(specific).toBeGreaterThan(wildcard);
    });

    it('should return 0 for global wildcard', () => {
      const result = getPermissionSpecificity('*');
      expect(result).toBe(0);
    });

    it('should return 1 for resource wildcard (parts=2, wildcards=1)', () => {
      const result = getPermissionSpecificity('users.*');
      expect(result).toBe(1);
    });

    it('should return 2 for simple permission (parts=2, wildcards=0)', () => {
      const result = getPermissionSpecificity('users.read');
      expect(result).toBe(2);
    });

    it('should return 3 for permission with sub-action (parts=3, wildcards=0)', () => {
      const result = getPermissionSpecificity('users.profile.update');
      expect(result).toBe(3);
    });
  });

  describe('sortBySpecificity', () => {
    it('should sort permissions by specificity (descending)', () => {
      const permissions = ['users.*', 'users.read', 'users.profile.update'];
      const result = sortBySpecificity(permissions);
      expect(result).toEqual(['users.profile.update', 'users.read', 'users.*']);
    });

    it('should handle empty array', () => {
      const result = sortBySpecificity([]);
      expect(result).toEqual([]);
    });
  });
});
