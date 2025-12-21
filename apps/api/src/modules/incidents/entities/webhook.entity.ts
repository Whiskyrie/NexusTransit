import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '@nexus/common';
import { WebhookLog } from './webhook-log.entity';
import { Auditable } from '@nexus/audit';

/**
 * Eventos que podem acionar webhooks
 */
export enum WebhookEvent {
  /** Incidente criado */
  INCIDENT_CREATED = 'incident.created',
  /** Incidente atualizado */
  INCIDENT_UPDATED = 'incident.updated',
  /** Status alterado */
  INCIDENT_STATUS_CHANGED = 'incident.status_changed',
  /** Severidade alterada */
  INCIDENT_SEVERITY_CHANGED = 'incident.severity_changed',
  /** Incidente resolvido */
  INCIDENT_RESOLVED = 'incident.resolved',
  /** Incidente fechado */
  INCIDENT_CLOSED = 'incident.closed',
  /** Comentário adicionado */
  INCIDENT_COMMENT_ADDED = 'incident.comment_added',
  /** Anexo adicionado */
  INCIDENT_ATTACHMENT_ADDED = 'incident.attachment_added',
}

@Entity('webhooks')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at', 'deleted_at'],
  entityDisplayName: 'Webhook',
})
export class Webhook extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 200,
    comment: 'Nome descritivo do webhook',
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 500,
    comment: 'URL de destino para o webhook',
  })
  @Index()
  url!: string;

  @Column({
    type: 'enum',
    enum: WebhookEvent,
    array: true,
    comment: 'Eventos que acionam este webhook',
  })
  events!: WebhookEvent[];

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Indica se o webhook está ativo',
  })
  @Index()
  is_active!: boolean;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Secret para assinatura HMAC dos payloads',
  })
  secret?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Headers HTTP customizados',
  })
  custom_headers?: Record<string, string>;

  @Column({
    type: 'int',
    default: 3,
    comment: 'Número máximo de tentativas de retry',
  })
  max_retries!: number;

  @Column({
    type: 'int',
    default: 5000,
    comment: 'Timeout em milissegundos para requisição HTTP',
  })
  timeout_ms!: number;

  @Column({
    type: 'varchar',
    length: 1000,
    nullable: true,
    comment: 'Descrição do webhook',
  })
  description?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados adicionais',
  })
  metadata?: Record<string, unknown>;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data da última vez que o webhook foi disparado com sucesso',
  })
  last_triggered_at?: Date;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Contador de falhas consecutivas',
  })
  consecutive_failures!: number;

  @OneToMany(() => WebhookLog, log => log.webhook)
  logs?: WebhookLog[];
}
