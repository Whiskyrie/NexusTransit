import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { ServiceOrderCreatedEvent, ServiceOrderScheduledEvent } from '../events';
import { ServiceOrdersService } from '../service-orders.service';

/**
 * Subscriber para geração automática de entregas
 *
 * Monitora eventos de criação/agendamento de ordens e
 * gera entregas automaticamente quando configurado
 */
@Injectable()
export class AutoDeliveryGenerationSubscriber {
  private readonly logger = new Logger(AutoDeliveryGenerationSubscriber.name);
  private readonly autoGenerateEnabled: boolean;
  private readonly autoGenerateForTypes: string[];

  constructor(
    private readonly serviceOrdersService: ServiceOrdersService,
    private readonly configService: ConfigService,
  ) {
    // Configurações de geração automática
    this.autoGenerateEnabled = this.configService.get<boolean>(
      'SERVICE_ORDERS_AUTO_GENERATE_DELIVERY',
      false,
    );

    const types = this.configService.get<string>('SERVICE_ORDERS_AUTO_GENERATE_TYPES', 'DELIVERY');
    this.autoGenerateForTypes = types.split(',');

    if (this.autoGenerateEnabled) {
      this.logger.log(
        `Geração automática de entregas HABILITADA para tipos: ${this.autoGenerateForTypes.join(', ')}`,
      );
    }
  }

  /**
   * Listener para criação de ordem de serviço
   */
  @OnEvent('service-order.created', { async: true })
  async handleServiceOrderCreated(event: ServiceOrderCreatedEvent): Promise<void> {
    if (!this.shouldAutoGenerate()) {
      return;
    }

    this.logger.log(`Processando geração automática de entrega para OS ${event.orderNumber}`);

    try {
      // TODO: Implementar lógica de geração automática baseada em configuração
      this.logger.log(`Entrega será gerada manualmente para OS ${event.orderNumber}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Erro ao gerar entrega automática para OS ${event.orderNumber}: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Listener para agendamento de ordem
   */
  @OnEvent('service-order.scheduled', { async: true })
  async handleServiceOrderScheduled(event: ServiceOrderScheduledEvent): Promise<void> {
    if (!this.shouldAutoGenerate()) {
      return;
    }

    this.logger.debug(
      `OS ${event.orderNumber} agendada - verificando necessidade de gerar entrega`,
    );

    // Lógica similar ao handleServiceOrderCreated
    // Pode ser configurado para gerar apenas quando agendada
  }

  /**
   * Verifica se deve gerar entrega automaticamente
   */
  private shouldAutoGenerate(): boolean {
    return this.autoGenerateEnabled;
  }
}
