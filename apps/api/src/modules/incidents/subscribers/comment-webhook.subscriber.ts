import { EntitySubscriberInterface, EventSubscriber, InsertEvent, DataSource } from 'typeorm';
import { Logger, Injectable, Inject, forwardRef } from '@nestjs/common';
import { IncidentComment } from '../entities/incident-comment.entity';
import { WebhookTriggerService } from '../services/webhook-trigger.service';
import { IncidentGateway } from '../gateways/incident.gateway';

/**
 * Subscriber para disparar webhooks e eventos WebSocket em eventos de comentários
 */
@Injectable()
@EventSubscriber()
export class CommentWebhookSubscriber implements EntitySubscriberInterface<IncidentComment> {
  private readonly logger = new Logger(CommentWebhookSubscriber.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly webhookTriggerService: WebhookTriggerService,
    @Inject(forwardRef(() => IncidentGateway))
    private readonly incidentGateway: IncidentGateway,
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
      // Disparar webhooks
      await this.webhookTriggerService.onCommentAdded(event.entity);

      // Emitir evento WebSocket
      this.incidentGateway.emitCommentAdded(event.entity.incident_id, {
        id: event.entity.id,
        comment_text: event.entity.comment_text,
        user_id: event.entity.user_id,
        created_at: event.entity.created_at,
        is_internal: event.entity.is_internal,
      });

      this.logger.debug(
        `WebSocket event emitted for comment added to incident ${event.entity.incident_id}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao disparar webhooks/WebSocket de comentário: ${errorMessage}`);
    }
  }
}
