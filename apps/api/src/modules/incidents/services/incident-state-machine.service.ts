import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { createMachine, createActor, AnyStateMachine } from 'xstate';
import { IncidentStatus } from '../enums/incident.enums';
import {
  validateStatusTransition,
  getNextPossibleStatuses,
  STATUS_TRANSITIONS,
} from '../validators/status-transition.validator';

/**
 * Eventos possíveis na máquina de estados
 */
type IncidentEvent =
  | { type: 'START_INVESTIGATION' }
  | { type: 'START_WORK' }
  | { type: 'RESOLVE' }
  | { type: 'CLOSE' }
  | { type: 'ESCALATE' }
  | { type: 'REOPEN' }
  | { type: 'BACK_TO_INVESTIGATION' };

/**
 * Contexto da máquina de estados
 */
interface IncidentContext {
  incidentId: string;
  userId: string;
  reason?: string;
  timestamp: Date;
}

/**
 * Tipo para a máquina de estados do incidente
 */
type IncidentMachine = AnyStateMachine;

/**
 * Serviço para gerenciar a máquina de estados dos incidentes
 *
 * Utiliza XState para garantir transições válidas e rastreáveis
 */
@Injectable()
export class IncidentStateMachineService {
  private readonly logger = new Logger(IncidentStateMachineService.name);
  private readonly machine: IncidentMachine;

  constructor() {
    this.machine = this.createIncidentMachine();
  }

  /**
   * Cria a máquina de estados do incidente
   */
  private createIncidentMachine(): IncidentMachine {
    return createMachine({
      id: 'incident',
      initial: IncidentStatus.REPORTED,
      context: {} as IncidentContext,
      states: {
        [IncidentStatus.REPORTED]: {
          on: {
            START_INVESTIGATION: { target: IncidentStatus.INVESTIGATING },
            CLOSE: { target: IncidentStatus.CLOSED },
          },
        },
        [IncidentStatus.INVESTIGATING]: {
          on: {
            START_WORK: { target: IncidentStatus.IN_PROGRESS },
            ESCALATE: { target: IncidentStatus.ESCALATED },
            CLOSE: { target: IncidentStatus.CLOSED },
          },
        },
        [IncidentStatus.IN_PROGRESS]: {
          on: {
            RESOLVE: { target: IncidentStatus.RESOLVED },
            ESCALATE: { target: IncidentStatus.ESCALATED },
            BACK_TO_INVESTIGATION: { target: IncidentStatus.INVESTIGATING },
          },
        },
        [IncidentStatus.RESOLVED]: {
          on: {
            CLOSE: { target: IncidentStatus.CLOSED },
            REOPEN: { target: IncidentStatus.IN_PROGRESS },
          },
        },
        [IncidentStatus.ESCALATED]: {
          on: {
            START_WORK: { target: IncidentStatus.IN_PROGRESS },
            RESOLVE: { target: IncidentStatus.RESOLVED },
            CLOSE: { target: IncidentStatus.CLOSED },
          },
        },
        [IncidentStatus.CLOSED]: {
          on: {
            REOPEN: { target: IncidentStatus.INVESTIGATING },
          },
        },
      },
    });
  }

  /**
   * Valida se uma transição de status é permitida
   */
  validateTransition(
    currentStatus: IncidentStatus,
    newStatus: IncidentStatus,
  ): { valid: boolean; message?: string } {
    return validateStatusTransition(currentStatus, newStatus);
  }

  /**
   * Obtém os próximos status possíveis a partir do status atual
   */
  getNextStatuses(currentStatus: IncidentStatus): IncidentStatus[] {
    return getNextPossibleStatuses(currentStatus);
  }

  /**
   * Mapeia um status de destino para o evento correto
   */
  private getEventForTransition(from: IncidentStatus, to: IncidentStatus): string | null {
    // Mapa de transições para eventos
    const transitionMap: Record<string, string> = {
      [`${IncidentStatus.REPORTED}-${IncidentStatus.INVESTIGATING}`]: 'START_INVESTIGATION',
      [`${IncidentStatus.REPORTED}-${IncidentStatus.CLOSED}`]: 'CLOSE',
      [`${IncidentStatus.INVESTIGATING}-${IncidentStatus.IN_PROGRESS}`]: 'START_WORK',
      [`${IncidentStatus.INVESTIGATING}-${IncidentStatus.ESCALATED}`]: 'ESCALATE',
      [`${IncidentStatus.INVESTIGATING}-${IncidentStatus.CLOSED}`]: 'CLOSE',
      [`${IncidentStatus.IN_PROGRESS}-${IncidentStatus.RESOLVED}`]: 'RESOLVE',
      [`${IncidentStatus.IN_PROGRESS}-${IncidentStatus.ESCALATED}`]: 'ESCALATE',
      [`${IncidentStatus.IN_PROGRESS}-${IncidentStatus.INVESTIGATING}`]: 'BACK_TO_INVESTIGATION',
      [`${IncidentStatus.RESOLVED}-${IncidentStatus.CLOSED}`]: 'CLOSE',
      [`${IncidentStatus.RESOLVED}-${IncidentStatus.IN_PROGRESS}`]: 'REOPEN',
      [`${IncidentStatus.ESCALATED}-${IncidentStatus.IN_PROGRESS}`]: 'START_WORK',
      [`${IncidentStatus.ESCALATED}-${IncidentStatus.RESOLVED}`]: 'RESOLVE',
      [`${IncidentStatus.ESCALATED}-${IncidentStatus.CLOSED}`]: 'CLOSE',
      [`${IncidentStatus.CLOSED}-${IncidentStatus.INVESTIGATING}`]: 'REOPEN',
    };

    const key = `${from}-${to}`;
    return transitionMap[key] || null;
  }

