import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Auditable } from '../decorators/auditable.decorator';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { TrackingEventType, TrackingStatus } from '../enums';

/**
 * Entidade de rastreamento de entregas
 *
 * Registra eventos e localizações durante o processo de entrega
 */
@Entity('tracking')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: false,
  excludeFields: ['updated_at', 'created_at', 'latitude', 'longitude'],
  entityDisplayName: 'Tracking',
})
@Index(['delivery_id', 'created_at'])
@Index(['status'])
@Index(['event_type'])
export class Tracking extends BaseEntity {
  @Column({
    type: 'uuid',
    comment: 'ID da entrega rastreada',
  })
  delivery_id!: string;

  @ManyToOne(() => Delivery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'delivery_id' })
  delivery?: Delivery;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Status atual do rastreamento',
  })
  status!: TrackingStatus;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Tipo de evento de rastreamento',
  })
  event_type!: TrackingEventType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    comment: 'Latitude da localização',
  })
  latitude?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    comment: 'Longitude da localização',
  })
  longitude?: number;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Endereço legível da localização',
  })
  location_address?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Cidade',
  })
  city?: string;

  @Column({
    type: 'varchar',
    length: 2,
    nullable: true,
    comment: 'Estado (UF)',
  })
  state?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição ou observações do evento',
  })
  description?: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'Nome do motorista/responsável',
  })
  driver_name?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Placa do veículo',
  })
  vehicle_plate?: string;

  @Column({
    type: 'timestamp',
    comment: 'Data e hora do evento',
    default: () => 'CURRENT_TIMESTAMP',
  })
  event_timestamp!: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados adicionais do evento',
  })
  metadata?: Record<string, unknown>;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se é uma entrega crítica',
  })
  is_critical!: boolean;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'Hub ou centro de distribuição',
  })
  hub_name?: string;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Número da tentativa de entrega',
  })
  delivery_attempt?: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Motivo de falha ou atraso',
  })
  failure_reason?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Previsão de entrega atualizada',
  })
  estimated_delivery?: Date;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Nome de quem recebeu a entrega',
  })
  received_by?: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL da foto/assinatura de comprovação',
  })
  proof_url?: string;
}
