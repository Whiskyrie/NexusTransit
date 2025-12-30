import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

/**
 * Exceção lançada quando uma role não é encontrada
 */
export class RoleNotFoundException extends NotFoundException {
  constructor(roleIdentifier: string) {
    super(`Role com identificador "${roleIdentifier}" não encontrada`);
  }
}

/**
 * Exceção lançada quando uma role já existe
 */
export class RoleAlreadyExistsException extends ConflictException {
  constructor(roleName: string) {
    super(`Role com nome "${roleName}" já existe`);
  }
}

/**
 * Exceção lançada quando uma permissão não é encontrada
 */
export class PermissionNotFoundException extends NotFoundException {
  constructor(permissionIdentifier: string) {
    super(`Permissão com identificador "${permissionIdentifier}" não encontrada`);
  }
}

/**
 * Exceção lançada quando uma permissão já existe
 */
export class PermissionAlreadyExistsException extends ConflictException {
  constructor(permissionName: string) {
    super(`Permissão "${permissionName}" já existe`);
  }
}

/**
 * Exceção lançada quando há violação de hierarquia de roles
 */
export class RoleHierarchyViolationException extends ForbiddenException {
  constructor(sourceRole: string, targetRole: string, action: string) {
    super(`Violação de hierarquia: Role "${sourceRole}" não pode ${action} role "${targetRole}"`);
  }
}

/**
 * Exceção lançada quando tentam modificar uma role de sistema
 */
export class SystemRoleModificationException extends ForbiddenException {
  constructor(roleName: string, action: string) {
    super(`Operação proibida: Não é possível ${action} role de sistema "${roleName}"`);
  }
}

/**
 * Exceção lançada quando há dados inválidos relacionados a roles
 */
export class InvalidRoleDataException extends BadRequestException {
  constructor(message: string) {
    super(`Dados de role inválidos: ${message}`);
  }
}

/**
 * Exceção lançada quando há dados inválidos relacionados a permissões
 */
export class InvalidPermissionDataException extends BadRequestException {
  constructor(message: string) {
    super(`Dados de permissão inválidos: ${message}`);
  }
}

/**
 * Exceção lançada quando um usuário não possui permissão necessária
 */
export class InsufficientPermissionsException extends ForbiddenException {
  constructor(requiredPermissions: string | string[]) {
    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions.join(', ')
      : requiredPermissions;
    super(`Permissões insuficientes. Permissões requeridas: ${permissions}`);
  }
}

/**
 * Exceção lançada quando tentam atribuir permissões inválidas a uma role
 */
export class InvalidPermissionAssignmentException extends BadRequestException {
  constructor(permission: string, reason: string) {
    super(`Não é possível atribuir permissão "${permission}": ${reason}`);
  }
}
