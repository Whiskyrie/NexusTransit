import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { User } from '../../users/entities/user.entity';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

/**
 * Decorator para obter o usuário atual da requisição
 * Funciona apenas em rotas protegidas com JwtAuthGuard
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user;
});
