import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { Incident } from './entities/incident.entity';
import { IncidentAttachment } from './entities/incident-attachment.entity';
import { IncidentComment } from './entities/incident-comment.entity';
import { IncidentStatusHistory } from './entities/incident-status-history.entity';
import { StorageModule } from '../../../../../packages/storage/src/storage.module';

// Services
import { IncidentStateMachineService } from './services/incident-state-machine.service';
import { IncidentGeoService } from './services/incident-geo.service';
import { IncidentStatsService } from './services/incident-stats.service';

// Controllers
import { IncidentStatsController } from './controllers/incident-stats.controller';

// Subscribers
import { IncidentStatusSubscriber } from './subscribers/incident-status.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Incident,
      IncidentAttachment,
      IncidentComment,
      IncidentStatusHistory,
    ]),
    StorageModule.forRoot(),
  ],
  controllers: [IncidentsController, IncidentStatsController],
  providers: [
    IncidentsService,
    IncidentStateMachineService,
    IncidentGeoService,
    IncidentStatsService,
    IncidentStatusSubscriber,
  ],
  exports: [
    IncidentsService,
    IncidentStateMachineService,
    IncidentGeoService,
    IncidentStatsService,
    TypeOrmModule,
  ],
})
export class IncidentsModule {}
