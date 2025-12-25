import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { OrderStatus } from '../enums/service_order-status';

/**
 * Contexto para validação de transições
 */
interface TransitionContext {
  scheduled_date?: string | Date;
  driver_id?: string;
  vehicle_id?: string;
  completion_report?: string;
  allowWithoutReport?: boolean;
  cancellation_reason?: string;
}

/**
 * Definição de transição de status
 */
interface StatusTransition {
  from: OrderStatus[];
  to: OrderStatus;
  requiresApproval?: boolean;
  validations?: ((context: TransitionContext) => boolean | Promise<boolean>)[];
  onBefore?: ((context: TransitionContext) => void | Promise<void>)[];
  onAfter?: ((context: TransitionContext) => void | Promise<void>)[];
}

/**
 * Serviço de Workflow para Service Orders
 *
 * Gerencia as transições de status com validações,
 * regras de negócio e hooks de execução
 */
@Injectable()
export class ServiceOrderWorkflowService {
  private readonly logger = new Logger(ServiceOrderWorkflowService.name);

  /**
   * Mapa de transições permitidas com suas regras
   */
  private readonly transitions = new Map<OrderStatus, StatusTransition[]>([
    // De PENDING
    [
      OrderStatus.PENDING,
      [
        {
          from: [OrderStatus.PENDING],
          to: OrderStatus.SCHEDULED,
          validations: [
            (ctx: TransitionContext) => !!ctx.scheduled_date,
            (ctx: TransitionContext) => {
              const scheduledDate = ctx.scheduled_date;
              if (!scheduledDate) {
                return false;
              }
              return new Date(scheduledDate) > new Date();
            },
          ],
        },
        {
          from: [OrderStatus.PENDING],
          to: OrderStatus.CANCELLED,
        },
      ],
    ],
    // De SCHEDULED
    [
      OrderStatus.SCHEDULED,
      [
        {
          from: [OrderStatus.SCHEDULED],
          to: OrderStatus.IN_PROGRESS,
          validations: [(ctx: TransitionContext) => !!ctx.driver_id || !!ctx.vehicle_id],
        },
        {
          from: [OrderStatus.SCHEDULED],
          to: OrderStatus.CANCELLED,
        },
        {
          from: [OrderStatus.SCHEDULED],
          to: OrderStatus.PENDING,
        },
      ],
    ],
    // De IN_PROGRESS
    [
      OrderStatus.IN_PROGRESS,
      [
        {
          from: [OrderStatus.IN_PROGRESS],
          to: OrderStatus.DELIVERED,
          validations: [
            (ctx: TransitionContext) => !!ctx.completion_report || ctx.allowWithoutReport === true,
          ],
        },
        {
          from: [OrderStatus.IN_PROGRESS],
          to: OrderStatus.ON_HOLD,
        },
        {
          from: [OrderStatus.IN_PROGRESS],
          to: OrderStatus.CANCELLED,
          requiresApproval: true,
        },
      ],
    ],
    // De ON_HOLD
    [
      OrderStatus.ON_HOLD,
      [
        {
          from: [OrderStatus.ON_HOLD],
          to: OrderStatus.IN_PROGRESS,
        },
        {
          from: [OrderStatus.ON_HOLD],
          to: OrderStatus.CANCELLED,
        },
      ],
    ],
  ]);

  /**
   * Valida se uma transição é permitida
   */
  async canTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    context?: TransitionContext,
  ): Promise<boolean> {
    // Status finais não podem transitar
    if (currentStatus === OrderStatus.DELIVERED || currentStatus === OrderStatus.CANCELLED) {
      return false;
    }

    // Mesma transição não é válida
    if (currentStatus === targetStatus) {
      return false;
    }

    const allowedTransitions = this.transitions.get(currentStatus);
    if (!allowedTransitions) {
      return false;
    }

    const transition = allowedTransitions.find(t => t.to === targetStatus);
    if (!transition) {
      return false;
    }

    // Validar regras se houver contexto
    if (context && transition.validations) {
      for (const validator of transition.validations) {
        const result = validator(context);
        const isValid = result instanceof Promise ? await result : result;
        if (!isValid) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Executa uma transição de status
   */
  async executeTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    context: TransitionContext,
  ): Promise<void> {
    const canExecute = await this.canTransition(currentStatus, targetStatus, context);
    if (!canExecute) {
      throw new BadRequestException(
        `Transição de status inválida: ${currentStatus} → ${targetStatus}`,
      );
    }

    const allowedTransitions = this.transitions.get(currentStatus);
    if (!allowedTransitions) {
      throw new BadRequestException('Status atual não possui transições');
    }

    const transition = allowedTransitions.find(t => t.to === targetStatus);
    if (!transition) {
      throw new BadRequestException('Transição não encontrada');
    }

    // Executar hooks de pré-transição
    if (transition.onBefore) {
      for (const hook of transition.onBefore) {
        await hook(context);
      }
    }

    this.logger.debug(`Executando transição: ${currentStatus} → ${targetStatus}`);

    // Executar hooks de pós-transição
    if (transition.onAfter) {
      for (const hook of transition.onAfter) {
        await hook(context);
      }
    }
  }

  /**
   * Retorna os status possíveis a partir do status atual
   */
  getAvailableTransitions(currentStatus: OrderStatus): OrderStatus[] {
    const transitions = this.transitions.get(currentStatus);
    if (!transitions) {
      return [];
    }

    return transitions.map(t => t.to);
  }

  /**
   * Valida se uma transição requer aprovação
   */
  requiresApproval(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
    const transitions = this.transitions.get(currentStatus);
    if (!transitions) {
      return false;
    }

    const transition = transitions.find(t => t.to === targetStatus);
    return transition?.requiresApproval ?? false;
  }

  /**
   * Retorna informações sobre o workflow atual
   */
  getWorkflowInfo(currentStatus: OrderStatus): {
    currentStatus: OrderStatus;
    availableTransitions: OrderStatus[];
    isFinal: boolean;
  } {
    return {
      currentStatus,
      availableTransitions: this.getAvailableTransitions(currentStatus),
      isFinal: currentStatus === OrderStatus.DELIVERED || currentStatus === OrderStatus.CANCELLED,
    };
  }
}
