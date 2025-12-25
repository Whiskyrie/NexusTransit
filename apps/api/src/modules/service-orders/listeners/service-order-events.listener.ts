import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ServiceOrderCreatedEvent,
  ServiceOrderScheduledEvent,
  ServiceOrderStartedEvent,
  ServiceOrderCompletedEvent,
  ServiceOrderCancelledEvent,
  DeliveryGeneratedEvent,
  ServiceOrderStatusChangedEvent,
} from '../events';

/**
 * Listener para eventos de Service Orders
 *
 * Responsável por reagir a eventos do ciclo de vida das ordens de serviço
 * e executar ações secundárias como notificações, logs, etc.
 */
@Injectable()
export class ServiceOrderEventsListener {
  private readonly logger = new Logger(ServiceOrderEventsListener.name);

  /**
   * Listener para criação de ordem de serviço
   */
  @OnEvent('service-order.created')
  handleServiceOrderCreated(event: ServiceOrderCreatedEvent): void {
    this.logger.log(`Ordem de serviço criada: ${event.orderNumber} (ID: ${event.serviceOrderId})`);

    // TODO: Enviar notificação para cliente
    // TODO: Registrar em sistema de analytics
    // TODO: Iniciar workflow de aprovação se necessário
  }

  /**
   * Listener para agendamento de ordem
   */
  @OnEvent('service-order.scheduled')
  handleServiceOrderScheduled(event: ServiceOrderScheduledEvent): void {
    this.logger.log(
      `Ordem ${event.orderNumber} agendada para ${event.scheduledDate.toISOString()}`,
    );

    // TODO: Enviar notificação para motorista
    // TODO: Adicionar à agenda do motorista
    // TODO: Reservar veículo se necessário
  }

  /**
   * Listener para início de execução
   */
  @OnEvent('service-order.started')
  handleServiceOrderStarted(event: ServiceOrderStartedEvent): void {
    this.logger.log(`Ordem ${event.orderNumber} iniciada às ${event.startedAt.toISOString()}`);

    // TODO: Notificar cliente sobre início
    // TODO: Iniciar rastreamento em tempo real
    // TODO: Atualizar status do motorista
  }

  /**
   * Listener para conclusão de ordem
   */
  @OnEvent('service-order.completed')
  handleServiceOrderCompleted(event: ServiceOrderCompletedEvent): void {
    this.logger.log(`Ordem ${event.orderNumber} concluída - Duração: ${event.durationMinutes}min`);

    // TODO: Enviar notificação de conclusão
    // TODO: Solicitar avaliação do serviço
    // TODO: Processar faturamento
    // TODO: Liberar veículo e motorista
  }

  /**
   * Listener para cancelamento
   */
  @OnEvent('service-order.cancelled')
  handleServiceOrderCancelled(event: ServiceOrderCancelledEvent): void {
    this.logger.warn(`Ordem ${event.orderNumber} cancelada - Motivo: ${event.reason}`);

    // TODO: Notificar partes envolvidas
    // TODO: Liberar recursos (veículo, motorista)
    // TODO: Processar reembolso se necessário
    // TODO: Registrar em sistema de qualidade
  }

  /**
   * Listener para geração de entrega
   */
  @OnEvent('delivery.generated')
  handleDeliveryGenerated(event: DeliveryGeneratedEvent): void {
    this.logger.log(`Entrega ${event.trackingCode} gerada a partir da OS ${event.orderNumber}`);

    // TODO: Notificar cliente sobre entrega criada
    // TODO: Sincronizar com sistema de rastreamento
    // TODO: Preparar documentação necessária
  }

  /**
   * Listener genérico para mudanças de status
   */
  @OnEvent('service-order.status-changed')
  handleStatusChanged(event: ServiceOrderStatusChangedEvent): void {
    this.logger.debug(
      `Status da OS ${event.orderNumber} mudou: ${event.previousStatus} → ${event.newStatus}`,
    );

    // TODO: Registrar em histórico de auditoria
    // TODO: Atualizar dashboards em tempo real
    // TODO: Verificar SLAs e prazos
  }
}
