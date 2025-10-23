import { Entity, Column, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Auditable } from '../../vehicles/decorators/auditable.decorator';
import { RouteStatus } from '../enums/route-status';
import { RouteType } from '../enums/route-type';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { RouteStop } from './route_stop.entity';
import { RouteHistory } from './route_history.entity';

/**
 * Route Entity - Sistema de gerenciamento de rotas
 *
 * Features:
 * - Gestão completa de rotas de entrega
 * - Relacionamento com veículo e motorista
 * - Controle de pontos de entrega sequenciais
 * - Validação de disponibilidade
 * - Histórico completo de alterações
 * - Cálculo de métricas (distância, tempo)
 */
@Entity('routes')
@Index(['route_code'], { unique: true })
@Index(['status'])
@Index(['type'])
@Index(['vehicle_id'])
@Index(['driver_id'])
@Index(['planned_date'])
@Index(['created_at'])
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  entityDisplayName: 'Rota',
})
export class Route extends BaseEntity {
  // Identificação
  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    comment: 'Código único da rota',
  })
  route_code!: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Nome identificador da rota',
  })
  name!: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição detalhada da rota',
  })
  description?: string;

  // Relacionamento com Veículo
  @ManyToOne(() => Vehicle, vehicle => vehicle.routes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column({
    type: 'uuid',
    comment: 'ID do veículo',
  })
  vehicle_id!: string;

  // Relacionamento com Motorista
  @ManyToOne(() => Driver, driver => driver.routes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'driver_id' })
  driver!: Driver;

  @Column({
    type: 'uuid',
    comment: 'ID do motorista',
  })
  driver_id!: string;

  // Status e Tipo
  @Column({
    type: 'enum',
    enum: RouteStatus,
    default: RouteStatus.PLANNED,
    comment: 'Status atual da rota',
  })
  status!: RouteStatus;

  @Column({
    type: 'enum',
    enum: RouteType,
    default: RouteType.URBAN,
    comment: 'Tipo da rota',
  })
  type!: RouteType;

  // Endereços
  @Column({
    type: 'varchar',
    length: 500,
    comment: 'Endereço de origem completo',
  })
  origin_address!: string;

  @Column({
    type: 'point',
    nullable: true,
    comment: 'Coordenadas geográficas de origem (lat, lng)',
  })
  origin_coordinates?: string;

  @Column({
    type: 'varchar',
    length: 500,
    comment: 'Endereço de destino completo',
  })
  destination_address!: string;

  @Column({
    type: 'point',
    nullable: true,
    comment: 'Coordenadas geográficas de destino (lat, lng)',
  })
  destination_coordinates?: string;

  // Datas e Horários
  @Column({
    type: 'date',
    comment: 'Data planejada para execução',
  })
  planned_date!: Date;

  @Column({
    type: 'time',
    nullable: true,
    comment: 'Horário de início planejado',
  })
  planned_start_time?: string;

  @Column({
    type: 'time',
    nullable: true,
    comment: 'Horário de término planejado',
  })
  planned_end_time?: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data/hora real de início',
  })
  actual_start_time?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data/hora real de término',
  })
  actual_end_time?: Date;

  // Métricas
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Distância total estimada em quilômetros',
  })
  estimated_distance_km?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Distância real percorrida em quilômetros',
  })
  actual_distance_km?: number;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Tempo estimado de viagem em minutos',
  })
  estimated_duration_minutes?: number;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Duração real em minutos',
  })
  actual_duration_minutes?: number;

  // Capacidade
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Capacidade máxima de carga para esta rota em kg',
  })
  max_vehicle_capacity_kg?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Volume máximo para esta rota em m³',
  })
  max_vehicle_volume_m3?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Carga total da rota em kg',
  })
  total_load_kg?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Volume total da rota em m³',
  })
  total_volume_m3?: number;

  // Custos
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Custo estimado de combustível',
  })
  fuel_cost_estimate?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Estimativa de consumo de combustível em litros',
  })
  fuel_consumption_estimate?: number;

  // Otimização
  @Column({
    type: 'integer',
    default: 1,
    comment: 'Nível de dificuldade da rota (1-5)',
  })
  difficulty_level!: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados de otimização de rota',
  })
  optimization_data?: {
    algorithm_used?: string;
    optimization_score?: number;
    alternative_routes?: {
      route_id?: string;
      distance_km?: number;
      duration_minutes?: number;
      cost_estimate?: number;
      coordinates?: string;
    }[];
    traffic_conditions?: string;
    weather_conditions?: string;
  };

  // Restrições
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Restrições específicas da rota',
  })
  restrictions?: {
    weight_limit_kg?: number;
    height_limit_m?: number;
    width_limit_m?: number;
    hazmat_allowed?: boolean;
    toll_roads_allowed?: boolean;
    night_delivery_allowed?: boolean;
  };

  // Observações
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações gerais',
  })
  notes?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Motivo do cancelamento (se aplicável)',
  })
  cancellation_reason?: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data/hora do cancelamento',
  })
  cancelled_at?: Date;

  // Relacionamentos
  @OneToMany(() => RouteStop, stop => stop.route, {
    cascade: true,
  })
  stops?: RouteStop[];

  @OneToMany(() => RouteHistory, history => history.route, {
    cascade: true,
  })
  history?: RouteHistory[];

  // Métodos auxiliares

  /**
   * Verifica se a rota está em status final
   */
  isFinalStatus(): boolean {
    return [RouteStatus.COMPLETED, RouteStatus.CANCELLED].includes(this.status);
  }

  /**
   * Verifica se a rota pode ser editada
   */
  canBeEdited(): boolean {
    return this.status === RouteStatus.PLANNED;
  }

  /**
   * Verifica se a rota pode ser iniciada
   */
  canBeStarted(): boolean {
    return this.status === RouteStatus.PLANNED;
  }

  /**
   * Verifica se a rota pode ser pausada
   */
  canBePaused(): boolean {
    return this.status === RouteStatus.IN_PROGRESS;
  }

  /**
   * Verifica se a rota pode ser retomada
   */
  canBeResumed(): boolean {
    return this.status === RouteStatus.PAUSED;
  }

  /**
   * Verifica se a rota pode ser finalizada
   */
  canBeCompleted(): boolean {
    return this.status === RouteStatus.IN_PROGRESS;
  }

  /**
   * Verifica se a rota pode ser cancelada
   */
  canBeCancelled(): boolean {
    return !this.isFinalStatus();
  }

  /**
   * Calcula progresso da rota (%)
   */
  getProgressPercentage(): number {
    if (!this.stops || this.stops.length === 0) {
      return 0;
    }

    const completedStops = this.stops.filter(stop => stop.actual_arrival_time !== null).length;

    return Math.round((completedStops / this.stops.length) * 100);
  }

  /**
   * Calcula tempo estimado restante em minutos
   */
  getEstimatedTimeRemaining(): number | null {
    if (!this.estimated_duration_minutes || !this.actual_start_time) {
      return null;
    }

    const elapsed = Math.floor(
      (new Date().getTime() - new Date(this.actual_start_time).getTime()) / (1000 * 60),
    );

    return Math.max(0, this.estimated_duration_minutes - elapsed);
  }

  /**
   * Verifica se está atrasada
   */
  isDelayed(): boolean {
    if (!this.planned_end_time || !this.actual_start_time) {
      return false;
    }

    const now = new Date();
    const dateString = `${this.planned_date.toISOString().split('T')[0]}T${this.planned_end_time}`;
    const plannedEnd = new Date(dateString);

    return now > plannedEnd && !this.isFinalStatus();
  }

  /**
   * Calcula utilização de capacidade (%)
   */
  getCapacityUtilization(): number | null {
    if (!this.max_vehicle_capacity_kg || !this.total_load_kg) {
      return null;
    }

    return Math.round((this.total_load_kg / this.max_vehicle_capacity_kg) * 100);
  }
}
