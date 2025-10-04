import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DeliveryPreference } from '../enums/delivery-preference.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { Customer } from './customer.entity';

@Entity('customer_preferences')
export class CustomerPreferences {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
