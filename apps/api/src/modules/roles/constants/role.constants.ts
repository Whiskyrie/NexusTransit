/**
 * Constantes de Roles do Sistema
 *
 * Define configurações relacionadas aos roles do sistema NexusTransit
 */

import { Role } from '@nexus/auth';

/**
 * Roles do Sistema
 * Roles que não podem ser modificados ou deletados
 */
export const SYSTEM_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN];

/**
 * Roles Padrão
 * Roles que são criados automaticamente na inicRialização
 */
export const DEFAULT_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.MANAGER,
  Role.OPERATOR,
  Role.DRIVER,
  Role.CUSTOMER,
];

/**
 * Role Padrão para Novos Usuários
 */
export const DEFAULT_ROLE = Role.CUSTOMER;

/**
 * Nível Hierárquico de Roles
 * Números menores indicam maior autoridade
 */
export const ROLE_HIERARCHY_LEVEL: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 0,
  [Role.ADMIN]: 1,
  [Role.MANAGER]: 2,
  [Role.GESTOR]: 2,
  [Role.OPERATOR]: 3,
  [Role.DESPACHANTE]: 3,
  [Role.DRIVER]: 4,
  [Role.MOTORISTA]: 4,
  [Role.CUSTOMER]: 5,
  [Role.CLIENTE]: 5,
};

/**
 * Permissões Padrão por Role
 * Define quais permissões cada role tem por padrão
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.SUPER_ADMIN]: ['*'], // Todas as permissões
  [Role.ADMIN]: ['*'], // Todas as permissões
  [Role.MANAGER]: [
    'users:read',
    'users:write',
    'vehicles:read',
    'vehicles:write',
    'drivers:read',
    'drivers:write',
    'routes:read',
    'routes:write',
    'deliveries:read',
    'deliveries:write',
    'incidents:read',
    'incidents:write',
    'reports:read',
    'reports:generate',
    'settings:read',
    'roles:read',
    'customers:read',
    'customers:write',
    'service-orders:read',
    'service-orders:write',
    'tracking:read',
    'address:read',
  ],
  [Role.GESTOR]: [
    'users:read',
    'vehicles:read',
    'vehicles:write',
    'drivers:read',
    'drivers:write',
    'routes:read',
    'routes:write',
    'deliveries:read',
    'deliveries:write',
    'incidents:read',
    'incidents:write',
    'reports:read',
    'reports:generate',
    'customers:read',
    'customers:write',
    'service-orders:read',
    'service-orders:write',
    'tracking:read',
    'tracking:write',
    'address:read',
  ],
  [Role.OPERATOR]: [
    'users:read',
    'vehicles:read',
    'drivers:read',
    'routes:read',
    'deliveries:read',
    'deliveries:write',
    'incidents:read',
    'incidents:write',
    'reports:read',
    'customers:read',
    'service-orders:read',
    'service-orders:write',
    'tracking:read',
    'tracking:write',
    'address:read',
  ],
  [Role.DESPACHANTE]: [
    'vehicles:read',
    'drivers:read',
    'routes:read',
    'deliveries:read',
    'deliveries:write',
    'incidents:read',
    'incidents:write',
    'reports:read',
    'customers:read',
    'service-orders:read',
    'service-orders:write',
    'tracking:read',
    'tracking:write',
    'address:read',
  ],
  [Role.DRIVER]: [
    'deliveries:read',
    'incidents:read',
    'incidents:write',
    'reports:read',
    'tracking:read',
    'tracking:write',
    'address:read',
    'address:write',
  ],
  [Role.MOTORISTA]: [
    'deliveries:read',
    'incidents:read',
    'incidents:write',
    'reports:read',
    'tracking:read',
    'tracking:write',
    'address:read',
    'address:write',
  ],
  [Role.CUSTOMER]: [
    'deliveries:read',
    'incidents:read',
    'reports:read',
    'tracking:read',
    'address:read',
    'address:write',
  ],
  [Role.CLIENTE]: [
    'deliveries:read',
    'incidents:read',
    'reports:read',
    'tracking:read',
    'address:read',
    'address:write',
  ],
};

/**
 * Verifica se uma role é do sistema
 */
export function isSystemRole(role: Role): boolean {
  return SYSTEM_ROLES.includes(role);
}

/**
 * Verifica se uma role é um role padrão
 */
export function isDefaultRole(role: Role): boolean {
  return DEFAULT_ROLES.includes(role);
}

/**
 * Obtém o nível hierárquico de uma role
 */
export function getRoleHierarchyLevel(role: Role): number {
  return ROLE_HIERARCHY_LEVEL[role] ?? 999;
}

/**
 * Verifica se uma role tem nível hierárquico maior ou igual a outra
 */
export function hasHigherOrEqualHierarchy(role1: Role, role2: Role): boolean {
  return getRoleHierarchyLevel(role1) <= getRoleHierarchyLevel(role2);
}

/**
 * Obtém as permissões padrão de uma role
 */
export function getDefaultPermissions(role: Role): string[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

/**
 * Verifica se uma role tem permissão total (wildcard)
 */
export function hasWildcardPermission(role: Role): boolean {
  const permissions = getDefaultPermissions(role);
  return permissions.includes('*');
}
