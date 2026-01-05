import { api, PaginatedResponse } from "./api";
import type {
  Route,
  CreateRouteDto,
  UpdateRouteDto,
  RouteFilters,
  RouteMetrics,
  RouteDelivery,
  RouteMapData,
} from "../types/route.types";

export const routeService = {
  async list(filters?: RouteFilters): Promise<PaginatedResponse<Route>> {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.driver_id) params.append("driver_id", filters.driver_id);
    if (filters?.vehicle_id) params.append("vehicle_id", filters.vehicle_id);
    if (filters?.start_date_from) params.append("start_date_from", filters.start_date_from);
    if (filters?.start_date_to) params.append("start_date_to", filters.start_date_to);

    const response = await api.get<PaginatedResponse<Route>>(`/routes?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<Route> {
    const response = await api.get<Route>(`/routes/${id}`);
    return response.data;
  },

  async create(data: CreateRouteDto): Promise<Route> {
    // Generate route code if not provided
    const routeCode = `RT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
      Math.random() * 1000,
    )
      .toString()
      .padStart(3, "0")}`;

    // Backend expects these additional fields
    const payload = {
      ...data,
      route_code: routeCode,
      route_date: data.planned_date,
    };

    const response = await api.post<Route>("/routes", payload);
    return response.data;
  },

  async update(id: string, data: UpdateRouteDto): Promise<Route> {
    const response = await api.patch<Route>(`/routes/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/routes/${id}`);
  },

  async start(id: string): Promise<Route> {
    const response = await api.post<Route>(`/routes/${id}/start`);
    return response.data;
  },

  async pause(id: string): Promise<Route> {
    const response = await api.post<Route>(`/routes/${id}/pause`);
    return response.data;
  },

  async resume(id: string): Promise<Route> {
    const response = await api.post<Route>(`/routes/${id}/resume`);
    return response.data;
  },

  async complete(id: string): Promise<Route> {
    const response = await api.post<Route>(`/routes/${id}/complete`);
    return response.data;
  },

  async cancel(id: string): Promise<Route> {
    const response = await api.post<Route>(`/routes/${id}/cancel`);
    return response.data;
  },

  async optimize(id: string): Promise<Route> {
    const response = await api.post<Route>(`/routes/${id}/optimize`);
    return response.data;
  },

  async getMetrics(id: string): Promise<RouteMetrics> {
    const response = await api.get(`/routes/${id}/metrics`);
    return response.data;
  },

  async getMap(id: string): Promise<RouteMapData> {
    const response = await api.get<RouteMapData>(`/routes/${id}/map`);
    return response.data;
  },

  async getDeliveries(id: string): Promise<RouteDelivery[]> {
    const response = await api.get<RouteDelivery[]>(`/routes/${id}/deliveries`);
    return response.data;
  },

  async addDelivery(routeId: string, deliveryId: string): Promise<RouteDelivery> {
    const response = await api.post<RouteDelivery>(`/routes/${routeId}/deliveries`, {
      delivery_id: deliveryId,
    });
    return response.data;
  },

  async removeDelivery(routeId: string, deliveryId: string): Promise<void> {
    await api.delete(`/routes/${routeId}/deliveries/${deliveryId}`);
  },

  async reorderDeliveries(routeId: string, deliveryIds: string[]): Promise<void> {
    await api.patch(`/routes/${routeId}/deliveries/reorder`, { delivery_ids: deliveryIds });
  },

  async autoAssign(data: { route_ids?: string[]; driver_id?: string }): Promise<Route[]> {
    const response = await api.post<Route[]>("/routes/auto-assign", data);
    return response.data;
  },
};
