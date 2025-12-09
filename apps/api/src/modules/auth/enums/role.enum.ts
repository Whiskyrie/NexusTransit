/**
 * Role Enum
 * Roles hierárquicos definidos na NEX-3
 */
export enum Role {
  ADMIN = 'admin',
  GESTOR = 'gestor',
  DESPACHANTE = 'despachante',
  MOTORISTA = 'motorista',
  CLIENTE = 'cliente',
}

/**
 * Role Hierarchy
 * Hierarquia de roles - roles superiores têm acesso aos inferiores
 */
export const RoleHierarchy = {
  [Role.ADMIN]: [Role.GESTOR, Role.DESPACHANTE, Role.MOTORISTA, Role.CLIENTE],
  [Role.GESTOR]: [Role.DESPACHANTE, Role.MOTORISTA],
  [Role.DESPACHANTE]: [Role.MOTORISTA],
  [Role.MOTORISTA]: [],
  [Role.CLIENTE]: [],
};

/**
 * Role Permissions
 * Permissões específicas por role
 */
export const RolePermissions = {
  [Role.ADMIN]: [
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'vehicles:create',
    'vehicles:read',
    'vehicles:update',
    'vehicles:delete',
    'routes:create',
    'routes:read',
    'routes:update',
    'routes:delete',
    'deliveries:create',
    'deliveries:read',
    'deliveries:update',
    'deliveries:delete',
    'reports:read',
    'audit:read',
  ],
  [Role.GESTOR]: [
    'users:read',
    'users:update',
    'vehicles:read',
    'vehicles:update',
    'routes:create',
    'routes:read',
    'routes:update',
    'deliveries:create',
    'deliveries:read',
    'deliveries:update',
    'reports:read',
  ],
  [Role.DESPACHANTE]: [
    'vehicles:read',
    'routes:read',
    'routes:update',
    'deliveries:create',
    'deliveries:read',
    'deliveries:update',
  ],
  [Role.MOTORISTA]: ['deliveries:read', 'deliveries:update', 'routes:read'],
  [Role.CLIENTE]: ['deliveries:read'],
};
