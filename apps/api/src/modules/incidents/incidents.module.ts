import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { Incident } from './entities/incident.entity';
import { IncidentAttachment } from './entities/incident-attachment.entity';
import { IncidentComment } from './entities/incident-comment.entity';
import { StorageModule } from '../../../../../packages/storage/src/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Incident, IncidentAttachment, IncidentComment]),
    StorageModule.forRoot(),
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService, TypeOrmModule],
})
export class IncidentsModule {}
