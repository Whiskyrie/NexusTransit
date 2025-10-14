import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { ContactType } from '../enums/contact-type.enum';
import { Customer } from './customer.entity';
import { Auditable } from '../decorators/auditable.decorator';

/**
 * CustomerContact Entity - Contatos adicionais de clientes
 *
 * Features:
 * - Múltiplos contatos por cliente
 * - Tipos de contato (email, telefone, etc)
 * - Contato principal
 */
@Entity('customer_contacts')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  entityDisplayName: 'Contato do Cliente',
})
export class CustomerContact extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  customerId!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 100 })
  value!: string;

  @Column({ type: 'enum', enum: ContactType })
  type: ContactType = ContactType.EMAIL;

  @Column({ type: 'boolean', default: false })
  isPrimary = false;

  @Column({ type: 'boolean', default: true })
  isActive = false;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => Customer, (customer: Customer) => customer.contacts, {
    onDelete: 'CASCADE',
  })
  customer!: Customer;
}
