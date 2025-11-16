import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  type DashboardMetrics,
  type DeliveryMetrics,
  type DriverMetrics,
  type VehicleMetrics,
  type RouteMetrics,
  type FinancialMetrics,
  type PerformanceMetrics,
} from '../interfaces/dashboard-metrics.interface';

/**
 * DTO de resposta do overview do dashboard
 * 
 * Contém todas as métricas principais e KPIs
 */
export class DashboardOverviewResponseDto {
  @ApiProperty({
    description: 'Período de análise',
    example: 'LAST_30_DAYS',
  })
  period!: string;

  @ApiProperty({
    description: 'Data de início do período',
    example: '2024-10-14T00:00:00Z',
  })
  start_date!: Date;

  @ApiProperty({
    description: 'Data de fim do período',
    example: '2024-11-13T23:59:59Z',
  })
  end_date!: Date;

  @ApiProperty({
    description: 'Métricas consolidadas',
    type: 'object',
    additionalProperties: true,
  })
  metrics!: DashboardMetrics;

  @ApiPropertyOptional({
    description: 'Variação percentual em relação ao período anterior',
    type: 'object',
    additionalProperties: true,
  })
  comparison?: {
    deliveries_growth: number;
    revenue_growth: number;
    success_rate_change: number;
    efficiency_change: number;
  };

  @ApiProperty({
    description: 'Data de geração do relatório',
    example: '2024-11-13T12:00:00Z',
  })
  generated_at!: Date;
}

/**
 * DTO de resposta para métricas de entregas
 */
export class DeliveryMetricsResponseDto implements DeliveryMetrics {
  @ApiProperty({ description: 'Total de entregas', example: 1250 })
  total!: number;

  @ApiProperty({ description: 'Entregas concluídas', example: 1100 })
  completed!: number;

  @ApiProperty({ description: 'Entregas pendentes', example: 80 })
  pending!: number;

  @ApiProperty({ description: 'Entregas em andamento', example: 50 })
  in_progress!: number;

  @ApiProperty({ description: 'Entregas canceladas', example: 15 })
  cancelled!: number;

  @ApiProperty({ description: 'Entregas com falha', example: 5 })
  failed!: number;

  @ApiProperty({ description: 'Taxa de sucesso (%)', example: 88.0 })
  success_rate!: number;

  @ApiProperty({ description: 'Taxa de cancelamento (%)', example: 1.2 })
  cancellation_rate!: number;

  @ApiProperty({ description: 'Tempo médio de entrega (minutos)', example: 45 })
  average_delivery_time!: number;

  @ApiProperty({ description: 'Número médio de tentativas', example: 1.2 })
  average_attempts!: number;

  @ApiProperty({ description: 'Entregas no prazo', example: 1050 })
  on_time_deliveries!: number;

  @ApiProperty({ description: 'Entregas atrasadas', example: 50 })
  delayed_deliveries!: number;

  @ApiProperty({ description: 'Taxa de pontualidade (%)', example: 95.5 })
  on_time_rate!: number;
}

/**
 * DTO de resposta para métricas de motoristas
 */
export class DriverMetricsResponseDto implements DriverMetrics {
  @ApiProperty({ description: 'Total de motoristas ativos', example: 45 })
  total_active!: number;

  @ApiProperty({ description: 'Motoristas disponíveis', example: 12 })
  available!: number;

  @ApiProperty({ description: 'Motoristas em rota', example: 30 })
  on_route!: number;

  @ApiProperty({ description: 'Motoristas em pausa', example: 3 })
  on_break!: number;

  @ApiProperty({ description: 'Motoristas inativos', example: 5 })
  inactive!: number;

  @ApiProperty({ description: 'Taxa de utilização (%)', example: 82.5 })
  utilization_rate!: number;

  @ApiProperty({ description: 'Média de entregas por motorista', example: 24.4 })
  average_deliveries_per_driver!: number;
  @ApiPropertyOptional({
    description: 'Motorista com melhor performance',
    type: 'object',
    additionalProperties: true,
  })
  top_performer?: {
    driver_id: string;
    driver_name: string;
    deliveries_count: number;
  };
}

