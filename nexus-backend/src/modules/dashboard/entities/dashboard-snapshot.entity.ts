import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { DashboardPeriod } from '../enums/dashboard-period.enum';
import { MetricType } from '../enums/metric-type.enum';

/**
 * DashboardSnapshot Entity - Armazena snapshots de métricas do dashboard
 *
 * Features:
 * - Armazenamento histórico de métricas
 * - Comparações entre períodos
 * - Análise de tendências
 * - Cache de cálculos complexos
 */
@Entity('dashboard_snapshots')
@Index(['period'])
@Index(['snapshot_date'])
@Index(['metric_type'])
@Index(['created_at'])
export class DashboardSnapshot extends BaseEntity {
  @Column({
    type: 'enum',
    enum: DashboardPeriod,
    comment: 'Período de tempo do snapshot',
  })
  period!: DashboardPeriod;

  @Column({
    type: 'date',
    comment: 'Data do snapshot',
  })
  snapshot_date!: Date;

  @Column({
    type: 'timestamp with time zone',
    comment: 'Data de início do período analisado',
  })
  period_start_date!: Date;

  @Column({
    type: 'timestamp with time zone',
    comment: 'Data de fim do período analisado',
  })
  period_end_date!: Date;

  @Column({
    type: 'enum',
    enum: MetricType,
    comment: 'Tipo de métrica armazenada',
  })
  metric_type!: MetricType;

  // Métricas de Entregas
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Métricas consolidadas de entregas',
  })
  delivery_metrics?: {
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
    cancelled: number;
    failed: number;
    success_rate: number;
    cancellation_rate: number;
    average_delivery_time: number;
    average_attempts: number;
    on_time_deliveries: number;
    delayed_deliveries: number;
    on_time_rate: number;
  };

  // Métricas de Motoristas
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Métricas consolidadas de motoristas',
  })
  driver_metrics?: {
    total_active: number;
    available: number;
    on_route: number;
    on_break: number;
    inactive: number;
    utilization_rate: number;
    average_deliveries_per_driver: number;
    top_performer?: {
      driver_id: string;
      driver_name: string;
      deliveries_count: number;
    };
  };

  // Métricas de Veículos
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Métricas consolidadas de veículos',
  })
  vehicle_metrics?: {
    total: number;
    active: number;
    in_maintenance: number;
    inactive: number;
    fleet_utilization_rate: number;
    total_distance_km: number;
    average_distance_per_vehicle: number;
    vehicles_needing_maintenance: number;
  };

  // Métricas de Rotas
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Métricas consolidadas de rotas',
  })
  route_metrics?: {
    total: number;
    planned: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    completion_rate: number;
    total_planned_distance_km: number;
    total_actual_distance_km: number;
    route_efficiency: number;
  };

  // Métricas Financeiras
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Métricas financeiras consolidadas',
  })
  financial_metrics?: {
    total_revenue: number;
    total_cost: number;
    gross_profit: number;
    profit_margin: number;
    average_revenue_per_delivery: number;
    average_cost_per_delivery: number;
    estimated_fuel_cost: number;
    average_delivery_fee: number;
  };

  // Métricas de Performance
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Métricas de performance consolidadas',
  })
  performance_metrics?: {
    operational_efficiency_score: number;
    service_quality_score: number;
    customer_satisfaction_score: number;
    average_response_time: number;
    first_attempt_success_rate: number;
    productivity_rate: number;
  };

  // Dados de Comparação
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Variações em relação ao período anterior',
  })
  comparison_data?: {
    deliveries_growth: number;
    revenue_growth: number;
    success_rate_change: number;
    efficiency_change: number;
  };

  // Metadados
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Informações adicionais do snapshot',
  })
  metadata?: {
    calculation_duration_ms?: number;
    data_sources?: string[];
    total_records_analyzed?: number;
    cache_hit?: boolean;
    [key: string]: unknown;
  };

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se é um snapshot oficial (gerado automaticamente)',
  })
  is_official!: boolean;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações sobre o snapshot',
  })
  notes?: string;
}
