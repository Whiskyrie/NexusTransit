import { Entity, Column, OneToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { DriverStatus } from '../enums/driver-status.enum';
import { DriverLicense } from './driver-license.entity';
import { DriverDocument } from './driver-document.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { DeliveryAttempt } from '../../deliveries/entities/delivery-attempt.entity';
import { DeliveryStatusHistory } from '../../deliveries/entities/delivery-status-history.entity';
import { Auditable } from '../decorators/auditable.decorator';

/**
 * Driver Entity - Sistema de gerenciamento de motoristas
 *
 * Features:
 * - Controle completo de motoristas
 * - Gestão de documentos e habilitação
 * - Histórico de veículos associados
 * - Sistema de status operacional
 */
@Entity('drivers')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['cpf', 'email', 'phone', 'updated_at', 'created_at'],
  entityDisplayName: 'Motorista',
})
export class Driver extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 11,
    unique: true,
    comment: 'CPF do motorista (apenas números)',
  })
  cpf!: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Nome completo do motorista',
  })
  full_name!: string;

  @Column({
    type: 'date',
    comment: 'Data de nascimento do motorista',
  })
  birth_date!: Date;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    comment: 'Email do motorista',
  })
  email!: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: 'Telefone do motorista',
  })
  phone!: string;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.AVAILABLE,
    comment: 'Status operacional do motorista',
  })
  status!: DriverStatus;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Indica se o motorista está ativo',
  })
  is_active!: boolean;

  @OneToOne(() => DriverLicense, license => license.driver)
  license!: DriverLicense;

  @OneToMany(() => DriverDocument, document => document.driver)
  documents!: DriverDocument[];

  @OneToMany(() => Delivery, delivery => delivery.driver)
  deliveries!: Delivery[];

  @OneToMany(() => DeliveryAttempt, attempt => attempt.driver)
  delivery_attempts!: DeliveryAttempt[];

  @OneToMany(() => DeliveryStatusHistory, history => history.driver)
  status_changes!: DeliveryStatusHistory[];
}
