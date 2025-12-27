import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { ServiceOrderCreatedEvent, ServiceOrderScheduledEvent } from '../events';
import { ServiceOrdersService } from '../service-orders.service';
import { OrderType } from '../enums/order-type.enum';

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
  private readonly generateOnSchedule: boolean;

  constructor(
    private readonly serviceOrdersService: ServiceOrdersService,
    private readonly configService: ConfigService,
  ) {
    // Configurações de geração automática
    this.autoGenerateEnabled = this.configService.get<boolean>(
      'SERVICE_ORDERS_AUTO_GENERATE_DELIVERY',
      false,
    );

    const types = this.configService.get<string>(
      'SERVICE_ORDERS_AUTO_GENERATE_TYPES',
      'DELIVERY_ONLY,PICKUP_DELIVERY',
    );
    this.autoGenerateForTypes = types.split(',').map(t => t.trim());

    this.generateOnSchedule = this.configService.get<boolean>(
      'SERVICE_ORDERS_AUTO_GENERATE_ON_SCHEDULE',
      true,
    );

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

    // Se configurado para gerar apenas no agendamento, ignorar criação
    if (this.generateOnSchedule) {
      this.logger.debug(`OS ${event.orderNumber} - entrega será gerada no agendamento`);
      return;
    }

    await this.generateDeliveryForOrder(event.serviceOrderId, event.orderNumber);
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
      `OS ${event.orderNumber} agendada para ${event.scheduledDate.toISOString()} - verificando necessidade de gerar entrega`,
    );

    await this.generateDeliveryForOrder(event.serviceOrderId, event.orderNumber);
  }

  /**
   * Gera entrega para uma ordem de serviço
   */
  private async generateDeliveryForOrder(
    serviceOrderId: string,
    orderNumber: string,
  ): Promise<void> {
    try {
      // Buscar a ordem de serviço completa
      const serviceOrder = await this.serviceOrdersService.findOne(serviceOrderId);

      // Verificar se o tipo da ordem deve gerar entrega
      if (!this.shouldGenerateForType(serviceOrder.order_type as OrderType)) {
        this.logger.debug(
          `OS ${orderNumber} - tipo ${serviceOrder.order_type} não configurado para geração automática`,
        );
        return;
      }

      // Verificar se já existe entrega gerada
      // O campo deliveries pode não existir no ResponseDto, então verificamos de forma segura
      const deliveriesField = serviceOrder as unknown as { deliveries?: unknown[] };
      const deliveriesCount = Array.isArray(deliveriesField.deliveries)
        ? deliveriesField.deliveries.length
        : 0;

      if (deliveriesCount > 0) {
        this.logger.debug(`OS ${orderNumber} já possui ${deliveriesCount} entregas`);
        return;
      }

      // Gerar a entrega
      this.logger.log(`Gerando entrega automática para OS ${orderNumber}`);

      const delivery = await this.serviceOrdersService.generateDeliveryFromServiceOrder(
        serviceOrderId,
        {
          notes: `Entrega gerada automaticamente a partir da OS ${orderNumber}`,
        },
      );

      this.logger.log(
        `Entrega ${delivery.tracking_code} gerada automaticamente para OS ${orderNumber}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Erro ao gerar entrega automática para OS ${orderNumber}: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Verifica se deve gerar entrega automaticamente
   */
  private shouldAutoGenerate(): boolean {
    return this.autoGenerateEnabled;
  }

  /**
   * Verifica se o tipo de ordem deve gerar entrega
   */
  private shouldGenerateForType(orderType: OrderType): boolean {
    return this.autoGenerateForTypes.includes(orderType);
  }
}
