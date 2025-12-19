import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { IncidentStatus } from '../enums/incident.enums';

/**
 * Mapa de transições válidas de status
 * Define quais status podem transitar para quais outros status
 */
export const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  [IncidentStatus.REPORTED]: [
    IncidentStatus.INVESTIGATING,
    IncidentStatus.CLOSED, // Pode fechar direto se for falso alarme
  ],
  [IncidentStatus.INVESTIGATING]: [
    IncidentStatus.IN_PROGRESS,
    IncidentStatus.ESCALATED,
    IncidentStatus.CLOSED,
  ],
  [IncidentStatus.IN_PROGRESS]: [
    IncidentStatus.RESOLVED,
    IncidentStatus.ESCALATED,
    IncidentStatus.INVESTIGATING, // Pode voltar se precisar mais investigação
  ],
  [IncidentStatus.RESOLVED]: [
    IncidentStatus.CLOSED,
    IncidentStatus.IN_PROGRESS, // Pode reabrir
  ],
  [IncidentStatus.ESCALATED]: [
    IncidentStatus.IN_PROGRESS,
    IncidentStatus.RESOLVED,
    IncidentStatus.CLOSED,
  ],
  [IncidentStatus.CLOSED]: [
    IncidentStatus.INVESTIGATING, // Pode reabrir
  ],
};

/**
 * Validador customizado para transições de status
 *
 * Verifica se a mudança de status é permitida de acordo com as regras de negócio
 */
@ValidatorConstraint({ name: 'isValidStatusTransition', async: false })
export class IsValidStatusTransitionConstraint implements ValidatorConstraintInterface {
  validate(newStatus: IncidentStatus, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;
    const currentStatus = object.currentStatus as IncidentStatus;

    if (!currentStatus) {
      // Se não há status atual, qualquer status inicial é válido
      return this.isValidInitialStatus(newStatus);
    }

    return this.isValidTransition(currentStatus, newStatus);
  }

  /**
   * Verifica se o status é válido como status inicial
   */
  private isValidInitialStatus(status: IncidentStatus): boolean {
    // Apenas REPORTED é válido como status inicial
    return status === IncidentStatus.REPORTED;
  }

  /**
   * Verifica se a transição entre dois status é válida
   */
  private isValidTransition(from: IncidentStatus, to: IncidentStatus): boolean {
    if (from === to) {
      // Não precisa validar se está tentando manter o mesmo status
      return true;
    }

    const allowedTransitions = STATUS_TRANSITIONS[from] || [];
    return allowedTransitions.includes(to);
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as Record<string, unknown>;
    const currentStatus = object.currentStatus as IncidentStatus | undefined;
    const newStatus = args.value as IncidentStatus;

    if (!currentStatus) {
      return `Status inicial deve ser REPORTED`;
    }

    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] ?? [];
    return `Transição de status de "${currentStatus}" para "${newStatus}" não é permitida. Transições válidas: ${allowedTransitions.join(', ')}`;
  }
}

/**
 * Decorator para validação de transição de status
 *
 * @example
 * ```typescript
 * class UpdateStatusDto {
 *   @IsValidStatusTransition()
 *   status: IncidentStatus;
 *
 *   currentStatus?: IncidentStatus; // Deve ser definido no objeto
 * }
 * ```
 */
export function IsValidStatusTransition(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsValidStatusTransitionConstraint,
    });
  };
}

/**
 * Função auxiliar para validar transição de status sem decorator
 */
export function validateStatusTransition(
  from: IncidentStatus | null,
  to: IncidentStatus,
): { valid: boolean; message?: string } {
  // Se não há status anterior, verificar se é status inicial válido
  if (!from) {
    if (to !== IncidentStatus.REPORTED) {
      return {
        valid: false,
        message: 'Status inicial deve ser REPORTED',
      };
    }
    return { valid: true };
  }

  // Se está tentando manter o mesmo status
  if (from === to) {
    return { valid: true };
  }

  // Verificar se a transição é válida
  const allowedTransitions = STATUS_TRANSITIONS[from] || [];
  if (!allowedTransitions.includes(to)) {
    return {
      valid: false,
      message: `Transição de "${from}" para "${to}" não é permitida. Transições válidas: ${allowedTransitions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Função auxiliar para obter próximos status possíveis
 */
export function getNextPossibleStatuses(currentStatus: IncidentStatus): IncidentStatus[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Função auxiliar para verificar se um status pode transitar para outro
 */
export function canTransitionTo(from: IncidentStatus, to: IncidentStatus): boolean {
  if (from === to) {
    return true;
  }
  const allowedTransitions = STATUS_TRANSITIONS[from] || [];
  return allowedTransitions.includes(to);
}
