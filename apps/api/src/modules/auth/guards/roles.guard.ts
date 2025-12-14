import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES_KEY, AuthenticatedRequest } from '@nexus/auth';

/**
 * Roles Guard
 * Guard para verificar se o usuário tem as roles necessárias
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { user } = request;

    if (!user?.roles) {
      throw new ForbiddenException('Acesso negado');
    }

    const hasRole = requiredRoles.some(role =>
      user.roles?.some(userRole => userRole.name === (role as string)),
    );

    if (!hasRole) {
      throw new ForbiddenException(`Acesso negado. Roles requeridas: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
