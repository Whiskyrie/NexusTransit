import { api, PaginatedResponse } from "./api";
import type { Driver, CreateDriverDto, UpdateDriverDto, DriverFilters } from "../types/driver.types";

export const driverService = {
  async list(filters?: DriverFilters): Promise<PaginatedResponse<Driver>> {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);

    const response = await api.get<PaginatedResponse<Driver>>(`/drivers?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<Driver> {
    const response = await api.get<Driver>(`/drivers/${id}`);
    return response.data;
  },

  async create(data: CreateDriverDto): Promise<Driver> {
    const response = await api.post<Driver>("/drivers", data);
    return response.data;
  },

  async update(id: string, data: UpdateDriverDto): Promise<Driver> {
    const response = await api.patch<Driver>(`/drivers/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/drivers/${id}`);
  },
};
