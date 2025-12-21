import { EntitySubscriberInterface, EventSubscriber, InsertEvent, DataSource } from 'typeorm';
import { Logger, Injectable, Inject, forwardRef } from '@nestjs/common';
import { IncidentAttachment } from '../entities/incident-attachment.entity';
import { WebhookTriggerService } from '../services/webhook-trigger.service';
import { IncidentGateway } from '../gateways/incident.gateway';

/**
 * Subscriber para disparar webhooks e eventos WebSocket em eventos de anexos
 */
@Injectable()
@EventSubscriber()
export class AttachmentWebhookSubscriber implements EntitySubscriberInterface<IncidentAttachment> {
  private readonly logger = new Logger(AttachmentWebhookSubscriber.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly webhookTriggerService: WebhookTriggerService,
    @Inject(forwardRef(() => IncidentGateway))
    private readonly incidentGateway: IncidentGateway,
  ) {
    this.dataSource.subscribers.push(this);
  }

  listenTo(): typeof IncidentAttachment {
    return IncidentAttachment;
  }

  async afterInsert(event: InsertEvent<IncidentAttachment>): Promise<void> {
    if (!event.entity) {
      return;
    }

    try {
      // Disparar webhooks
      await this.webhookTriggerService.onAttachmentAdded(event.entity);

      // Emitir evento WebSocket
      this.incidentGateway.emitAttachmentAdded(event.entity.incident_id, {
        id: event.entity.id,
        file_name: event.entity.file_name,
        file_size: event.entity.file_size,
        file_type: event.entity.file_type,
        uploaded_by_user_id: event.entity.uploaded_by_user_id,
        created_at: event.entity.created_at,
      });

      this.logger.debug(
        `WebSocket event emitted for attachment added to incident ${event.entity.incident_id}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao disparar webhooks/WebSocket de anexo: ${errorMessage}`);
    }
  }
}
