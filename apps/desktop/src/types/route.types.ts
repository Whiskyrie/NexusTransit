/**
 * Tipos e enums relacionados a Rotas
 */

export enum RouteStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum RoutePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface Route {
  id: string;
  name: string;
  status: RouteStatus;
  priority: RoutePriority;
  driver_id?: string;
  driver_name?: string;
  vehicle_id?: string;
  vehicle_plate?: string;
  start_date: string;
  estimated_end_date?: string;
  actual_end_date?: string;
  total_deliveries: number;
  completed_deliveries: number;
  total_distance?: number;
  estimated_duration?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRouteDto {
  name: string;
  driver_id?: string;
  vehicle_id?: string;
  start_date: string;
  estimated_end_date?: string;
  priority?: RoutePriority;
}

export type UpdateRouteDto = Partial<CreateRouteDto>;

export interface RouteFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: RouteStatus;
  priority?: RoutePriority;
  driver_id?: string;
  vehicle_id?: string;
  start_date_from?: string;
  start_date_to?: string;
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
