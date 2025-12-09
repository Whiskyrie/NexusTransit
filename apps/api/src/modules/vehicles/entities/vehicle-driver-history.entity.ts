import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Vehicle } from './vehicle.entity';
import { Auditable } from '../decorators/auditable.decorator';

export enum DriverAssignmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

/**
 * VehicleDriverHistory Entity - Histórico de associação de veículos a motoristas
 *
 * Registra todas as associações entre veículos e motoristas:
 * - Associações ativas e históricas
 * - Período de uso do veículo
 * - Status da associação
 */
@Entity('vehicle_driver_histories')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  entityDisplayName: 'Histórico de Motorista do Veículo',
})
export class VehicleDriverHistory extends BaseEntity {
  @Column({
    type: 'uuid',
    comment: 'ID do motorista associado',
  })
  driver_id!: string;

  @Column({
    type: 'timestamp with time zone',
    comment: 'Data e hora de início da associação',
  })
  start_date!: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data e hora de término da associação',
  })
  end_date?: Date;

  @Column({
    type: 'enum',
    enum: DriverAssignmentStatus,
    default: DriverAssignmentStatus.ACTIVE,
    comment: 'Status da associação',
  })
  status!: DriverAssignmentStatus;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Motivo da associação ou observações',
  })
  reason?: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se esta é a associação atual',
  })
  is_current!: boolean;

  // Relacionamento com Vehicle
  @ManyToOne(() => Vehicle, vehicle => vehicle.driverHistories, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column('uuid')
  vehicle_id!: string;

  // Computed properties

  /**
   * Verifica se a associação está ativa
   */
  get is_active(): boolean {
    return this.status === DriverAssignmentStatus.ACTIVE && this.is_current;
  }

  /**
   * Calcula a duração total da associação em dias
   */
  get duration_days(): number | null {
    if (!this.start_date) {
      return null;
    }

    const endDate = this.end_date ?? new Date();
    const timeDiff = endDate.getTime() - this.start_date.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Retorna uma descrição resumida da associação
   */
  get summary(): string {
    const startDate = this.start_date.toLocaleDateString('pt-BR');
    const endDate = this.end_date ? this.end_date.toLocaleDateString('pt-BR') : 'Atual';
    return `Motorista ${this.driver_id} - ${startDate} a ${endDate}`;
  }
}
