import type { RouteStatus } from '../enums/route-status';

/**
 * Interface para métricas da rota
 */
export interface RouteStatistics {
  route_id: string;
  route_code: string;
  status: RouteStatus;
  total_distance_km: number;
  total_duration_minutes: number;
  total_stops: number;
  completed_stops: number;
  failed_stops: number;
  skipped_stops: number;
  pending_stops: number;
  completion_percentage: number;
  average_stop_duration_minutes: number;
  total_delay_minutes: number;
  on_time_stops: number;
  delayed_stops: number;
  estimated_arrival_time?: Date;
  actual_arrival_time?: Date;
  fuel_consumption_estimate?: number;
  fuel_cost_estimate?: number;
  efficiency_score: number;
}

/**
 * Interface para métricas agregadas
 */
export interface AggregatedMetrics {
  total_routes: number;
  completed_routes: number;
  in_progress_routes: number;
  cancelled_routes: number;
  total_distance_km: number;
  average_route_distance_km: number;
  total_duration_minutes: number;
  average_route_duration_minutes: number;
  total_stops: number;
  average_stops_per_route: number;
  completion_rate: number;
  on_time_rate: number;
  average_delay_minutes: number;
}

/**
 * Interface para relatório de performance
 */
export interface PerformanceReport {
  metrics: RouteStatistics;
  insights: string[];
  recommendations: string[];
}

/**
 * Interface para comparação de rotas
 */
export interface RouteComparison {
  route1: RouteStatistics;
  route2: RouteStatistics;
  comparison: {
    better_completion: string;
    better_efficiency: string;
    better_punctuality: string;
    distance_difference_km: number;
    duration_difference_minutes: number;
  };
}