/**
 * DTO de resposta para métricas de veículos
 */
export class VehicleMetricsResponseDto implements VehicleMetrics {
  @ApiProperty({ description: 'Total de veículos', example: 50 })
  total!: number;

  @ApiProperty({ description: 'Veículos ativos', example: 42 })
  active!: number;

  @ApiProperty({ description: 'Veículos em manutenção', example: 5 })
  in_maintenance!: number;

  @ApiProperty({ description: 'Veículos inativos', example: 3 })
  inactive!: number;

  @ApiProperty({ description: 'Taxa de utilização da frota (%)', example: 84.0 })
  fleet_utilization_rate!: number;

  @ApiProperty({ description: 'Distância total percorrida (km)', example: 45678.5 })
  total_distance_km!: number;

  @ApiProperty({ description: 'Média de km por veículo', example: 913.6 })
  average_distance_per_vehicle!: number;

  @ApiProperty({ description: 'Veículos que precisam de manutenção', example: 8 })
  vehicles_needing_maintenance!: number;
}

/**
 * DTO de resposta para métricas de rotas
 */
export class RouteMetricsResponseDto implements RouteMetrics {
  @ApiProperty({ description: 'Total de rotas', example: 320 })
  total!: number;

  @ApiProperty({ description: 'Rotas planejadas', example: 45 })
  planned!: number;

  @ApiProperty({ description: 'Rotas em andamento', example: 30 })
  in_progress!: number;

  @ApiProperty({ description: 'Rotas completadas', example: 240 })
  completed!: number;

  @ApiProperty({ description: 'Rotas canceladas', example: 5 })
  cancelled!: number;

  @ApiProperty({ description: 'Taxa de conclusão (%)', example: 96.8 })
  completion_rate!: number;

  @ApiProperty({ description: 'Distância total planejada (km)', example: 12500.0 })
  total_planned_distance_km!: number;

  @ApiProperty({ description: 'Distância total percorrida (km)', example: 12800.5 })
  total_actual_distance_km!: number;

  @ApiProperty({ description: 'Eficiência de rota (%)', example: 97.7 })
  route_efficiency!: number;
}

/**
 * DTO de resposta para métricas financeiras
 */
export class FinancialMetricsResponseDto implements FinancialMetrics {
  @ApiProperty({ description: 'Receita total', example: 125000.0 })
  total_revenue!: number;

  @ApiProperty({ description: 'Custo total', example: 85000.0 })
  total_cost!: number;

  @ApiProperty({ description: 'Lucro bruto', example: 40000.0 })
  gross_profit!: number;

  @ApiProperty({ description: 'Margem de lucro (%)', example: 32.0 })
  profit_margin!: number;

  @ApiProperty({ description: 'Receita média por entrega', example: 100.0 })
  average_revenue_per_delivery!: number;

  @ApiProperty({ description: 'Custo médio por entrega', example: 68.0 })
  average_cost_per_delivery!: number;

  @ApiProperty({ description: 'Custo estimado de combustível', example: 25000.0 })
  estimated_fuel_cost!: number;

  @ApiProperty({ description: 'Taxa média de entrega', example: 45.5 })
  average_delivery_fee!: number;
}

/**
 * DTO de resposta para métricas de performance
 */
export class PerformanceMetricsResponseDto implements PerformanceMetrics {
  @ApiProperty({ description: 'Score de eficiência operacional (0-100)', example: 87.5 })
  operational_efficiency_score!: number;

  @ApiProperty({ description: 'Score de qualidade de serviço (0-100)', example: 92.3 })
  service_quality_score!: number;

  @ApiProperty({ description: 'Score de satisfação do cliente (0-100)', example: 89.7 })
  customer_satisfaction_score!: number;

  @ApiProperty({ description: 'Tempo médio de resposta (minutos)', example: 12.5 })
  average_response_time!: number;

  @ApiProperty({ description: 'Taxa de primeira tentativa bem-sucedida (%)', example: 91.2 })
  first_attempt_success_rate!: number;

  @ApiProperty({ description: 'Produtividade (entregas por hora)', example: 3.8 })
  productivity_rate!: number;
}
