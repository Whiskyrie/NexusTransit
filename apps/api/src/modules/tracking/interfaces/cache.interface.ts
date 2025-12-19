import type { TrackingEventResponseDto } from '../dto/tracking-event-response.dto';

/**
 * Interface para dados de rastreamento em cache
 */
export interface CachedTrackingData {
  delivery_id: string;
  tracking_code?: string;
  current_status: string;
  last_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  last_update: Date;
  events_count: number;
  estimated_arrival?: Date;
}

/**
 * Interface para timeline de eventos em cache
 */
export interface CachedTrackingTimeline {
  delivery_id: string;
  events: TrackingEventResponseDto[];
  total_distance_km?: number;
  cached_at: Date;
}
