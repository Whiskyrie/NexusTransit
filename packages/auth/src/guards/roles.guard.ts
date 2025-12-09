import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../enums/role.enum";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthUser, AuthenticatedRequest } from "../interfaces";

/**
 * Roles Guard
 * Guard para verificar se o usuário tem as roles necessárias
 *
 * Deve ser usado em conjunto com JwtAuthGuard
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(Role.ADMIN)
 * @Get('admin')
 * getAdminData() {
 *   return 'Admin only';
 * }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Se não há roles requeridas, permite acesso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest<AuthUser>>();
    const { user } = request;

    // Se não há usuário ou roles, nega acesso
    if (!user?.roles) {
      return false;
    }

    // Verifica se o usuário tem alguma das roles requeridas
    return requiredRoles.some((role) =>
      user.roles.some((userRole) => userRole.name === role)
    );
  }
}
