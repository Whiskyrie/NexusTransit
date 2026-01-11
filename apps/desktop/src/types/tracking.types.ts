/**
 * Tipos para rastreamento público (TrackingPage)
 * Baseado nos DTOs públicos do backend
 */

export enum EventType {
  CREATED = "CREATED",
  ASSIGNED = "ASSIGNED",
  PICKUP_STARTED = "PICKUP_STARTED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  NEAR_DESTINATION = "NEAR_DESTINATION",
  ARRIVED = "ARRIVED",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  CANCELED = "CANCELED",
  DELAYED = "DELAYED",
  RESCHEDULED = "RESCHEDULED",
}

export enum EventStatus {
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
  INFO = "INFO",
}

export interface PublicAddress {
  address: string;
  city: string;
  state: string;
  postal_code: string;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface PublicTrackingEvent {
  event_type: EventType;
  event_status: EventStatus;
  timestamp: string;
  location?: string;
  notes?: string;
}

export interface PublicTrackingResponse {
  tracking_code: string;
  current_status: string;
  description: string;
  created_at: string;
  estimated_delivery_at?: string;
  last_update?: string;
  origin: PublicAddress;
  destination: PublicAddress;
  timeline: PublicTrackingEvent[];
}

export interface PublicTrackingTimeline {
  tracking_code: string;
  current_status: string;
  events: PublicTrackingEvent[];
  total_events: number;
  progress_percentage: number;
}

export interface PublicTrackingMap {
  tracking_code: string;
  current_status: string;
  current_location?: CurrentLocation;
  origin: LocationPoint;
  destination: LocationPoint;
  route: RoutePoint[];
  total_distance_km?: number;
  remaining_distance_km?: number;
}
