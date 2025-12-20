import { EntitySubscriberInterface, EventSubscriber, InsertEvent, DataSource } from 'typeorm';
import { Logger, Injectable } from '@nestjs/common';
import { IncidentComment } from '../entities/incident-comment.entity';
import { WebhookTriggerService } from '../services/webhook-trigger.service';

/**
 * Subscriber para disparar webhooks em eventos de comentários
 */
@Injectable()
@EventSubscriber()
export class CommentWebhookSubscriber implements EntitySubscriberInterface<IncidentComment> {
  private readonly logger = new Logger(CommentWebhookSubscriber.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly webhookTriggerService: WebhookTriggerService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  listenTo(): typeof IncidentComment {
    return IncidentComment;
  }

  async afterInsert(event: InsertEvent<IncidentComment>): Promise<void> {
    if (!event.entity) {
      return;
    }

    try {
      await this.webhookTriggerService.onCommentAdded(event.entity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao disparar webhooks de comentário: ${errorMessage}`);
    }
  }
}
