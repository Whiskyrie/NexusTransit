/**
 * Interface para resultado de query de distância
 */
export interface DistanceQueryResult {
  distance_meters: string;
}

/**
 * Interface para resultado de query de velocidade
 */
export interface SpeedQueryResult {
  event_id: string;
  t1: Date;
  loc1: string;
  t2: Date;
  loc2: string;
  distance_meters: string;
  duration_minutes: string;
}

/**
 * Interface para resultado de query de paradas
 */
export interface StopQueryResult {
  event_id: string;
  timestamp: Date;
  latitude: string;
  longitude: string;
  duration_minutes: string;
  distance_meters: string;
}

/**
 * Interface para resultado de query de distância total
 */
export interface TotalDistanceQueryResult {
  total_distance_meters: string | null;
}