  /**
   * Executa uma transição de status
   *
   * @param incidentId ID do incidente
   * @param currentStatus Status atual do incidente
   * @param newStatus Novo status desejado
   * @param userId ID do usuário realizando a transição
   * @param reason Motivo da transição (opcional)
   * @returns Objeto com sucesso e novo status
   */
  transition(
    incidentId: string,
    currentStatus: IncidentStatus,
    newStatus: IncidentStatus,
    userId: string,
    _reason?: string,
  ): {
    success: boolean;
    status: IncidentStatus;
    message?: string;
  } {
    // Se for o mesmo status, não fazer nada
    if (currentStatus === newStatus) {
      return {
        success: true,
        status: currentStatus,
        message: 'Status permanece o mesmo',
      };
    }

    // Validar a transição
    const validation = this.validateTransition(currentStatus, newStatus);
    if (!validation.valid) {
      this.logger.warn(`Transição inválida para incidente ${incidentId}: ${validation.message}`);
      throw new BadRequestException(validation.message);
    }

    // Obter o evento correspondente à transição
    const event = this.getEventForTransition(currentStatus, newStatus);
    if (!event) {
      throw new BadRequestException(
        `Não foi possível determinar o evento para transição de ${currentStatus} para ${newStatus}`,
      );
    }

    // Criar um ator com o estado atual
    const actor = createActor(this.machine, {} as never);

    actor.start();

    // Tentar a transição
    try {
      actor.send({ type: event } as IncidentEvent);
      const snapshot = actor.getSnapshot() as { value?: unknown };

      this.logger.log(
        `Incidente ${incidentId}: ${currentStatus} -> ${newStatus} por usuário ${userId}`,
      );

      actor.stop();

      const snapshotValue = snapshot.value ?? newStatus;
      const finalStatus =
        typeof snapshotValue === 'string' ? (snapshotValue as IncidentStatus) : newStatus;

      return {
        success: true,
        status: finalStatus,
        message: `Status atualizado de ${currentStatus} para ${newStatus}`,
      };
    } catch (error) {
      actor.stop();
      this.logger.error(`Erro ao executar transição para incidente ${incidentId}`, error);
      throw new BadRequestException(
        `Erro ao executar transição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Verifica se uma transição específica é possível
   */
  canTransition(currentStatus: IncidentStatus, targetStatus: IncidentStatus): boolean {
    if (currentStatus === targetStatus) {
      return false;
    }

    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(targetStatus);
  }

  /**
   * Obtém informações sobre as transições disponíveis
   */
  getTransitionInfo(currentStatus: IncidentStatus): {
    current: IncidentStatus;
    nextStatuses: IncidentStatus[];
    transitions: {
      to: IncidentStatus;
      event: string | null;
      description: string;
    }[];
  } {
    const nextStatuses = this.getNextStatuses(currentStatus);

    const transitions = nextStatuses.map(to => ({
      to,
      event: this.getEventForTransition(currentStatus, to),
      description: this.getTransitionDescription(currentStatus, to),
    }));

    return {
      current: currentStatus,
      nextStatuses,
      transitions,
    };
  }

  /**
   * Obtém uma descrição amigável da transição
   */
  private getTransitionDescription(from: IncidentStatus, to: IncidentStatus): string {
    const descriptions: Record<string, string> = {
      [`${IncidentStatus.REPORTED}-${IncidentStatus.INVESTIGATING}`]:
        'Iniciar investigação do incidente',
      [`${IncidentStatus.REPORTED}-${IncidentStatus.CLOSED}`]: 'Fechar incidente (falso alarme)',
      [`${IncidentStatus.INVESTIGATING}-${IncidentStatus.IN_PROGRESS}`]:
        'Iniciar trabalho de resolução',
      [`${IncidentStatus.INVESTIGATING}-${IncidentStatus.ESCALATED}`]:
        'Escalar para nível superior',
      [`${IncidentStatus.INVESTIGATING}-${IncidentStatus.CLOSED}`]: 'Fechar incidente',
      [`${IncidentStatus.IN_PROGRESS}-${IncidentStatus.RESOLVED}`]: 'Marcar como resolvido',
      [`${IncidentStatus.IN_PROGRESS}-${IncidentStatus.ESCALATED}`]: 'Escalar incidente',
      [`${IncidentStatus.IN_PROGRESS}-${IncidentStatus.INVESTIGATING}`]: 'Voltar para investigação',
      [`${IncidentStatus.RESOLVED}-${IncidentStatus.CLOSED}`]: 'Fechar incidente resolvido',
      [`${IncidentStatus.RESOLVED}-${IncidentStatus.IN_PROGRESS}`]: 'Reabrir incidente',
      [`${IncidentStatus.ESCALATED}-${IncidentStatus.IN_PROGRESS}`]: 'Retomar trabalho',
      [`${IncidentStatus.ESCALATED}-${IncidentStatus.RESOLVED}`]: 'Resolver incidente escalado',
      [`${IncidentStatus.ESCALATED}-${IncidentStatus.CLOSED}`]: 'Fechar incidente escalado',
      [`${IncidentStatus.CLOSED}-${IncidentStatus.INVESTIGATING}`]: 'Reabrir incidente',
    };

    const key = `${from}-${to}`;
    return descriptions[key] || `Transição de ${from} para ${to}`;
  }
}
