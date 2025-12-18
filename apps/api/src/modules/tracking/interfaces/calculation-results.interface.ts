/**
 * Interface para resultado de cálculo de distância
 */
export interface DistanceResult {
  distance_meters: number;
  distance_km: number;
  duration_minutes?: number;
}

/**
 * Interface para resultado de cálculo de ETA
 */
export interface ETAResult {
  estimated_arrival: Date;
  estimated_duration_minutes: number;
  average_speed_kmh: number;
  remaining_distance_km: number;
}

/**
 * Interface para resultado de desvio de rota
 */
export interface RouteDeviationResult {
  is_deviated: boolean;
  deviation_distance_meters: number;
  deviation_percentage: number;
}

/**
 * Interface para resultado de parada não programada
 */
export interface UnscheduledStopResult {
  has_stop: boolean;
  stop_duration_minutes: number;
  stop_location?: {
    latitude: number;
    longitude: number;
  };
  stop_start_time?: Date;
  stop_end_time?: Date;
}

/**
 * Interface para resultado de detecção de atraso
 */
export interface DelayResult {
  is_delayed: boolean;
  delay_minutes: number;
  expected_arrival: Date;
  estimated_arrival: Date;
}
