import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AddressType } from '../enums/address-type.enum';
import { Customer } from './customer.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';

@Entity('customer_addresses')
export class CustomerAddress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 18 })
  @Index()
  customerId!: string;

  @Column({ length: 100 })
  street!: string;

  @Column({ length: 20 })
  number!: string;

  @Column({ length: 100, nullable: true })
  complement?: string;

  @Column({ length: 50 })
  neighborhood!: string;

  @Column({ length: 8 })
  @Index()
  zipCode!: string;

  @Column({ length: 50 })
  city!: string;

  @Column({ length: 2 })
  @Index()
  state!: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column({ type: 'enum', enum: AddressType })
  type!: AddressType;

  @Column({ default: false })
  isPrimary!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => Customer, customer => customer.addresses, { onDelete: 'CASCADE' })
  customer!: Customer;

  @OneToMany(() => Delivery, delivery => delivery.pickupAddress)
  deliveriesAsPickup!: Delivery[];

  @OneToMany(() => Delivery, delivery => delivery.deliveryAddress)
  deliveriesAsDelivery!: Delivery[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
