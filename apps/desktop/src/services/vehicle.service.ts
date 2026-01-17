import { api, PaginatedResponse } from "./api";
import type { Vehicle, CreateVehicleDto, UpdateVehicleDto, VehicleFilters } from "../types/vehicle.types";

export const vehicleService = {
  async list(filters?: VehicleFilters): Promise<PaginatedResponse<Vehicle>> {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.vehicle_type) params.append("vehicle_type", filters.vehicle_type);

    const response = await api.get<PaginatedResponse<Vehicle>>(`/vehicles?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<Vehicle> {
    const response = await api.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },

  async create(data: CreateVehicleDto): Promise<Vehicle> {
    const response = await api.post<Vehicle>("/vehicles", data);
    return response.data;
  },

  async update(id: string, data: UpdateVehicleDto): Promise<Vehicle> {
    const response = await api.patch<Vehicle>(`/vehicles/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/vehicles/${id}`);
  },
};
