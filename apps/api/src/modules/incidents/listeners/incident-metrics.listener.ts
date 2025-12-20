import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { IncidentStatsCacheService } from '../services/incident-stats-cache.service';
import { IncidentGateway } from '../gateways/incident.gateway';
import { Incident } from '../entities/incident.entity';
import { IncidentStatus, IncidentSeverity, IncidentType } from '../enums/incident.enums';

/**
 * Interface para eventos de incidentes
 */
interface IncidentCreatedEvent {
  incident: Incident;
}

interface IncidentStatusChangedEvent {
  incident: Incident;
  oldStatus: IncidentStatus;
  newStatus: IncidentStatus;
}

interface IncidentUpdatedEvent {
  incident: Incident;
  changes: Partial<Incident>;
}

/**
 * Listener para eventos de incidentes que atualiza métricas
 * em tempo real de forma incremental
 */
@Injectable()
export class IncidentMetricsListener implements OnModuleInit {
  private readonly logger = new Logger(IncidentMetricsListener.name);

  constructor(
    private readonly cacheService: IncidentStatsCacheService,
    private readonly gateway: IncidentGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit(): void {
    this.logger.log('Incident Metrics Listener initialized');
  }

  /**
   * Atualiza métricas quando um novo incidente é criado
   */
  @OnEvent('incident.created')
  async handleIncidentCreated(payload: IncidentCreatedEvent): Promise<void> {
    const { incident } = payload;

    this.logger.debug(`Handling incident.created: ${incident.id}`);

    try {
      // Atualizar métricas incrementais
      await this.cacheService.updateIncrementalMetrics({
        status: incident.status,
        severity: incident.severity,
        type: incident.incident_type,
        increment: 1,
      });

      // Incrementar contadores específicos
      await this.cacheService.incrementCounter('total_incidents');
      await this.cacheService.incrementCounter(`status:${incident.status}`);
      await this.cacheService.incrementCounter(`severity:${incident.severity}`);
      await this.cacheService.incrementCounter(`type:${incident.incident_type}`);

      // Invalidar cache de estatísticas
      await this.cacheService.invalidateIncidentCache({
        status: incident.status,
        severity: incident.severity,
        type: incident.incident_type,
      });

      // Emitir evento WebSocket com métricas atualizadas
      await this.emitMetricsUpdate('incident_created');

      this.logger.log(`Metrics updated for new incident: ${incident.id}`);
    } catch (error) {
      this.logger.error(`Error updating metrics for incident ${incident.id}:`, error);
    }
  }

  /**
   * Atualiza métricas quando status de incidente muda
   */
  @OnEvent('incident.status_changed')
  async handleStatusChanged(payload: IncidentStatusChangedEvent): Promise<void> {
    const { incident, oldStatus, newStatus } = payload;

    this.logger.debug(
      `Handling incident.status_changed: ${incident.id} (${oldStatus} -> ${newStatus})`,
    );

    try {
      // Decrementar contador do status antigo
      await this.cacheService.incrementCounter(`status:${oldStatus}`, -1);

      // Incrementar contador do novo status
      await this.cacheService.incrementCounter(`status:${newStatus}`, 1);

      // Se mudou para resolvido/fechado, incrementar contador
      if (newStatus === IncidentStatus.RESOLVED || newStatus === IncidentStatus.CLOSED) {
        await this.cacheService.incrementCounter('resolved_incidents');
      }

      // Se saiu de resolvido/fechado, decrementar contador
      if (oldStatus === IncidentStatus.RESOLVED || oldStatus === IncidentStatus.CLOSED) {
        await this.cacheService.incrementCounter('resolved_incidents', -1);
      }

      // Invalidar cache
      await this.cacheService.invalidateIncidentCache({
        status: newStatus,
      });

      // Emitir evento WebSocket
      await this.emitMetricsUpdate('status_changed');

      this.logger.log(`Metrics updated for status change: ${incident.id}`);
    } catch (error) {
      this.logger.error(`Error updating metrics for status change ${incident.id}:`, error);
    }
  }

  /**
   * Atualiza métricas quando um incidente é atualizado
   */
  @OnEvent('incident.updated')
  async handleIncidentUpdated(payload: IncidentUpdatedEvent): Promise<void> {
    const { incident, changes } = payload;

    this.logger.debug(`Handling incident.updated: ${incident.id}`);

    try {
      // Se severidade mudou
      if (changes.severity && changes.severity !== incident.severity) {
        await this.cacheService.incrementCounter(`severity:${incident.severity}`, -1);
        await this.cacheService.incrementCounter(`severity:${changes.severity}`, 1);
      }

      // Se tipo mudou
      if (changes.incident_type && changes.incident_type !== incident.incident_type) {
        await this.cacheService.incrementCounter(`type:${incident.incident_type}`, -1);
        await this.cacheService.incrementCounter(`type:${changes.incident_type}`, 1);
      }

      // Invalidar cache
      await this.cacheService.invalidateIncidentCache({
        severity: incident.severity,
        type: incident.incident_type,
      });

      // Emitir evento WebSocket
      await this.emitMetricsUpdate('incident_updated');

      this.logger.log(`Metrics updated for incident update: ${incident.id}`);
    } catch (error) {
      this.logger.error(`Error updating metrics for incident update ${incident.id}:`, error);
    }
  }

  /**
   * Atualiza métricas quando um incidente é deletado
   */
  @OnEvent('incident.deleted')
  async handleIncidentDeleted(payload: { incident: Incident }): Promise<void> {
    const { incident } = payload;

    this.logger.debug(`Handling incident.deleted: ${incident.id}`);

    try {
      // Decrementar contadores
      await this.cacheService.incrementCounter('total_incidents', -1);
      await this.cacheService.incrementCounter(`status:${incident.status}`, -1);
      await this.cacheService.incrementCounter(`severity:${incident.severity}`, -1);
      await this.cacheService.incrementCounter(`type:${incident.incident_type}`, -1);

      // Atualizar métricas incrementais
      await this.cacheService.updateIncrementalMetrics({
        status: incident.status,
        severity: incident.severity,
        type: incident.incident_type,
        increment: -1,
      });

      // Invalidar cache
      await this.cacheService.invalidateIncidentCache({
        status: incident.status,
        severity: incident.severity,
        type: incident.incident_type,
      });

      // Emitir evento WebSocket
      await this.emitMetricsUpdate('incident_deleted');

      this.logger.log(`Metrics updated for incident deletion: ${incident.id}`);
    } catch (error) {
      this.logger.error(`Error updating metrics for incident deletion ${incident.id}:`, error);
    }
  }

  /**
   * Emite atualização de métricas via WebSocket
   */
  private async emitMetricsUpdate(eventType: string): Promise<void> {
    try {
      const metrics = await this.cacheService.getIncrementalMetrics();

      if (metrics) {
        // Emitir para sala de métricas
        this.gateway.server.to('metrics').emit('metrics:updated', {
          event_type: eventType,
          metrics,
          timestamp: new Date(),
        });

        this.logger.debug(`Emitted metrics:updated event (${eventType})`);
      }
    } catch (error) {
      this.logger.error('Error emitting metrics update:', error);
    }
  }

  /**
   * Reseta todos os contadores (útil para testes ou manutenção)
   */
  async resetAllCounters(): Promise<void> {
    this.logger.warn('Resetting all metric counters');

    const counters = [
      'total_incidents',
      'resolved_incidents',
      ...Object.values(IncidentStatus).map(s => `status:${s}`),
      ...Object.values(IncidentSeverity).map(s => `severity:${s}`),
      ...Object.values(IncidentType).map(t => `type:${t}`),
    ];

    await Promise.all(counters.map(counter => this.cacheService.resetCounter(counter)));

    this.logger.log('All metric counters reset');
  }
}
