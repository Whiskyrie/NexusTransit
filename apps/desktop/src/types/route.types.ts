/**
 * Tipos e enums relacionados a Rotas
 */

export enum RouteStatus {
  PLANNED = "PLANNED",
  IN_PROGRESS = "IN_PROGRESS",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum RouteType {
  URBAN = "URBAN",
  INTERSTATE = "INTERSTATE",
  RURAL = "RURAL",
  EXPRESS = "EXPRESS",
  LOCAL = "LOCAL",
}

export enum RoutePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface RouteVehicle {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  vehicle_type: string;
}

export interface RouteDriver {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
}

export interface RouteStop {
  id: string;
  customer_address_id: string | null;
  sequence_order: number;
  status: string;
  address: string;
  coordinates?: { x: number; y: number };
  planned_arrival_time: string | null;
  planned_departure_time: string | null;
  actual_arrival_time: string | null;
  actual_departure_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  route_code: string;
  name: string;
  description?: string | null;
  status: RouteStatus;
  type: RouteType;
  vehicle: RouteVehicle;
  vehicle_id: string;
  driver: RouteDriver;
  driver_id: string;
  origin_address: string;
  origin_coordinates?: { x: number; y: number } | null;
  destination_address: string | null;
  destination_coordinates?: { x: number; y: number } | null;
  planned_date: string;
  planned_start_time: string;
  estimated_end_date: string | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  estimated_distance_km: number;
  actual_distance_km: number | null;
  estimated_duration_minutes: number | null;
  actual_duration_minutes: number | null;
  total_load_kg: number | null;
  total_volume_m3: number | null;
  difficulty_level: number;
  notes: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  stops: RouteStop[];
  created_at: string;
  updated_at: string;
  // Campos computados
  priority?: RoutePriority;
  total_deliveries: number;
  completed_deliveries: number;
}

export interface CreateRouteDto {
  name: string;
  description?: string;
  driver_id: string;
  vehicle_id: string;
  type: RouteType;
  planned_date: string;
  planned_start_time: string;
  origin_address: string;
  destination_address?: string;
  estimated_distance_km?: number;
  notes?: string;
}

export type UpdateRouteDto = Partial<CreateRouteDto>;

export interface RouteFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: RouteStatus;
  type?: RouteType;
  driver_id?: string;
  vehicle_id?: string;
  route_date_from?: string;
  route_date_to?: string;
  priority?: RoutePriority;
}

export interface RouteMetrics {
  total_routes: number;
  active_routes: number;
  completed_routes: number;
  pending_routes: number;
  total_distance: number;
  average_duration: number;
}

export interface RouteDelivery {
  id: string;
  delivery_id: string;
  route_id: string;
  order: number;
  status: string;
  address: string;
  customer_name?: string;
  estimated_arrival?: string;
  actual_arrival?: string;
}

export interface RouteMapData {
  route_id: string;
  waypoints: Array<{
    lat: number;
    lng: number;
    order: number;
    address: string;
  }>;
  current_position?: {
    lat: number;
    lng: number;
  };
}
