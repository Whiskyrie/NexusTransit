import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@nexus/auth";
import { ROLES_KEY } from "../decorators/roles.decorator";

/**
 * Guard para verificar roles permitidas
 *
 * Temporário - será substituído pelo guard global
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { role?: Role } }>();
    const user = request.user;

    if (!user?.role) {
      return false;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
