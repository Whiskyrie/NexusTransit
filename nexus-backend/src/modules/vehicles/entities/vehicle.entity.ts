import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { VehicleStatus } from '../enums/vehicle-status.enum';
import { VehicleType } from '../enums/vehicle-type.enum';
import { FuelType } from '../enums/fuel-type.enum';

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
export class Vehicle extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    comment: 'Placa do veículo',
  })
  license_plate!: string;

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
    default: VehicleStatus.INACTIVE,
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

  // Relacionamentos serão adicionados após criar outras entidades

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
