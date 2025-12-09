/**
 * Common Guards - Rate Limit Guard
 *
 * Re-exporta o RateLimitGuard do módulo rate-limit para uso global.
 * Isso permite usar o guard em qualquer parte da aplicação sem
 * precisar importar diretamente do módulo.
 *
 * @example
 * ```typescript
 * // No controller
 * import { RateLimitGuard } from '@/common/guards/rate-limit.guard';
 *
 * @UseGuards(RateLimitGuard)
 * @Controller('api/users')
 * export class UsersController {}
 * ```
 *
 * @example
 * ```typescript
 * // Globalmente no AppModule
 * import { APP_GUARD } from '@nestjs/core';
 * import { RateLimitGuard } from '@/common/guards/rate-limit.guard';
 *
 * {
 *   provide: APP_GUARD,
 *   useClass: RateLimitGuard,
 * }
 * ```
 */

export { RateLimitGuard } from '../../modules/rate-limit/guards/rate-limit.guard';
export { JwtAuthGuard, RolesGuard } from '@nexus/auth';
