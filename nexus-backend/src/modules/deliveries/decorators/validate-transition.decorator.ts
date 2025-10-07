import { SetMetadata, BadRequestException } from '@nestjs/common';
import { type DeliveryStatus, DeliveryStatusTransitions } from '../enums/delivery-status.enum';

/**
 * Chave para metadados de validação de transição
 */
export const VALIDATE_TRANSITION_KEY = 'validate_delivery_transition';

/**
 * Interface para opções de validação de transição
 */
export interface ValidateTransitionOptions {
  /** Se deve lançar exceção em caso de transição inválida */
  throwOnInvalid?: boolean;
  /** Função customizada de validação */
  customValidator?: (from: DeliveryStatus, to: DeliveryStatus) => boolean;
  /** Se deve permitir transição para o mesmo status (idempotente) */
  allowSameStatus?: boolean;
  /** Mensagem de erro customizada */
  errorMessage?: string;
}

/**
 * Opções padrão para validação de transição
 */
export const DEFAULT_VALIDATE_TRANSITION_OPTIONS: ValidateTransitionOptions = {
  throwOnInvalid: true,
  allowSameStatus: true,
  errorMessage: 'Transição de status não permitida',
};

/**
 * Decorator para validar transições de status em runtime
 *
 * Valida se a transição de status é permitida de acordo com as regras
 * definidas em DeliveryStatusTransitions
 *
 * @param options - Opções de configuração da validação
 *
 * @example
 * ```typescript
 * class DeliveryService {
 *   @ValidateTransition({
 *     throwOnInvalid: true,
 *     allowSameStatus: false
 *   })
 *   async updateStatus(
 *     deliveryId: string,
 *     fromStatus: DeliveryStatus,
 *     toStatus: DeliveryStatus
 *   ) {
 *     // Transição será validada antes da execução
 *   }
 * }
 * ```
 */
export const ValidateTransition = (options: ValidateTransitionOptions = {}): MethodDecorator => {
  const mergedOptions = { ...DEFAULT_VALIDATE_TRANSITION_OPTIONS, ...options };
  return SetMetadata(VALIDATE_TRANSITION_KEY, mergedOptions);
};

/**
 * Decorator para validação estrita (não permite mesmo status)
 *
 * @example
 * ```typescript
 * class DeliveryService {
 *   @ValidateTransitionStrict()
 *   async changeStatus(id: string, from: DeliveryStatus, to: DeliveryStatus) {
 *     // Não permite transição para o mesmo status
 *   }
 * }
 * ```
 */
export const ValidateTransitionStrict = (): MethodDecorator => {
  return SetMetadata(VALIDATE_TRANSITION_KEY, {
    throwOnInvalid: true,
    allowSameStatus: false,
    errorMessage: 'Transição de status não permitida ou status já é o mesmo',
  });
};

/**
 * Helper function para validar transição manualmente
 *
 * Pode ser usado dentro de métodos para validação programática
 *
 * @param fromStatus - Status atual
 * @param toStatus - Status desejado
 * @param allowSameStatus - Se permite transição para o mesmo status
 * @throws BadRequestException se transição inválida
 *
 * @example
 * ```typescript
 * validateDeliveryTransition(
 *   DeliveryStatus.PENDING,
 *   DeliveryStatus.ASSIGNED
 * );
 * ```
 */
export function validateDeliveryTransition(
  fromStatus: DeliveryStatus,
  toStatus: DeliveryStatus,
  allowSameStatus = true,
): void {
  // Permite transição para o mesmo status se configurado
  if (allowSameStatus && fromStatus === toStatus) {
    return;
  }

  // Não permite se for o mesmo status e não é permitido
  if (!allowSameStatus && fromStatus === toStatus) {
    throw new BadRequestException(`Transição não permitida: status já é ${toStatus}`);
  }

  const allowedTransitions = DeliveryStatusTransitions[fromStatus];

  if (!allowedTransitions) {
    throw new BadRequestException(`Status de origem desconhecido: ${fromStatus}`);
  }

  if (!allowedTransitions.includes(toStatus)) {
    throw new BadRequestException({
      message: `Transição de status não permitida: ${fromStatus} -> ${toStatus}`,
      currentStatus: fromStatus,
      attemptedStatus: toStatus,
      allowedTransitions,
    });
  }
}

/**
 * Decorator que combina validação e rastreamento
 *
 * @example
 * ```typescript
 * class DeliveryService {
 *   @ValidateAndTrackTransition()
 *   async updateDeliveryStatus(
 *     id: string,
 *     from: DeliveryStatus,
 *     to: DeliveryStatus
 *   ) {
 *     // Valida E rastreia a transição
 *   }
 * }
 * ```
 */
export const ValidateAndTrackTransition = (): MethodDecorator => {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    // Aplica metadados de validação
    SetMetadata(VALIDATE_TRANSITION_KEY, DEFAULT_VALIDATE_TRANSITION_OPTIONS)(
      target,
      propertyKey,
      descriptor,
    );

    // Aplica metadados de rastreamento
    const TRACK_STATUS_KEY = 'track_delivery_status';
    SetMetadata(TRACK_STATUS_KEY, {
      createHistory: true,
      validateTransition: true,
      notify: true,
    })(target, propertyKey, descriptor);

    return descriptor;
  };
};
