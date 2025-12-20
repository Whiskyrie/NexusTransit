import { EntitySubscriberInterface, EventSubscriber, InsertEvent, DataSource } from 'typeorm';
import { Logger, Injectable } from '@nestjs/common';
import { IncidentAttachment } from '../entities/incident-attachment.entity';
import { WebhookTriggerService } from '../services/webhook-trigger.service';

/**
 * Subscriber para disparar webhooks em eventos de anexos
 */
@Injectable()
@EventSubscriber()
export class AttachmentWebhookSubscriber implements EntitySubscriberInterface<IncidentAttachment> {
  private readonly logger = new Logger(AttachmentWebhookSubscriber.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly webhookTriggerService: WebhookTriggerService,
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
      await this.webhookTriggerService.onAttachmentAdded(event.entity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao disparar webhooks de anexo: ${errorMessage}`);
    }
  }
}
