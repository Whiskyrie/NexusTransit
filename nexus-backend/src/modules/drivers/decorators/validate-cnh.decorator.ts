import { SetMetadata, BadRequestException } from '@nestjs/common';
import { VALIDATE_CNH_KEY, CNH_EXPIRATION_WARNING_DAYS } from '../constants/driver.constants';
import { CNHCategory } from '../enums/cnh-category.enum';

/**
 * Interface para opções de validação de CNH
 */
export interface ValidateCNHOptions {
  /** Categoria mínima requerida da CNH */
  requiredCategory?: CNHCategory;
  /** Se deve bloquear operação se CNH vencida */
  blockIfExpired?: boolean;
  /** Se deve alertar sobre CNH próxima do vencimento */
  warnBeforeExpiration?: boolean;
  /** Dias de antecedência para warning */
  warningDays?: number;
  /** Mensagem de erro customizada */
  errorMessage?: string;
}

/**
 * Opções padrão para validação de CNH
 */
export const DEFAULT_VALIDATE_CNH_OPTIONS: ValidateCNHOptions = {
  blockIfExpired: true,
  warnBeforeExpiration: true,
  warningDays: CNH_EXPIRATION_WARNING_DAYS,
  errorMessage: 'CNH inválida ou vencida',
};

/**
 * Decorador para validar CNH em métodos críticos
 *
 * Valida se a CNH do motorista está válida antes de executar o método
 *
 * @param options - Opções de configuração da validação
 *
 * @example
 * ```typescript
 * class DriversService {
 *   @ValidateCNH({
 *     requiredCategory: CNHCategory.D,
 *     blockIfExpired: true
 *   })
 *   async assignToDelivery(driverId: string, deliveryId: string) {
 *     // CNH será validada antes da execução
 *   }
 * }
 * ```
 */
export const ValidateCNH = (options: ValidateCNHOptions = {}): MethodDecorator => {
  const mergedOptions = { ...DEFAULT_VALIDATE_CNH_OPTIONS, ...options };
  return SetMetadata(VALIDATE_CNH_KEY, mergedOptions);
};

/**
 * Decorador para validação estrita de CNH (bloqueia se vencida)
 *
 * @param requiredCategory - Categoria mínima requerida
 *
 * @example
 * ```typescript
 * class DriversService {
 *   @ValidateCNHStrict(CNHCategory.D)
 *   async assignToRoute(driverId: string) {
 *     // Validação estrita da CNH categoria D
 *   }
 * }
 * ```
 */
export const ValidateCNHStrict = (requiredCategory?: CNHCategory): MethodDecorator => {
  return SetMetadata(VALIDATE_CNH_KEY, {
    requiredCategory,
    blockIfExpired: true,
    warnBeforeExpiration: true,
    warningDays: CNH_EXPIRATION_WARNING_DAYS,
    errorMessage: 'CNH vencida ou categoria insuficiente',
  });
};

/**
 * Helper function para validar CNH manualmente
 *
 * @param expirationDate - Data de validade da CNH
 * @param category - Categoria da CNH
 * @param requiredCategory - Categoria mínima requerida
 * @throws BadRequestException se CNH inválida
 *
 * @example
 * ```typescript
 * validateCNHManually(
 *   new Date('2025-12-31'),
 *   CNHCategory.D,
 *   CNHCategory.C
 * );
 * ```
 */
export function validateCNHManually(
  expirationDate: Date,
  category: CNHCategory,
  requiredCategory?: CNHCategory,
): void {
  const now = new Date();

  // Verifica se está vencida
  if (expirationDate < now) {
    throw new BadRequestException('CNH vencida. Não é possível realizar a operação.');
  }

  // Verifica categoria se especificada
  if (requiredCategory && !isCategoryValid(category, requiredCategory)) {
    throw new BadRequestException(
      `CNH categoria ${category} insuficiente. Requerida: ${requiredCategory}`,
    );
  }

  // Verifica se está próximo do vencimento
  const daysToExpiration = Math.floor(
    (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysToExpiration <= CNH_EXPIRATION_WARNING_DAYS) {
    console.warn(`AVISO: CNH próxima do vencimento. Dias restantes: ${daysToExpiration}`);
  }
}

/**
 * Verifica se a categoria da CNH atende ao requisito mínimo
 *
 * Hierarquia: A < B < C < D < E
 */
function isCategoryValid(current: CNHCategory, required: CNHCategory): boolean {
  const hierarchy: Record<CNHCategory, number> = {
    [CNHCategory.A]: 1,
    [CNHCategory.B]: 2,
    [CNHCategory.C]: 3,
    [CNHCategory.D]: 4,
    [CNHCategory.E]: 5,
    [CNHCategory.AB]: 2,
    [CNHCategory.AC]: 3,
    [CNHCategory.AD]: 4,
    [CNHCategory.AE]: 5,
  };

  return hierarchy[current] >= hierarchy[required];
}
