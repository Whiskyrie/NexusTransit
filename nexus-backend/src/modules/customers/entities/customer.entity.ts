import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { CustomerType } from '../enums/customer-type.enum';
import { CustomerStatus } from '../enums/customer-status.enum';
import { CustomerCategory } from '../enums/customer-category.enum';
import { CustomerAddress } from './customer-address.entity';
import { CustomerContact } from './customer-contact.entity';
import { CustomerPreferences } from './customer-preferences.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';

@Entity('customers')
@Index(['taxId'])
@Index(['email'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 18 })
  @Index()
  taxId!: string;

  @Column({ length: 100 })
  @Index()
  name!: string;

  @Column({ unique: true, length: 100 })
  @Index()
  email!: string;

  @Column({ length: 20 })
  phone!: string;

  @Column({ type: 'enum', enum: CustomerType })
  type!: CustomerType;

  @Column({ type: 'enum', enum: CustomerStatus, default: CustomerStatus.PROSPECT })
  status!: CustomerStatus;

  @Column({ type: 'enum', enum: CustomerCategory, default: CustomerCategory.STANDARD })
  category!: CustomerCategory;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @OneToMany(() => CustomerAddress, address => address.customer, { cascade: true })
  addresses!: CustomerAddress[];

  @OneToMany(() => CustomerContact, contact => contact.customer, { cascade: true })
  contacts!: CustomerContact[];

  @OneToMany(() => CustomerPreferences, preferences => preferences.customer, { cascade: true })
  preferences!: CustomerPreferences[];

  @OneToMany(() => Delivery, delivery => delivery.customer)
  deliveries!: Delivery[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt?: Date;
}
