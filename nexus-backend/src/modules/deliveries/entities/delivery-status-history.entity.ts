import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { Delivery } from './delivery.entity';
import { Driver } from '../../drivers/entities/driver.entity';

/**
 * DeliveryStatusHistory Entity - Histórico de mudanças de status
 *
 * Features:
 * - Auditoria completa de mudanças de status
 * - Rastreamento de responsáveis pelas alterações
 * - Contexto e motivos das mudanças
 * - Integração com sistema de auditoria
 */
@Entity('delivery_status_history')
@Index(['delivery_id'])
@Index(['from_status'])
@Index(['to_status'])
@Index(['changed_at'])
@Index(['changed_by'])
export class DeliveryStatusHistory extends BaseEntity {
  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    nullable: true,
    comment: 'Status anterior da entrega',
  })
  from_status?: DeliveryStatus;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    comment: 'Novo status da entrega',
  })
  to_status!: DeliveryStatus;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Data/hora da mudança de status',
  })
  changed_at!: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do usuário que realizou a mudança',
  })
  changed_by?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Nome do usuário que realizou a mudança',
  })
  changed_by_name?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Tipo de usuário que realizou a mudança',
  })
  changed_by_type?: 'SYSTEM' | 'DRIVER' | 'ADMIN' | 'CUSTOMER' | 'API';

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Motivo da mudança de status',
  })
  reason?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Contexto adicional da mudança',
  })
  context?: {
    source?: 'WEB' | 'MOBILE' | 'API' | 'SYSTEM' | 'BATCH';
    ip_address?: string;
    user_agent?: string;
    session_id?: string;
    request_id?: string;
    batch_job_id?: string;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados de localização no momento da mudança',
  })
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados específicos do status',
  })
  status_metadata?: {
    // Para status PICKED_UP
    pickup_data?: {
      pickup_location?: string;
      package_condition?: 'GOOD' | 'DAMAGED' | 'SEALED';
      photos_taken?: number;
      documents_verified?: string[];
    };
    // Para status IN_TRANSIT
    transit_data?: {
      route_id?: string;
      estimated_arrival?: Date;
      checkpoints_passed?: string[];
      current_location?: string;
    };
    // Para status DELIVERED
    delivery_data?: {
      recipient_name?: string;
      recipient_document?: string;
      delivery_time?: Date;
      proof_types?: string[];
      photos_count?: number;
      signature_obtained?: boolean;
    };
    // Para status FAILED
    failure_data?: {
      failure_reason?: string;
      retry_attempt?: number;
      next_retry_date?: Date;
      customer_notified?: boolean;
      additional_info?: string;
    };
    // Para status CANCELLED
    cancellation_data?: {
      cancellation_reason?: string;
      refund_requested?: boolean;
      refund_amount?: number;
      customer_notified?: boolean;
      penalty_applied?: boolean;
    };
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados do motorista (se aplicável)',
  })
  driver_data?: {
    driver_id?: string;
    driver_name?: string;
    vehicle_id?: string;
    vehicle_plate?: string;
    odometer_reading?: number;
    fuel_level?: number;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Notificações enviadas relacionadas a esta mudança',
  })
  notifications?: {
    customer_notified?: boolean;
    customer_notified_at?: Date;
    customer_notification_method?: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH';
    admin_notified?: boolean;
    admin_notified_at?: Date;
    driver_notified?: boolean;
    driver_notified_at?: Date;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Impacto da mudança em outras entidades',
  })
  impact_data?: {
    affected_deliveries?: number;
    route_recalculated?: boolean;
    inventory_updated?: boolean;
    billing_processed?: boolean;
    sla_affected?: boolean;
  };

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se a mudança foi automática (sistema)',
  })
  automatic_change!: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se a mudança foi revertida',
  })
  reverted!: boolean;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do histórico que reverteu esta mudança',
  })
  reverted_by?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações internas sobre a mudança',
  })
  internal_notes?: string;

  // Relacionamentos
  @ManyToOne(() => Delivery, delivery => delivery.statusHistory, { nullable: false })
  @JoinColumn({ name: 'delivery_id' })
  delivery!: Delivery;

  @Column('uuid', { comment: 'ID da entrega' })
  delivery_id!: string;

  @ManyToOne(() => Driver, driver => driver.status_changes, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver?: Driver;

  @Column('uuid', { nullable: true, comment: 'ID do motorista' })
  driver_id?: string;
}
