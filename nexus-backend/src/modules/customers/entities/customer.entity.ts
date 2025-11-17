import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { CustomerType } from '../enums/customer-type.enum';
import { CustomerStatus } from '../enums/customer-status.enum';
import { CustomerCategory } from '../enums/customer-category.enum';
import { CustomerAddress } from './customer-address.entity';
import { CustomerContact } from './customer-contact.entity';
import { CustomerPreferences } from './customer-preferences.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { Auditable } from '../decorators/auditable.decorator';

/**
 * Customer Entity - Sistema de gerenciamento de clientes
 *
 * Features:
 * - Controle completo de clientes (PF e PJ)
 * - Gestão de endereços, contatos e preferências
 * - Sistema de categorias e status
 * - Integração com entregas
 */
@Entity('customers')
@Index(['taxId'])
@Index(['email'])
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['taxId', 'email', 'phone', 'updated_at', 'created_at'],
  entityDisplayName: 'Cliente',
})
export class Customer extends BaseEntity {
  @Column({ name: 'tax_id', unique: true, length: 18 })
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
}
