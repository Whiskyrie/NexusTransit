/**
 * Optimization Interfaces
 *
 * Interfaces específicas para otimização de rotas
 *
 * @module Routes/Interfaces
 */

/**
 * GeoPoint estendido para rotas com delivery_id
 */
export interface GeoPoint {
  latitude: number;
  longitude: number;
  sequence: number;
  delivery_id?: string;
  entity_id?: string;
  priority?: number;
  time_window_start?: string;
  time_window_end?: string;
}

/**
 * Interface para resultado da otimização de rotas
 */
export interface OptimizationResult {
  optimized_route: GeoPoint[];
  total_distance_km: number;
  total_duration_minutes: number;
  optimization_score: number;
  algorithm_used: string;
}
