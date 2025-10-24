import {
  Entity,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  BaseEntity,
} from 'typeorm';
import { AddressType } from '../enums/address-type.enum';
import { Customer } from './customer.entity';
import { RouteStop } from '@/modules/routes/entities/route_stop.entity';
import { Auditable } from '../decorators/auditable.decorator';

/**
 * CustomerAddress Entity - Endereços de clientes
 *
 * Features:
 * - Múltiplos endereços por cliente
 * - Geocodificação (latitude/longitude)
 * - Tipos de endereço (residencial, comercial, etc)
 * - Endereço principal
 */
@Entity('customer_addresses')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  entityDisplayName: 'Endereço do Cliente',
})
export class CustomerAddress extends BaseEntity {
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

  @OneToMany(() => RouteStop, stop => stop.customer_address)
  route_stops!: RouteStop[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
