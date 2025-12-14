/**
 * Optimization Interfaces
 *
 * Interfaces específicas para otimização de rotas
 *
 * @module Routes/Interfaces
 */

import type { GeoPoint as BaseGeoPoint } from '@nexus/common';

/**
 * GeoPoint estendido para rotas com delivery_id
 */
export interface GeoPoint extends BaseGeoPoint {
  sequence: number;
  delivery_id?: string;
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
