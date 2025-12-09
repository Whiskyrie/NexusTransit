import { SetMetadata } from "@nestjs/common";

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
export const PUBLIC_KEY = "isPublic";

/**
 * Public Decorator
 * Marca um endpoint como público (sem necessidade de autenticação)
 */
export const Public = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(PUBLIC_KEY, true);
