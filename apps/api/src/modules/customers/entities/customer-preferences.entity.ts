import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Customer } from './customer.entity';
import { Auditable } from '../decorators/auditable.decorator';

/**
 * CustomerPreferences Entity - Preferências de entrega e notificação
 *
 * Features:
 * - Preferências de entrega personalizadas
 * - Canais de notificação preferidos
 * - Janelas de tempo para entrega
 * - Itens restritos e instruções especiais
 */
@Entity('customer_preferences')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  entityDisplayName: 'Preferências do Cliente',
})
export class CustomerPreferences extends BaseEntity {
  @Column({ name: 'customer_id', type: 'uuid' })
  @Index()
  customerId!: string;

  @Column({ name: 'preferred_delivery_days', type: 'text', array: true, nullable: true })
  preferredDeliveryDays?: string[];

  @Column({ name: 'preferred_delivery_time_start', type: 'time', nullable: true })
  preferredDeliveryTimeStart?: string;

  @Column({ name: 'preferred_delivery_time_end', type: 'time', nullable: true })
  preferredDeliveryTimeEnd?: string;

  @Column({ name: 'delivery_instructions', type: 'text', nullable: true })
  deliveryInstructions?: string;

  @Column({ name: 'notification_channels', type: 'text', array: true, nullable: true })
  notificationChannels?: string[];

  @Column({ name: 'delivery_preferences', type: 'jsonb', nullable: true })
  deliveryPreferences?: Record<string, unknown>;

  @Column({ name: 'restrictions', type: 'jsonb', nullable: true })
  restrictions?: Record<string, unknown>;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive = true;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => Customer, customer => customer.preferences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer = new Customer();
}
