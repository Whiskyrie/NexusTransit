import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { Incident } from './entities/incident.entity';
import { IncidentAttachment } from './entities/incident-attachment.entity';
import { IncidentComment } from './entities/incident-comment.entity';
import { IncidentStatusHistory } from './entities/incident-status-history.entity';
import { Webhook } from './entities/webhook.entity';
import { WebhookLog } from './entities/webhook-log.entity';
import { StorageModule } from '../../../../../packages/storage/src/storage.module';

// Services
import { IncidentStateMachineService } from './services/incident-state-machine.service';
import { IncidentGeoService } from './services/incident-geo.service';
import { IncidentStatsService } from './services/incident-stats.service';
import { WebhookService } from './services/webhook.service';
import { WebhookTriggerService } from './services/webhook-trigger.service';

// Controllers
import { IncidentStatsController } from './controllers/incident-stats.controller';
import { WebhookController } from './controllers/webhook.controller';

// Subscribers
import { IncidentStatusSubscriber } from './subscribers/incident-status.subscriber';
import { IncidentWebhookSubscriber } from './subscribers/incident-webhook.subscriber';
import { CommentWebhookSubscriber } from './subscribers/comment-webhook.subscriber';
import { AttachmentWebhookSubscriber } from './subscribers/attachment-webhook.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Incident,
      IncidentAttachment,
      IncidentComment,
      IncidentStatusHistory,
      Webhook,
      WebhookLog,
    ]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    StorageModule.forRoot(),
  ],
  controllers: [IncidentsController, IncidentStatsController, WebhookController],
  providers: [
    IncidentsService,
    IncidentStateMachineService,
    IncidentGeoService,
    IncidentStatsService,
    WebhookService,
    WebhookTriggerService,
    IncidentStatusSubscriber,
    IncidentWebhookSubscriber,
    CommentWebhookSubscriber,
    AttachmentWebhookSubscriber,
  ],
  exports: [
    IncidentsService,
    IncidentStateMachineService,
    IncidentGeoService,
    IncidentStatsService,
    WebhookService,
    TypeOrmModule,
  ],
})
export class IncidentsModule {}
