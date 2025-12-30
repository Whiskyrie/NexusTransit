/**
 * Role Enum
 * Roles hierárquicos do sistema
 */
export enum Role {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  MANAGER = "manager",
  GESTOR = "gestor",
  OPERATOR = "operator",
  DESPACHANTE = "despachante",
  MOTORISTA = "motorista",
  DRIVER = "driver",
  CLIENTE = "cliente",
  CUSTOMER = "customer",
}

/**
 * Role Hierarchy
 * Hierarquia de roles - roles superiores têm acesso aos inferiores
 */
export const RoleHierarchy: Record<Role, Role[]> = {
  [Role.SUPER_ADMIN]: [
    Role.ADMIN,
    Role.MANAGER,
    Role.GESTOR,
    Role.OPERATOR,
    Role.DESPACHANTE,
    Role.MOTORISTA,
    Role.DRIVER,
    Role.CLIENTE,
    Role.CUSTOMER,
  ],
  [Role.ADMIN]: [
    Role.MANAGER,
    Role.GESTOR,
    Role.OPERATOR,
    Role.DESPACHANTE,
    Role.MOTORISTA,
    Role.DRIVER,
    Role.CLIENTE,
    Role.CUSTOMER,
  ],
  [Role.MANAGER]: [Role.GESTOR, Role.OPERATOR, Role.DESPACHANTE, Role.MOTORISTA, Role.DRIVER],
  [Role.GESTOR]: [Role.DESPACHANTE, Role.MOTORISTA, Role.DRIVER],
  [Role.OPERATOR]: [Role.DESPACHANTE, Role.MOTORISTA, Role.DRIVER],
  [Role.DESPACHANTE]: [Role.MOTORISTA, Role.DRIVER],
  [Role.MOTORISTA]: [],
  [Role.DRIVER]: [],
  [Role.CLIENTE]: [],
  [Role.CUSTOMER]: [],
};

/**
 * Verifica se uma role tem acesso a outra
 */
export function hasRoleAccess(userRole: Role, requiredRole: Role): boolean {
  if (userRole === requiredRole) {
    return true;
  }
  return RoleHierarchy[userRole]?.includes(requiredRole) ?? false;
}

/**
 * Retorna todas as roles disponíveis
 */
export function getAllRoles(): Role[] {
  return Object.values(Role);
}

/**
 * Valida se uma string é uma role válida
 */
export function isValidRole(role: string): role is Role {
  return Object.values(Role).includes(role as Role);
}

/**
 * Descrições das roles para exibição
 */
export const RoleDescriptions: Record<Role, string> = {
  [Role.SUPER_ADMIN]: "Super Administrador com acesso total ao sistema",
  [Role.ADMIN]: "Administrador com acesso total ao sistema",
  [Role.MANAGER]: "Gerente de operações e equipe",
  [Role.GESTOR]: "Gerente de operações e equipe",
  [Role.OPERATOR]: "Operador do sistema",
  [Role.DESPACHANTE]: "Responsável por entregas e rotas",
  [Role.MOTORISTA]: "Motorista que realiza entregas",
  [Role.DRIVER]: "Motorista que realiza entregas",
  [Role.CLIENTE]: "Cliente que solicita serviços",
  [Role.CUSTOMER]: "Cliente que solicita serviços",
};

/**
 * Roles do Sistema
 * Roles que não podem ser modificados ou deletados
 */
export const SYSTEM_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN];

/**
 * Roles Padrão
 * Roles que são criados automaticamente na inicialização
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
 * Nível Hierárquico
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
 * Verifica se uma role é do sistema
 */
export function isSystemRole(role: Role): boolean {
  return SYSTEM_ROLES.includes(role);
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
