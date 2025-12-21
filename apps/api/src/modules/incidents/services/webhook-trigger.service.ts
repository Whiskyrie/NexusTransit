import { Injectable, Logger } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookEvent } from '../entities/webhook.entity';
import { Incident } from '../entities/incident.entity';
import { IncidentComment } from '../entities/incident-comment.entity';
import { IncidentAttachment } from '../entities/incident-attachment.entity';
import { IncidentStatus } from '../enums/incident.enums';

/**
 * Service para disparar webhooks baseado em eventos de incidentes
 */
@Injectable()
export class WebhookTriggerService {
  private readonly logger = new Logger(WebhookTriggerService.name);

  constructor(private readonly webhookService: WebhookService) {}

  /**
   * Dispara webhooks para criação de incidente
   */
  async onIncidentCreated(incident: Incident): Promise<void> {
    this.logger.debug(`Disparando webhooks para incidente criado: ${incident.id}`);

    await this.webhookService.trigger(WebhookEvent.INCIDENT_CREATED, {
      incident_id: incident.id,
      incident_number: incident.incident_number,
      title: incident.title,
      status: incident.status,
      severity: incident.severity,
      incident_type: incident.incident_type,
      created_at: incident.created_at,
      driver_id: incident.driver_id,
      delivery_id: incident.delivery_id,
    });
  }

  /**
   * Dispara webhooks para atualização de incidente
   */
  async onIncidentUpdated(incident: Incident, changes: Record<string, unknown>): Promise<void> {
    this.logger.debug(`Disparando webhooks para incidente atualizado: ${incident.id}`);

    await this.webhookService.trigger(WebhookEvent.INCIDENT_UPDATED, {
      incident_id: incident.id,
      incident_number: incident.incident_number,
      title: incident.title,
      status: incident.status,
      severity: incident.severity,
      incident_type: incident.incident_type,
      updated_at: incident.updated_at,
      changes,
    });

    // Disparar eventos específicos se status ou severity mudaram
    if (changes.status) {
      await this.onIncidentStatusChanged(incident, changes.status as string);
    }

    if (changes.severity) {
      await this.onIncidentSeverityChanged(incident, changes.severity as string);
    }
  }

  /**
   * Dispara webhooks para mudança de status
   */
  async onIncidentStatusChanged(incident: Incident, previousStatus: string): Promise<void> {
    this.logger.debug(`Disparando webhooks para mudança de status: ${incident.id}`);

    await this.webhookService.trigger(WebhookEvent.INCIDENT_STATUS_CHANGED, {
      incident_id: incident.id,
      title: incident.title,
      previous_status: previousStatus,
      current_status: incident.status,
      changed_at: incident.updated_at,
    });

    // Disparar eventos específicos para resolvido e fechado
    if (incident.status === IncidentStatus.RESOLVED) {
      await this.onIncidentResolved(incident);
    } else if (incident.status === IncidentStatus.CLOSED) {
      await this.onIncidentClosed(incident);
    }
  }

  /**
   * Dispara webhooks para mudança de severidade
   */
  async onIncidentSeverityChanged(incident: Incident, previousSeverity: string): Promise<void> {
    this.logger.debug(`Disparando webhooks para mudança de severidade: ${incident.id}`);

    await this.webhookService.trigger(WebhookEvent.INCIDENT_SEVERITY_CHANGED, {
      incident_id: incident.id,
      title: incident.title,
      previous_severity: previousSeverity,
      current_severity: incident.severity,
      changed_at: incident.updated_at,
    });
  }

  /**
   * Dispara webhooks para incidente resolvido
   */
  async onIncidentResolved(incident: Incident): Promise<void> {
    this.logger.debug(`Disparando webhooks para incidente resolvido: ${incident.id}`);

    await this.webhookService.trigger(WebhookEvent.INCIDENT_RESOLVED, {
      incident_id: incident.id,
      incident_number: incident.incident_number,
      title: incident.title,
      severity: incident.severity,
      incident_type: incident.incident_type,
      resolved_at: incident.resolved_at,
      resolution_notes: incident.resolution_notes,
    });
  }

  /**
   * Dispara webhooks para incidente fechado
   */
  async onIncidentClosed(incident: Incident): Promise<void> {
    this.logger.debug(`Disparando webhooks para incidente fechado: ${incident.id}`);

    await this.webhookService.trigger(WebhookEvent.INCIDENT_CLOSED, {
      incident_id: incident.id,
      incident_number: incident.incident_number,
      title: incident.title,
      severity: incident.severity,
      incident_type: incident.incident_type,
      closed_at: incident.updated_at,
      resolution_notes: incident.resolution_notes,
    });
  }

  /**
   * Dispara webhooks para comentário adicionado
   */
  async onCommentAdded(comment: IncidentComment): Promise<void> {
    this.logger.debug(`Disparando webhooks para comentário adicionado: ${comment.id}`);

    await this.webhookService.trigger(WebhookEvent.INCIDENT_COMMENT_ADDED, {
      incident_id: comment.incident_id,
      comment_id: comment.id,
      user_id: comment.user_id,
      comment_text: comment.comment_text,
      is_internal: comment.is_internal,
      created_at: comment.created_at,
    });
  }

  /**
   * Dispara webhooks para anexo adicionado
   */
  async onAttachmentAdded(attachment: IncidentAttachment): Promise<void> {
    this.logger.debug(`Disparando webhooks para anexo adicionado: ${attachment.id}`);

    await this.webhookService.trigger(WebhookEvent.INCIDENT_ATTACHMENT_ADDED, {
      incident_id: attachment.incident_id,
      attachment_id: attachment.id,
      file_name: attachment.file_name,
      file_size: attachment.file_size,
      mime_type: attachment.mime_type,
      file_type: attachment.file_type,
      uploaded_at: attachment.created_at,
    });
  }
}
