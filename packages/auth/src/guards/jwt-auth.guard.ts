import { Injectable, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * JWT Auth Guard
 * Guard para proteger rotas com autenticação JWT
 *
 * Permite rotas marcadas com @Public() sem autenticação
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('protected')
 * getProtectedData() {
 *   return 'Protected data';
 * }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verifica se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Chama a validação JWT padrão
    return super.canActivate(context);
  }
}
