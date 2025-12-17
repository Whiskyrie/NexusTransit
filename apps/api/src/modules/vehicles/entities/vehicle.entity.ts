import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '@nexus/common';
import { VehicleStatus } from '../enums/vehicle-status.enum';
import { VehicleType } from '../enums/vehicle-type.enum';
import { FuelType } from '../enums/fuel-type.enum';
import { LicensePlateType } from '../enums/license-plate-type.enum';
import { VehicleDocument } from './vehicle-document.entity';
import { VehicleMaintenance } from './vehicle-maintenance.entity';
import { VehicleDriverHistory } from './vehicle-driver-history.entity';
import { Auditable } from '@nexus/audit';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { Route } from '../../routes/entities/route.entity';

/**
 * Vehicle Entity - Sistema de gerenciamento de veículos
 *
 * Features:
 * - Controle completo da frota
 * - Rastreamento de manutenção
 * - Histórico de uso
 * - Integração com rotas e entregas
 * - Monitoramento de combustível
 */
@Entity('vehicles')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at', 'last_location_update'],
  entityDisplayName: 'Veículo',
})
export class Vehicle extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    comment: 'Placa do veículo',
  })
  license_plate!: string;

  @Column({
    type: 'enum',
    enum: LicensePlateType,
    default: LicensePlateType.MERCOSUL,
    comment: 'Tipo de formato da placa',
  })
  license_plate_type!: LicensePlateType;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Marca do veículo',
  })
  brand!: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Modelo do veículo',
  })
  model!: string;

  @Column({
    type: 'integer',
    comment: 'Ano de fabricação',
  })
  year!: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Cor do veículo',
  })
  color?: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
    comment: 'Tipo do veículo',
  })
  vehicle_type!: VehicleType;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.ACTIVE,
    comment: 'Status atual do veículo',
  })
  status!: VehicleStatus;

  @Column({
    type: 'enum',
    enum: FuelType,
    comment: 'Tipo de combustível',
  })
  fuel_type!: FuelType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Capacidade de carga em kg',
  })
  load_capacity?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Volume de carga em m³',
  })
  cargo_volume?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Capacidade do tanque em litros',
  })
  fuel_capacity?: number;

  @Column({
    type: 'integer',
    default: 0,
    comment: 'Quilometragem atual',
  })
  mileage!: number;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data da última manutenção',
  })
  last_maintenance_at?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data da próxima manutenção programada',
  })
  next_maintenance_at?: Date;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Próxima manutenção em km',
  })
  next_maintenance_km?: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Número do chassi',
  })
  chassis_number?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Número do RENAVAM',
  })
  renavam?: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data de aquisição do veículo',
  })
  acquisition_date?: Date;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    comment: 'Valor de aquisição',
  })
  acquisition_value?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Consumo médio em km/l',
  })
  average_consumption?: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Seguradora',
  })
  insurance_company?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Número da apólice de seguro',
  })
  insurance_policy_number?: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data de vencimento do seguro',
  })
  insurance_expiry_date?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data de vencimento do licenciamento',
  })
  license_expiry_date?: Date;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações gerais',
  })
  notes?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Informações de seguro',
  })
  insurance_info?: Record<string, unknown>;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Especificações técnicas adicionais',
  })
  specifications?: Record<string, unknown>;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Possui rastreamento GPS',
  })
  has_gps!: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Possui refrigeração',
  })
  has_refrigeration!: boolean;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Capacidade de passageiros',
  })
  passenger_capacity?: number;

  // Relacionamentos serão adicionados após criar outras entidades

  @OneToMany(() => VehicleDocument, document => document.vehicle, {
    cascade: true,
    eager: false,
  })
  documents!: VehicleDocument[];

  @OneToMany(() => VehicleMaintenance, maintenance => maintenance.vehicle, {
    cascade: true,
    eager: false,
  })
  maintenances!: VehicleMaintenance[];

  @OneToMany(() => VehicleDriverHistory, driverHistory => driverHistory.vehicle, {
    cascade: true,
    eager: false,
  })
  driverHistories!: VehicleDriverHistory[];

  @OneToMany(() => Delivery, delivery => delivery.vehicle)
  deliveries!: Delivery[];

  @OneToMany(() => Route, route => route.vehicle)
  routes!: Route[];

  // TODO: Adicionar relacionamento com Incident quando a entidade estiver implementada
  // @OneToMany(() => Incident, incident => incident.vehicle, {
  //   cascade: true,
  //   eager: false,
  // })
  // incidents!: Incident[];

  // Computed properties

  /**
   * Verifica se o veículo está disponível para uso
   */
  get is_available(): boolean {
    return this.status === VehicleStatus.ACTIVE;
  }

  /**
   * Verifica se o veículo precisa de manutenção
   */
  get needs_maintenance(): boolean {
    if (!this.next_maintenance_at) {
      return false;
    }
    return new Date() >= this.next_maintenance_at;
  }

  /**
   * Calcula a idade do veículo em anos
   */
  get age(): number {
    return new Date().getFullYear() - this.year;
  }

  /**
   * Verifica se é um veículo elétrico
   */
  get is_electric(): boolean {
    return this.fuel_type === FuelType.ELECTRIC;
  }

  /**
   * Identificação completa do veículo
   */
  get full_identification(): string {
    return `${this.brand} ${this.model} (${this.year}) - ${this.license_plate}`;
  }
}
