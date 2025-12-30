import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import {
  PERMISSIONS_KEY,
  PERMISSION_MODE_KEY,
  PermissionMode,
} from '../decorators/permissions.decorator';
import { AuthenticatedRequest } from '@nexus/auth';
import { InsufficientPermissionsException } from '../exceptions';

/**
 * Guard para verificar permissões baseadas em decorators
 *
 * Funcionalidades:
 * - Suporte a wildcards (ex: users.* permite users.read, users.write, etc)
 * - Modo AND (todas as permissões) ou OR (pelo menos uma)
 * - Skip em endpoints marcados como @Public()
 * - Integração com sistema de auditoria
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Verificar se endpoint é público
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Obter permissões requeridas dos metadados
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Se não há permissões especificadas, permitir acesso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Obter modo de verificação
    const mode = this.reflector.getAllAndOverride<PermissionMode>(PERMISSION_MODE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Obter request e usuário autenticado
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      this.logger.warn('Tentativa de acesso sem autenticação');
      return false;
    }

    // Obter permissões do usuário (pode vir de user.permissions ou de outra propriedade)
    const userPermissions = (user.permissions as string[] | undefined) ?? [];

    // Logar tentativa de acesso
    this.logger.debug(
      `Verificando permissões para usuário ${user.id}: ` +
        `requerido [${requiredPermissions.join(', ')}], ` +
        `modo ${mode}, usuário tem [${userPermissions.join(', ')}]`,
    );

    // Verificar permissões baseado no modo
    const hasPermission =
      mode === PermissionMode.OR
        ? this.hasAnyPermission(userPermissions, requiredPermissions)
        : this.hasAllPermissions(userPermissions, requiredPermissions);

    if (!hasPermission) {
      this.logger.warn(
        `Acesso negado para usuário ${user.id}: ` +
          `permissões insuficientes. Requerido: [${requiredPermissions.join(', ')}]`,
      );
      throw new InsufficientPermissionsException(requiredPermissions);
    }

    this.logger.debug(
      `Acesso permitido para usuário ${user.id} com permissões [${userPermissions.join(', ')}]`,
    );

    return true;
  }

  /**
   * Verifica se usuário tem todas as permissões requeridas
   */
  private hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(required => this.matchesPermission(userPermissions, required));
  }

  /**
   * Verifica se usuário tem pelo menos uma das permissões requeridas
   */
  private hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(required => this.matchesPermission(userPermissions, required));
  }

  /**
   * Verifica se uma permissão requerida corresponde com as permissões do usuário
   * Suporta wildcards (ex: users.* corresponde a users.read, users.write, etc)
   */
  private matchesPermission(userPermissions: string[], requiredPermission: string): boolean {
    // Verificação exata
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Verificação com wildcard
    if (requiredPermission.includes('*')) {
      const pattern = this.createWildcardPattern(requiredPermission);
      return userPermissions.some(perm => pattern.test(perm));
    }

    // Verificar se usuário tem wildcard que cobre a permissão requerida
    return userPermissions.some(userPerm => {
      if (userPerm.includes('*')) {
        const pattern = this.createWildcardPattern(userPerm);
        return pattern.test(requiredPermission);
      }
      return false;
    });
  }

  /**
   * Cria pattern regex para matching de wildcards
   * Ex: users.* => /^users\..+$/
   */
  private createWildcardPattern(permission: string): RegExp {
    const escaped = permission.replace(/\./g, '\\.').replace(/\*/g, '.+');
    return new RegExp(`^${escaped}$`);
  }
}
