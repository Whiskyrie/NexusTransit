/**
 * Role Enum
 * Roles hierárquicos do sistema
 */
export enum Role {
  ADMIN = "admin",
  GESTOR = "gestor",
  DESPACHANTE = "despachante",
  MOTORISTA = "motorista",
  CLIENTE = "cliente",
}

/**
 * Role Hierarchy
 * Hierarquia de roles - roles superiores têm acesso aos inferiores
 */
export const RoleHierarchy: Record<Role, Role[]> = {
  [Role.ADMIN]: [Role.GESTOR, Role.DESPACHANTE, Role.MOTORISTA, Role.CLIENTE],
  [Role.GESTOR]: [Role.DESPACHANTE, Role.MOTORISTA],
  [Role.DESPACHANTE]: [Role.MOTORISTA],
  [Role.MOTORISTA]: [],
  [Role.CLIENTE]: [],
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
  [Role.ADMIN]: "Administrador com acesso total ao sistema",
  [Role.GESTOR]: "Gerente de operações e equipe",
  [Role.DESPACHANTE]: "Responsável por entregas e rotas",
  [Role.MOTORISTA]: "Motorista que realiza entregas",
  [Role.CLIENTE]: "Cliente que solicita serviços",
};
