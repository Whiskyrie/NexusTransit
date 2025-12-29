import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Role, hasRoleAccess, getRoleHierarchyLevel, isSystemRole } from '@nexus/auth';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Role as RoleEntity } from '../../auth/entities/role.entity';

/**
 * Service para gerenciamento de Hierarquia de Roles
 *
 * Responsável por validar e gerenciar a hierarquia entre roles
 */
@Injectable()
export class RoleHierarchyService {
  private readonly logger = new Logger(RoleHierarchyService.name);

  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  /**
   * Verifica se um usuário com role1 pode modificar um usuário com role2
   */
  canModifyRole(userRole: Role, targetRole: Role): boolean {
    // Não pode modificar roles do sistema
    if (isSystemRole(targetRole)) {
      return false;
    }

    // Só pode modificar roles de nível hierárquico inferior
    const userLevel = getRoleHierarchyLevel(userRole);
    const targetLevel = getRoleHierarchyLevel(targetRole);

    return userLevel < targetLevel;
  }

  /**
   * Verifica se um usuário com role1 pode modificar um role específico
   */
  async canModifyRoleById(userRole: Role, roleId: string): Promise<boolean> {
    const targetRole = await this.roleRepository.findOne({
      where: { id: roleId, deleted_at: IsNull() },
    });

    if (!targetRole) {
      return false;
    }

    return this.canModifyRole(userRole, targetRole.name);
  }

  /**
   * Valida se um usuário pode atribuir um role a outro usuário
   */
  canAssignRole(userRole: Role, roleToAssign: Role): boolean {
    // Não pode atribuir roles do sistema
    if (isSystemRole(roleToAssign)) {
      return false;
    }

    // Só pode atribuir roles de nível hierárquico inferior ou igual
    const userLevel = getRoleHierarchyLevel(userRole);
    const assignLevel = getRoleHierarchyLevel(roleToAssign);

    return userLevel <= assignLevel;
  }

  /**
   * Valida se um usuário pode remover um role de outro usuário
   */
  canRemoveRole(userRole: Role, roleToRemove: Role): boolean {
    // Não pode remover roles do sistema
    if (isSystemRole(roleToRemove)) {
      return false;
    }

    // Só pode remover roles de nível hierárquico inferior
    const userLevel = getRoleHierarchyLevel(userRole);
    const removeLevel = getRoleHierarchyLevel(roleToRemove);

    return userLevel < removeLevel;
  }

  /**
   * Obtém todos os roles que um usuário pode modificar
   */
  async getModifiableRoles(userRole: Role): Promise<RoleEntity[]> {
    const userLevel = getRoleHierarchyLevel(userRole);

    const roles = await this.roleRepository.find({
      where: { deleted_at: IsNull() },
      order: { hierarchy_level: 'ASC' },
    });

    // Filtrar apenas roles de nível hierárquico inferior
    return roles.filter(role => {
      const roleLevel = role.hierarchy_level ?? 999;
      return roleLevel > userLevel && !isSystemRole(role.name);
    });
  }

  /**
   * Obtém todos os roles que um usuário pode atribuir
   */
  async getAssignableRoles(userRole: Role): Promise<RoleEntity[]> {
    const userLevel = getRoleHierarchyLevel(userRole);

    const roles = await this.roleRepository.find({
      where: { deleted_at: IsNull() },
      order: { hierarchy_level: 'ASC' },
    });

    // Filtrar apenas roles de nível hierárquico inferior ou igual
    return roles.filter(role => {
      const roleLevel = role.hierarchy_level ?? 999;
      return roleLevel >= userLevel && !isSystemRole(role.name);
    });
  }

  /**
   * Valida se um usuário tem acesso a um recurso baseado em roles
   */
  hasAccess(userRoles: Role[], requiredRole: Role): boolean {
    return userRoles.some(userRole => hasRoleAccess(userRole, requiredRole));
  }

  /**
   * Obtém o role de maior nível hierárquico de uma lista
   */
  getHighestRole(roles: Role[]): Role | null {
    if (roles.length === 0) {
      return null;
    }

    return roles.reduce((highest, current) => {
      const highestLevel = getRoleHierarchyLevel(highest);
      const currentLevel = getRoleHierarchyLevel(current);

      return currentLevel < highestLevel ? current : highest;
    });
  }

  /**
   * Verifica se um role é superior a outro
   */
  isSuperior(role1: Role, role2: Role): boolean {
    return getRoleHierarchyLevel(role1) < getRoleHierarchyLevel(role2);
  }

  /**
   * Verifica se dois roles estão no mesmo nível hierárquico
   */
  isSameLevel(role1: Role, role2: Role): boolean {
    return getRoleHierarchyLevel(role1) === getRoleHierarchyLevel(role2);
  }

  /**
   * Valida operação de modificação de role
   */
  validateModification(userRole: Role, targetRole: Role): void {
    if (!this.canModifyRole(userRole, targetRole)) {
      if (isSystemRole(targetRole)) {
        throw new BadRequestException(`Não é permitido modificar roles do sistema (${targetRole})`);
      }

      throw new BadRequestException(`Você não tem permissão para modificar o role ${targetRole}`);
    }
  }

  /**
   * Valida operação de atribuição de role
   */
  validateAssignment(userRole: Role, roleToAssign: Role): void {
    if (!this.canAssignRole(userRole, roleToAssign)) {
      if (isSystemRole(roleToAssign)) {
        throw new BadRequestException(
          `Não é permitido atribuir roles do sistema (${roleToAssign})`,
        );
      }

      throw new BadRequestException(`Você não tem permissão para atribuir o role ${roleToAssign}`);
    }
  }
}
