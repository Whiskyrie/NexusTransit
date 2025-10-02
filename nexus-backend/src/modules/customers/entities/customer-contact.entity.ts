import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ContactType } from '../enums/contact-type.enum';
import { Customer } from './customer.entity';

@Entity('customer_contacts')
export class CustomerContact {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 18 })
  @Index()
  customerId!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 100 })
  value!: string;

  @Column({ type: 'enum', enum: ContactType })
  type: ContactType = ContactType.EMAIL;

  @Column({ default: false })
  isPrimary = false;

  @Column({ default: true })
  isActive = false;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => Customer, (customer: Customer) => customer.contacts, {
    onDelete: 'CASCADE',
  })
  customer!: Customer;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
