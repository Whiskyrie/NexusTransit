import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  DataSource,
} from 'typeorm';
import { Logger, Injectable } from '@nestjs/common';
import { Incident } from '../entities/incident.entity';
import { WebhookTriggerService } from '../services/webhook-trigger.service';

/**
 * Subscriber para disparar webhooks em eventos de incidentes
 */
@Injectable()
@EventSubscriber()
export class IncidentWebhookSubscriber implements EntitySubscriberInterface<Incident> {
  private readonly logger = new Logger(IncidentWebhookSubscriber.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly webhookTriggerService: WebhookTriggerService,
  ) {
    this.dataSource.subscribers.push(this);
  }
  listenTo(): typeof Incident {
    return Incident;
  }

  async afterInsert(event: InsertEvent<Incident>): Promise<void> {
    if (!event.entity) {
      return;
    }

    try {
      await this.webhookTriggerService.onIncidentCreated(event.entity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao disparar webhooks de criação: ${errorMessage}`);
    }
  }

  async afterUpdate(event: UpdateEvent<Incident>): Promise<void> {
    if (!event.entity) {
      return;
    }

    try {
      const incident = event.entity as Incident;
      const changes: Record<string, { old: unknown; new: unknown }> = {};

      if (event.updatedColumns.length > 0) {
        event.updatedColumns.forEach(column => {
          const propertyName = column.propertyName as keyof Incident;
          const oldValue: unknown = event.databaseEntity?.[propertyName];
          const newValue: unknown = incident[propertyName];

          if (oldValue !== newValue) {
            changes[propertyName] = {
              old: oldValue,
              new: newValue,
            };
          }
        });
      }

      if (Object.keys(changes).length > 0) {
        await this.webhookTriggerService.onIncidentUpdated(incident, changes);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao disparar webhooks de atualização: ${errorMessage}`);
    }
  }
}
