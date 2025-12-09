import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthUser, AuthenticatedRequest } from "../interfaces";

/**
 * CurrentUser Decorator
 * Extrai o usuário autenticado da requisição
 *
 * Funciona apenas em rotas protegidas com JwtAuthGuard
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  <T extends AuthUser = AuthUser>(
    data: keyof T | undefined,
    ctx: ExecutionContext
  ): T | T[keyof T] => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest<T>>();
    const user = request.user;

    return data ? user?.[data] : user;
  }
);
