import { api, PaginatedResponse } from "./api";
import type { User, CreateUserDto, UpdateUserDto, UserFilters } from "../types/user.types";

/**
 * Serviço de Usuários
 *
 * Gerencia operações CRUD de usuários
 */
export const userService = {
  /**
   * Lista usuários com filtros e paginação
   */
  async list(filters?: UserFilters): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();

    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.user_type) params.append("user_type", filters.user_type);
    if (filters?.status) params.append("status", filters.status);

    const response = await api.get<PaginatedResponse<User>>(`/users?${params.toString()}`);
    return response.data;
  },

  /**
   * Busca usuário por ID
   */
  async getById(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Cria novo usuário
   */
  async create(data: CreateUserDto): Promise<User> {
    const response = await api.post<User>("/users", data);
    return response.data;
  },

  /**
   * Atualiza usuário existente
   */
  async update(id: string, data: UpdateUserDto): Promise<User> {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Remove usuário (soft delete)
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
