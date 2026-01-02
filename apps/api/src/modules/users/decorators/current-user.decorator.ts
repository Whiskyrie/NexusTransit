import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../entities/user.entity';

/**
 * Interface para request com usuário autenticado
 */
interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Decorator para injetar o usuário autenticado nos controllers
 *
 * Extrai o usuário do objeto request, que é populado pelo guard de autenticação
 *
 * @example
 * ! Obter o usuário completo
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 *
 * @example
 * ! Obter apenas o ID do usuário
 * @Get('my-orders')
 * getMyOrders(@CurrentUser('id') userId: string) {
 *   return this.ordersService.findByUserId(userId);
 * }
 *
 * @example
 * ! Obter apenas o email
 * @Post('change-password')
 * changePassword(@CurrentUser('email') email: string, @Body() dto: ChangePasswordDto) {
 *   return this.usersService.changePassword(email, dto);
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | string | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    // Se um campo específico foi solicitado, retornar apenas esse campo
    if (data) {
      const value = user[data];
      // Retornar apenas valores primitivos (string, boolean, number) ou undefined
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value as string;
      }
      return undefined;
    }

    return user;
  },
);
