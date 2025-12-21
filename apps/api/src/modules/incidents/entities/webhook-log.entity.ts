import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@nexus/common';
import { Webhook } from './webhook.entity';

/**
 * Status da tentativa de webhook
 */
export enum WebhookLogStatus {
  /** Sucesso */
  SUCCESS = 'SUCCESS',
  /** Falha */
  FAILED = 'FAILED',
  /** Pendente retry */
  PENDING_RETRY = 'PENDING_RETRY',
}

@Entity('webhook_logs')
export class WebhookLog extends BaseEntity {
  @ManyToOne(() => Webhook, webhook => webhook.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'webhook_id' })
  webhook!: Webhook;

  @Column({ type: 'uuid' })
  @Index()
  webhook_id!: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Evento que acionou o webhook',
  })
  @Index()
  event!: string;

  @Column({
    type: 'enum',
    enum: WebhookLogStatus,
    comment: 'Status da tentativa',
  })
  @Index()
  status!: WebhookLogStatus;

  @Column({
    type: 'int',
    comment: 'Código de status HTTP da resposta',
    nullable: true,
  })
  http_status?: number;

  @Column({
    type: 'int',
    default: 1,
    comment: 'Número da tentativa',
  })
  attempt_number!: number;

  @Column({
    type: 'jsonb',
    comment: 'Payload enviado',
  })
  request_payload!: Record<string, unknown>;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Headers da requisição',
  })
  request_headers?: Record<string, string>;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Corpo da resposta',
  })
  response_body?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Headers da resposta',
  })
  response_headers?: Record<string, string>;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Tempo de resposta em milissegundos',
  })
  response_time_ms?: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Mensagem de erro, se houver',
  })
  error_message?: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Data e hora da tentativa',
  })
  @Index()
  triggered_at!: Date;
}
