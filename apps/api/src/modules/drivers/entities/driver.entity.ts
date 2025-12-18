import { Entity, Column, OneToOne, OneToMany, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from '@nexus/common';
import { DriverStatus } from '../enums/driver-status.enum';
import { EmploymentType } from '../enums/employment-type.enum';
import { DriverLicense } from './driver-license.entity';
import { DriverDocument } from './driver-document.entity';
import { DriverAvailability } from './driver-availability.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { DeliveryAttempt } from '../../deliveries/entities/delivery-attempt.entity';
import { DeliveryStatusHistory } from '../../deliveries/entities/delivery-status-history.entity';
import { Auditable } from '@nexus/audit';
import { Route } from '../../routes/entities/route.entity';
import { type ServiceOrder } from '../../service-orders/entities/service-order.entity';
import { type Vehicle } from '../../vehicles/entities/vehicle.entity';
import { TrackingEvent } from '../../tracking/entities/tracking-event.entity';

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

  // ===================================
  // Campos de CNH/Habilitação
  // ===================================

  @Column({
    type: 'varchar',
    length: 2,
    nullable: true,
    comment: 'UF emissora da CNH',
  })
  license_state?: string;

  // ===================================
  // Campos de MOPP
  // ===================================

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se o motorista possui certificação MOPP',
  })
  has_mopp!: boolean;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Número do certificado MOPP',
  })
  mopp_certificate_number?: string;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Data de vencimento do certificado MOPP',
  })
  mopp_expiry_date?: Date;

  // ===================================
  // Campos de Emprego
  // ===================================

  @Column({
    type: 'enum',
    enum: EmploymentType,
    nullable: true,
    comment: 'Tipo de vínculo empregatício',
  })
  employment_type?: EmploymentType;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Data de contratação do motorista',
  })
  hire_date?: Date;

  // ===================================
  // Contato de Emergência
  // ===================================

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Nome do contato de emergência',
  })
  emergency_contact_name?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Telefone do contato de emergência',
  })
  emergency_contact_phone?: string;

  // ===================================
  // Veículo Atual
  // ===================================

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do veículo atualmente atribuído ao motorista',
  })
  current_vehicle_id?: string;

  @ManyToOne('Vehicle', 'assigned_drivers', { nullable: true })
  @JoinColumn({ name: 'current_vehicle_id' })
  current_vehicle?: Relation<Vehicle>;

  // ===================================
  // Métricas e Estatísticas
  // ===================================

  @Column({
    type: 'integer',
    default: 0,
    comment: 'Total de viagens realizadas pelo motorista',
  })
  total_trips!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Total de quilômetros rodados pelo motorista',
  })
  total_distance!: number;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
    comment: 'Avaliação média do motorista (0-5)',
  })
  rating_average?: number;

  // ===================================
  // Observações
  // ===================================

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações gerais sobre o motorista',
  })
  notes?: string;

  // ===================================
  // Relacionamentos
  // ===================================

  @OneToOne(() => DriverLicense, license => license.driver)
  license!: DriverLicense;

  @OneToMany(() => DriverDocument, document => document.driver)
  documents!: DriverDocument[];

  @OneToMany(() => DriverAvailability, availability => availability.driver)
  availabilities?: DriverAvailability[];

  @OneToMany(() => Delivery, delivery => delivery.driver)
  deliveries!: Delivery[];

  @OneToMany(() => DeliveryAttempt, attempt => attempt.driver)
  delivery_attempts?: DeliveryAttempt[];

  @OneToMany(() => DeliveryStatusHistory, history => history.driver)
  delivery_status_histories?: DeliveryStatusHistory[];

  @OneToMany(() => Route, route => route.driver)
  routes?: Route[];

  @OneToMany('ServiceOrder', 'driver')
  @OneToMany(() => TrackingEvent, event => event.driver)
  tracking_events?: TrackingEvent[];
  service_orders?: Relation<ServiceOrder[]>;
}
