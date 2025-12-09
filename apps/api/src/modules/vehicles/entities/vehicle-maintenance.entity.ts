import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Vehicle } from './vehicle.entity';
import { Auditable } from '../decorators/auditable.decorator';

export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  REVIEW = 'review',
  EMERGENCY = 'emergency',
  INSPECTION = 'inspection',
  OTHER = 'other',
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * VehicleMaintenance Entity - Histórico de manutenções dos veículos
 *
 * Registra todas as manutenções realizadas nos veículos:
 * - Manutenções preventivas
 * - Manutenções corretivas
 * - Revisões obrigatórias
 * - Inspeções
 * - Reparos de emergência
 */
@Entity('vehicle_maintenances')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  entityDisplayName: 'Manutenção do Veículo',
})
export class VehicleMaintenance extends BaseEntity {
  @Column({
    type: 'enum',
    enum: MaintenanceType,
    comment: 'Tipo de manutenção realizada',
  })
  maintenance_type!: MaintenanceType;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
    comment: 'Status atual da manutenção',
  })
  status!: MaintenanceStatus;

  @Column({
    type: 'varchar',
    length: 200,
    comment: 'Título ou resumo da manutenção',
  })
  title!: string;

  @Column({
    type: 'text',
    comment: 'Descrição detalhada dos serviços realizados',
  })
  description!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Custo total da manutenção',
  })
  cost!: number;

  @Column({
    type: 'date',
    comment: 'Data em que a manutenção foi realizada ou agendada',
  })
  maintenance_date!: Date;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Data de início da manutenção (para serviços que demoram dias)',
  })
  start_date?: Date;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Data de conclusão da manutenção',
  })
  completion_date?: Date;

  @Column({
    type: 'integer',
    comment: 'Quilometragem do veículo no momento da manutenção',
  })
  mileage_at_maintenance!: number;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'Nome da oficina ou prestador de serviço',
  })
  service_provider?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Telefone de contato do prestador de serviço',
  })
  service_provider_contact?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Endereço do local onde foi realizada a manutenção',
  })
  service_location?: string;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Data programada para a próxima manutenção deste tipo',
  })
  next_maintenance_date?: Date;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Quilometragem prevista para a próxima manutenção',
  })
  next_maintenance_mileage?: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Número da ordem de serviço ou nota fiscal',
  })
  service_order_number?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Garantia oferecida pelo serviço (ex: 6 meses, 10.000 km)',
  })
  warranty_period?: string;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Data de expiração da garantia do serviço',
  })
  warranty_expiry_date?: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Lista de peças utilizadas na manutenção',
  })
  parts_used?: {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    part_number?: string;
    supplier?: string;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Lista de serviços realizados',
  })
  services_performed?: {
    service: string;
    duration_hours: number;
    cost: number;
    technician?: string;
  }[];

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações adicionais sobre a manutenção',
  })
  notes?: string;

  @Column({
    type: 'integer',
    default: 0,
    comment: 'Avaliação da qualidade do serviço (0-5 estrelas)',
  })
  service_rating?: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Comentários sobre a avaliação do serviço',
  })
  rating_comments?: string;

  // Relacionamento com Vehicle
  @ManyToOne(() => Vehicle, (vehicle: Vehicle) => vehicle.maintenances, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column('uuid')
  vehicle_id!: string;

  // Computed properties

  /**
   * Calcula a duração total da manutenção em dias
   */
  get duration_days(): number | null {
    if (!this.start_date || !this.completion_date) {
      return null;
    }

    const timeDiff = this.completion_date.getTime() - this.start_date.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Verifica se a manutenção está atrasada
   */
  get is_overdue(): boolean {
    if (
      this.status === MaintenanceStatus.COMPLETED ||
      this.status === MaintenanceStatus.CANCELLED
    ) {
      return false;
    }

    return this.maintenance_date < new Date();
  }

  /**
   * Calcula o custo total das peças
   */
  get total_parts_cost(): number {
    if (!this.parts_used || this.parts_used.length === 0) {
      return 0;
    }

    return this.parts_used.reduce((total, part) => total + part.total_price, 0);
  }

  /**
   * Calcula o custo total dos serviços
   */
  get total_services_cost(): number {
    if (!this.services_performed || this.services_performed.length === 0) {
      return 0;
    }

    return this.services_performed.reduce((total, service) => total + service.cost, 0);
  }

  /**
   * Verifica se a garantia ainda está válida
   */
  get is_under_warranty(): boolean {
    if (!this.warranty_expiry_date) {
      return false;
    }

    return this.warranty_expiry_date > new Date();
  }

  /**
   * Retorna uma descrição resumida da manutenção
   */
  get summary(): string {
    const type = this.maintenance_type.replace('_', ' ').toUpperCase();
    const date = this.maintenance_date.toLocaleDateString('pt-BR');
    return `${type} - ${this.title} (${date})`;
  }
}
