import { EntitySubscriberInterface, EventSubscriber, UpdateEvent } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Vehicle } from '../entities/vehicle.entity';
import { VehicleStatus } from '../enums/vehicle-status.enum'; // Ajuste o path conforme necessário

/**
 * TypeORM Subscriber que monitora mudanças de status em veículos
 * Cria histórico de alterações e logs automáticos
 */
@EventSubscriber()
export class VehicleStatusChangeSubscriber implements EntitySubscriberInterface<Vehicle> {
  private readonly logger = new Logger(VehicleStatusChangeSubscriber.name);

  /**
   * Indica qual entidade este subscriber monitora
   */
  listenTo(): typeof Vehicle {
    return Vehicle;
  }

  /**
   * Chamado antes de atualizar um veículo
   * Valida mudanças de status e registra histórico
   */
  beforeUpdate(event: UpdateEvent<Vehicle>): void {
    const entity = this.getVehicleEntity(event.entity);
    const databaseEntity = this.getVehicleEntity(event.databaseEntity);

    if (!entity || !databaseEntity) {
      return;
    }

    const newStatus = entity.status;
    const oldStatus = databaseEntity.status;

    if (newStatus && oldStatus && newStatus !== oldStatus) {
      this.logger.log(`Status do veículo ${entity.id} alterado: ${oldStatus} → ${newStatus}`);
    }
  }

  /**
   * Chamado após atualizar um veículo
   * Executa ações pós-mudança de status
   */
  afterUpdate(event: UpdateEvent<Vehicle>): void {
    const entity = this.getVehicleEntity(event.entity);
    const databaseEntity = this.getVehicleEntity(event.databaseEntity);

    if (!entity || !databaseEntity) {
      return;
    }

    const newStatus = entity.status;
    const oldStatus = databaseEntity.status;

    if (newStatus && oldStatus && newStatus !== oldStatus) {
      this.handleStatusChange(entity.id, newStatus);
    }
  }

  /**
   * Processa ações baseadas na mudança de status
   */
  private handleStatusChange(vehicleId: string | number, newStatus: VehicleStatus): void {
    switch (newStatus) {
      case VehicleStatus.MAINTENANCE:
        this.logger.warn(
          `Veículo ${vehicleId} entrou em manutenção. Entregas devem ser reatribuídas.`,
        );
        break;

      case VehicleStatus.ACTIVE:
        this.logger.log(`Veículo ${vehicleId} está ativo e disponível para novas entregas.`);
        break;

      case VehicleStatus.IN_ROUTE:
        this.logger.log(`Veículo ${vehicleId} iniciou uma rota.`);
        break;

      case VehicleStatus.INACTIVE:
        this.logger.warn(`Veículo ${vehicleId} foi desativado. Verificar entregas ativas.`);
        break;

      case VehicleStatus.OUT_OF_SERVICE:
        this.logger.warn(
          `Veículo ${vehicleId} está fora de serviço. Ações necessárias podem ser requeridas.`,
        );
        break;

      default: {
        // Exhaustive check - garante que todos os casos foram tratados
        const _exhaustiveCheck: never = newStatus;
        this.logger.warn(`Status desconhecido: ${String(_exhaustiveCheck)}`);
      }
    }
  }

  /**
   * Type guard para garantir que a entidade é um Vehicle válido
   */
  private getVehicleEntity(entity: unknown): Vehicle | null {
    if (!entity || typeof entity !== 'object') {
      return null;
    }

    if ('id' in entity && 'status' in entity) {
      return entity as Vehicle;
    }

    return null;
  }

  /**
   * Cria registro de histórico de mudança de status
   * (Implementar quando tiver a entidade VehicleStatusHistory)
   */
  // private async createStatusHistory(
  //   event: UpdateEvent<Vehicle>,
  //   entity: Vehicle,
  //   databaseEntity: Vehicle
  // ): Promise<void> {
  //   const historyRepository = event.manager.getRepository(VehicleStatusHistory);
  //
  //   await historyRepository.save({
  //     vehicle_id: entity.id,
  //     old_status: databaseEntity.status,
  //     new_status: entity.status,
  //     changed_at: new Date(),
  //     changed_by: entity.updated_by, // se existir campo de auditoria
  //   });
  // }
}
