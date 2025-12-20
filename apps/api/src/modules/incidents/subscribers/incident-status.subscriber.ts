import {
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
  DataSource,
  Repository,
} from 'typeorm';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Incident } from '../entities/incident.entity';
import { IncidentStatusHistory } from '../entities/incident-status-history.entity';
import { IncidentGateway } from '../gateways/incident.gateway';

/**
 * Subscriber para capturar automaticamente mudanças de status nos incidentes
 *
 * Sempre que o status de um incidente for alterado, este subscriber
 * registra a mudança no histórico automaticamente e emite evento WebSocket.
 */
@EventSubscriber()
export class IncidentStatusSubscriber implements EntitySubscriberInterface<Incident> {
  private readonly logger = new Logger(IncidentStatusSubscriber.name);
  private historyRepository!: Repository<IncidentStatusHistory>;

  constructor(
    dataSource: DataSource,
    @Inject(forwardRef(() => IncidentGateway))
    private readonly incidentGateway: IncidentGateway,
  ) {
    dataSource.subscribers.push(this);
    this.historyRepository = dataSource.getRepository(IncidentStatusHistory);
  }

  /**
   * Indica que este subscriber é específico para a entidade Incident
   */
  listenTo(): typeof Incident {
    return Incident;
  }

  /**
   * Antes de atualizar, capturamos o valor antigo do status
   */
  beforeUpdate(event: UpdateEvent<Incident>): void {
    if (!event.entity || !event.databaseEntity) {
      return;
    }

    const newStatus = event.entity.status as string;
    const oldStatus = event.databaseEntity.status as string;

    // Armazenar o status antigo no metadata do entity manager
    // para usar no afterUpdate
    if (newStatus !== oldStatus) {
      (event.entity as Incident & { __oldStatus?: string; __statusChanged?: boolean }).__oldStatus =
        oldStatus;
      (
        event.entity as Incident & { __oldStatus?: string; __statusChanged?: boolean }
      ).__statusChanged = true;

      this.logger.debug(
        `Status do incidente ${event.entity.id} será alterado: ${oldStatus} -> ${newStatus}`,
      );
    }
  }

  /**
   * Após atualizar, se o status mudou, registrar no histórico
   */
  async afterUpdate(event: UpdateEvent<Incident>): Promise<void> {
    const entity = event.entity as
      | (Incident & { __oldStatus?: string; __statusChanged?: boolean })
      | undefined;

    // Verificar se houve mudança de status
    if (!entity?.__statusChanged) {
      return;
    }

    const incident = entity as Incident;
    const oldStatus = entity.__oldStatus;
    const newStatus = incident.status;

    try {
      // Buscar o último registro de histórico para calcular tempo no status anterior
      const lastHistory = await this.historyRepository.findOne({
        where: { incident_id: incident.id },
        order: { created_at: 'DESC' },
      });

      let timeInPreviousStatus: number | undefined;
      if (lastHistory) {
        const now = new Date();
        const lastChange = new Date(lastHistory.created_at);
        timeInPreviousStatus = Math.floor((now.getTime() - lastChange.getTime()) / 1000);
      }

      // Criar registro no histórico
      const historyEntry = this.historyRepository.create({
        incident_id: incident.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by_user_id: incident.assigned_to_user_id ?? incident.reported_by_user_id,
        time_in_previous_status: timeInPreviousStatus,
        metadata: {
          severity: incident.severity,
          incident_type: incident.incident_type,
          automatic: true, // Indica que foi registrado automaticamente
        },
      });

      // Emitir evento WebSocket de mudança de status
      try {
        if (oldStatus && newStatus) {
          this.incidentGateway.emitStatusUpdated(incident.id, oldStatus, newStatus, {
            old_status: oldStatus,
            new_status: newStatus,
            changed_by_user_id: historyEntry.changed_by_user_id,
            time_in_previous_status: timeInPreviousStatus,
            severity: incident.severity,
            incident_type: incident.incident_type,
          });
        }
      } catch (wsError) {
        this.logger.error(
          `Erro ao emitir evento WebSocket para mudança de status do incidente ${incident.id}`,
          wsError instanceof Error ? wsError.stack : wsError,
        );
      }
      await this.historyRepository.save(historyEntry);

      this.logger.log(
        `Histórico registrado: Incidente ${incident.id} mudou de ${oldStatus} para ${newStatus} (${timeInPreviousStatus ? `${timeInPreviousStatus}s` : 'N/A'})`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao registrar histórico de status do incidente ${incident.id}`,
        error instanceof Error ? error.stack : error,
      );
    } finally {
      // Limpar flags temporárias
      if (entity) {
        delete (entity as Incident & { __oldStatus?: string; __statusChanged?: boolean })
          .__oldStatus;
        delete (entity as Incident & { __oldStatus?: string; __statusChanged?: boolean })
          .__statusChanged;
      }
    }
  }
}
