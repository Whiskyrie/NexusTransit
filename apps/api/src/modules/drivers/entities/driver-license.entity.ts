import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { CNHCategory } from '../enums/cnh-category.enum';
import { Driver } from './driver.entity';
import { Auditable } from '../decorators/auditable.decorator';

/**
 * Driver License Entity
 * Entidade para armazenar informações da CNH do motorista
 */
@Entity('driver_licenses')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: false,
  excludeFields: ['updated_at', 'created_at'],
  entityDisplayName: 'CNH',
})
export class DriverLicense extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 11,
    unique: true,
    comment: 'Número da CNH',
  })
  license_number!: string;

  @Column({
    type: 'enum',
    enum: CNHCategory,
    comment: 'Categoria da CNH',
  })
  category!: CNHCategory;

  @Column({
    type: 'date',
    comment: 'Data de emissão da CNH',
  })
  issue_date!: Date;

  @Column({
    type: 'date',
    comment: 'Data de validade da CNH',
  })
  expiration_date!: Date;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Órgão emissor da CNH',
  })
  issuing_authority!: string;

  @Column({
    type: 'varchar',
    length: 2,
    comment: 'UF do órgão emissor',
  })
  issuing_state!: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Indica se a CNH está ativa',
  })
  is_active!: boolean;

  @OneToOne(() => Driver, driver => driver.license)
  @JoinColumn({ name: 'driver_id' })
  driver!: Driver;
}
