import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { AddressType } from '../enums/address-type.enum';
import { Customer } from './customer.entity';
import { RouteStop } from '@/modules/routes/entities/route_stop.entity';

@Entity('customer_addresses')
export class CustomerAddress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
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

  @Column({ type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => Customer, customer => customer.addresses, { onDelete: 'CASCADE' })
  customer!: Customer;

  @OneToMany(() => RouteStop, (stop) => stop.customer_address)
  route_stops!: RouteStop[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
