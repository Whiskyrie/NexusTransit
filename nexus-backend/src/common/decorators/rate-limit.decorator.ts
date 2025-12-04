/**
 * Common Decorators - Rate Limit Decorators
 *
 * Re-exporta decorators do módulo rate-limit para uso global.
 * Isso permite usar os decorators em qualquer parte da aplicação
 * sem precisar importar diretamente do módulo.
 *
 * @example
 * ```typescript
 * import { RateLimit } from '@/common/decorators/rate-limit.decorator';
 * import { RateLimitType } from '@/modules/rate-limit/enums/rate-limit-type.enum';
 *
 * @RateLimit({
 *   type: RateLimitType.IP,
 *   limit: 100,
 *   windowMs: 60000,
 * })
 * @Get()
 * findAll() {}
 * ```
 *
 * @example
 * ```typescript
 * import { SkipRateLimit } from '@/common/decorators/rate-limit.decorator';
 *
 * @SkipRateLimit()
 * @Get('public')
 * getPublicData() {}
 * ```
 */

export {
  RateLimit,
  SkipRateLimit,
  RATE_LIMIT_KEY,
} from '../../modules/rate-limit/decorators/rate-limit.decorator';

export { Roles } from '../../modules/rate-limit/decorators/roles.decorator';
export { Auditable } from '../../modules/rate-limit/decorators/auditable.decorator';
