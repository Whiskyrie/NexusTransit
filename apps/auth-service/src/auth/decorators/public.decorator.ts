import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para marcar endpoints como públicos
 *
 * Endpoints marcados com @Public() não requerem
 * autenticação JWT e podem ser acessados por
 * usuários não autenticados.
 *
 * @example
 * ```typescript
 * @Public()
 * @Post('login')
 * async login(@Body() loginDto: LoginDto) {
 *   return this.authService.login(loginDto);
 * }
 * ```
 */
export const PUBLIC_KEY = 'isPublic';

/**
 * Marca um endpoint como público (sem necessidade de autenticação)
 *
 * @returns Decorator function
 */
export const Public = (): MethodDecorator & ClassDecorator => {
  return SetMetadata(PUBLIC_KEY, true);
};

/**
 * Verifica se um handler ou controller é público
 *
 * @param handler - Handler a ser verificado
 * @param controller - Controller a ser verificado
 * @returns true se for público, false caso contrário
 */
export function isPublicHandler(
  handler: (...args: unknown[]) => unknown,
  controller?: (...args: unknown[]) => unknown,
): boolean {
  // Verifica no handler primeiro
  if (Reflect.hasMetadata(PUBLIC_KEY, handler)) {
    return Boolean(Reflect.getMetadata(PUBLIC_KEY, handler));
  }

  // Verifica no controller (se fornecido)
  if (controller && Reflect.hasMetadata(PUBLIC_KEY, controller)) {
    return Boolean(Reflect.getMetadata(PUBLIC_KEY, controller));
  }

  return false;
}
