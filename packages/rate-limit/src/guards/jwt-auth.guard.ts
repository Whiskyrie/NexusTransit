import { Injectable, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * JWT Authentication Guard (Temporário)
 *
 * Será substituído pelo guard global de autenticação
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: Error | null, user: TUser | null, _info: unknown): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException("Token de autenticação inválido");
    }
    return user;
  }
}
