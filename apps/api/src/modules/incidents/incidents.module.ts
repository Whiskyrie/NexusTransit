import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { IncidentStatsCacheService } from './services/incident-stats-cache.service';
import { IncidentExportService } from './services/incident-export.service';
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

// Gateways
import { IncidentGateway } from './gateways/incident.gateway';

// Schedulers
import { IncidentReportScheduler } from './schedulers/incident-report.scheduler';

// Listeners
import { IncidentMetricsListener } from './listeners/incident-metrics.listener';

// Interceptors
import { CacheInterceptor } from './interceptors/cache.interceptor';

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
    CacheModule.register({
      ttl: 60, // Padrão 60 segundos
      max: 100, // Máximo 100 itens em cache
    }),
    EventEmitterModule.forRoot(),
    StorageModule.forRoot(),
  ],
  controllers: [IncidentsController, IncidentStatsController, WebhookController],
  providers: [
    // Core Services
    IncidentsService,
    IncidentStateMachineService,
    IncidentGeoService,
    IncidentStatsService,
    IncidentStatsCacheService,
    IncidentExportService,
    WebhookService,
    WebhookTriggerService,

    // Gateways
    IncidentGateway,

    // Schedulers
    IncidentReportScheduler,

    // Listeners
    IncidentMetricsListener,

    // Subscribers
    IncidentStatusSubscriber,
    IncidentWebhookSubscriber,
    CommentWebhookSubscriber,
    AttachmentWebhookSubscriber,

    // Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
  exports: [
    IncidentsService,
    IncidentStateMachineService,
    IncidentGeoService,
    IncidentStatsService,
    IncidentStatsCacheService,
    WebhookService,
    TypeOrmModule,
  ],
})
export class IncidentsModule {}
