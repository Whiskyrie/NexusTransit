import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUDIT_OWNER_ONLY_KEY } from '../decorators/audit-access.decorator';
import { canViewAllLogs } from '../enums/audit-permission.enum';

/**
 * Interface para o usuário autenticado
 */
interface AuthUser {
  id: string;
  email: string;
  roles: { name: string }[];
}

/**
 * Request com filtro de userId injetado
 */
interface AuditFilteredRequest {
  user?: AuthUser;
  query: Record<string, unknown>;
  auditFilter?: {
    userId?: string;
    restrictToOwner: boolean;
  };
}

/**
 * Guard para filtrar logs de auditoria pelo usuário autenticado
 *
 * Este guard não bloqueia acesso, mas injeta filtros na requisição
 * para garantir que usuários sem permissão VIEW_ALL_LOGS vejam apenas
 * seus próprios logs.
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, AuditOwnerGuard)
 * @Get()
 * findAll(@Req() req) {
 *   // req.auditFilter.userId será o ID do usuário se ele não pode ver todos
 * }
 * ```
 */
@Injectable()
export class AuditOwnerGuard implements CanActivate {
  private readonly logger = new Logger(AuditOwnerGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuditFilteredRequest>();
    const user = request.user;

    // Inicializar filtro de auditoria
    request.auditFilter = {
      restrictToOwner: false,
    };

    // Se não há usuário, não aplica filtro (será bloqueado pelo JwtAuthGuard)
    if (!user) {
      return true;
    }

    // Verificar se o endpoint é marcado como owner-only
    const ownerOnly = this.reflector.getAllAndOverride<boolean>(AUDIT_OWNER_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Verificar se o usuário pode ver todos os logs
    const userCanViewAll = user.roles.some(role => canViewAllLogs(role.name));

    // Se é owner-only OU se o usuário não pode ver todos os logs
    if (ownerOnly || !userCanViewAll) {
      request.auditFilter = {
        userId: user.id,
        restrictToOwner: true,
      };

      this.logger.debug(`Filtro de owner aplicado para ${user.email} - apenas logs próprios`);
    } else {
      this.logger.debug(`Usuário ${user.email} pode ver todos os logs - sem filtro de owner`);
    }

    return true;
  }
}

/**
 * Helper para obter o filtro de auditoria da requisição
 *
 * @example
 * ```typescript
 * @Get()
 * findAll(@Req() req: Request) {
 *   const filter = getAuditFilter(req);
 *   if (filter.restrictToOwner) {
 *     // Filtrar por filter.userId
 *   }
 * }
 * ```
 */
export function getAuditFilter(request: unknown): {
  userId?: string;
  restrictToOwner: boolean;
} {
  const req = request as AuditFilteredRequest;
  return (
    req.auditFilter ?? {
      restrictToOwner: false,
    }
  );
}
