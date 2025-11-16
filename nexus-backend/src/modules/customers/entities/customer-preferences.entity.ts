import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { DeliveryPreference } from '../enums/delivery-preference.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';
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
  @Column({ type: 'uuid' })
  @Index()
  customerId!: string;

  @Column({ type: 'enum', enum: DeliveryPreference, default: DeliveryPreference.STANDARD })
  deliveryPreference: DeliveryPreference = DeliveryPreference.STANDARD;

  @Column({ type: 'enum', enum: NotificationChannel, default: NotificationChannel.EMAIL })
  preferredNotificationChannel: NotificationChannel = NotificationChannel.EMAIL;

  @Column({ type: 'jsonb', nullable: true })
  deliveryTimeWindows?: string[];

  @Column({ type: 'jsonb', nullable: true })
  restrictedItems?: string[];

  @Column({ type: 'boolean', default: false })
  allowWeekendDelivery = false;

  @Column({ type: 'boolean', default: true })
  requireSignature = false;

  @Column({ type: 'jsonb', nullable: true })
  specialInstructions?: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => Customer, customer => customer.preferences, { onDelete: 'CASCADE' })
  customer: Customer = new Customer();
}
