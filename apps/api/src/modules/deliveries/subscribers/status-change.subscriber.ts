import { EntitySubscriberInterface, EventSubscriber, UpdateEvent, Repository } from 'typeorm';
import { Logger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Delivery } from '../entities/delivery.entity';
import { DeliveryStatusHistory } from '../entities/delivery-status-history.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';

/**
 * Subscriber para rastreamento automático de mudanças de status
 *
 * Automaticamente cria registros no histórico quando o status de uma entrega muda
 * Permite rastreabilidade completa do ciclo de vida da entrega
 */
@Injectable()
@EventSubscriber()
export class StatusChangeSubscriber implements EntitySubscriberInterface<Delivery> {
  private readonly logger = new Logger(StatusChangeSubscriber.name);

  constructor(
    @InjectRepository(DeliveryStatusHistory)
    private readonly statusHistoryRepository: Repository<DeliveryStatusHistory>,
  ) {}

  /**
   * Indica que este subscriber é apenas para a entidade Delivery
   */
  listenTo(): typeof Delivery {
    return Delivery;
  }

  /**
   * Called after entity update.
   * Detecta mudanças de status e cria registro no histórico
   */
  async afterUpdate(event: UpdateEvent<Delivery>): Promise<void> {
    try {
      const entity = event.entity as Delivery;
      const databaseEntity = event.databaseEntity as Delivery | undefined;

      // Verifica se houve mudança no status
      if (!entity || !databaseEntity) {
        return;
      }

      const oldStatus = databaseEntity.status;
      const newStatus = entity.status;

      if (oldStatus === newStatus) {
        return;
      }

      this.logger.debug(
        `Mudança de status detectada na entrega ${entity.id}: ${oldStatus} -> ${newStatus}`,
      );

      // Prepara os dados do histórico
      const historyData: Partial<DeliveryStatusHistory> = {
        delivery_id: entity.id,
        from_status: oldStatus,
        to_status: newStatus,
        changed_at: new Date(),
        reason: this.generateStatusChangeNote(oldStatus, newStatus),
      };

      // Adiciona changed_by apenas se existir
      if (entity.driver_id) {
        historyData.changed_by = entity.driver_id;
      }

      // Cria registro no histórico
      const historyEntry = this.statusHistoryRepository.create(historyData);

      await this.statusHistoryRepository.save(historyEntry);

      this.logger.debug(`Registro de histórico criado para entrega ${entity.id}`);
    } catch (error) {
      this.logger.error('Erro ao registrar mudança de status:', error);
      // Não propaga o erro para não afetar a operação principal
    }
  }

  /**
   * Gera uma nota descritiva sobre a mudança de status
   */
  private generateStatusChangeNote(oldStatus: DeliveryStatus, newStatus: DeliveryStatus): string {
    const statusDescriptions: Record<DeliveryStatus, string> = {
      [DeliveryStatus.PENDING]: 'Aguardando atribuição',
      [DeliveryStatus.ASSIGNED]: 'Atribuída ao motorista',
      [DeliveryStatus.PICKED_UP]: 'Produto coletado',
      [DeliveryStatus.IN_TRANSIT]: 'Em trânsito',
      [DeliveryStatus.OUT_FOR_DELIVERY]: 'Saiu para entrega',
      [DeliveryStatus.DELIVERED]: 'Entregue com sucesso',
      [DeliveryStatus.FAILED]: 'Falha na entrega',
      [DeliveryStatus.CANCELLED]: 'Cancelada',
    };

    const oldDesc = statusDescriptions[oldStatus];
    const newDesc = statusDescriptions[newStatus];

    return `Status alterado de "${oldDesc}" para "${newDesc}"`;
  }
}
