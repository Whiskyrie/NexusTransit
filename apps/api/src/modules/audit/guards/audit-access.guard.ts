import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUDIT_PERMISSIONS_KEY } from '../decorators/audit-access.decorator';
import { AuditPermission, hasAuditPermission } from '../enums/audit-permission.enum';

/**
 * Interface para o usuário autenticado
 */
interface AuthUser {
  id: string;
  email: string;
  roles: { name: string }[];
}

/**
 * Guard para verificar permissões de acesso ao módulo de Auditoria
 *
 * Verifica se o usuário autenticado possui as permissões necessárias
 * baseado nas roles e no mapeamento de permissões.
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, AuditAccessGuard)
 * @RequireAuditPermission(AuditPermission.VIEW_LOGS)
 * @Get()
 * findAll() { ... }
 * ```
 */
@Injectable()
export class AuditAccessGuard implements CanActivate {
  private readonly logger = new Logger(AuditAccessGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obter permissões requeridas do decorator
    const requiredPermissions = this.reflector.getAllAndOverride<AuditPermission[]>(
      AUDIT_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há permissões requeridas, permite acesso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Obter usuário da requisição
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    // Se não há usuário autenticado, nega acesso
    if (!user) {
      this.logger.warn('Acesso negado: usuário não autenticado');
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Se não há roles, nega acesso
    if (!user.roles || user.roles.length === 0) {
      this.logger.warn(`Acesso negado: usuário ${user.email} não possui roles`);
      throw new ForbiddenException('Usuário não possui permissões configuradas');
    }

    // Verificar se alguma role do usuário tem as permissões necessárias
    const hasPermission = this.checkPermissions(user.roles, requiredPermissions);

    if (!hasPermission) {
      const permissionNames = requiredPermissions.join(', ');
      this.logger.warn(
        `Acesso negado: usuário ${user.email} não possui permissões [${permissionNames}]`,
      );
      throw new ForbiddenException(`Acesso negado. Permissões necessárias: ${permissionNames}`);
    }

    this.logger.debug(
      `Acesso permitido para ${user.email} - permissões: ${requiredPermissions.join(', ')}`,
    );

    return true;
  }

  /**
   * Verifica se alguma das roles do usuário possui todas as permissões necessárias
   */
  private checkPermissions(
    userRoles: { name: string }[],
    requiredPermissions: AuditPermission[],
  ): boolean {
    // Verifica se alguma role tem TODAS as permissões requeridas
    return userRoles.some(role => {
      return requiredPermissions.every(permission => hasAuditPermission(role.name, permission));
    });
  }
}
