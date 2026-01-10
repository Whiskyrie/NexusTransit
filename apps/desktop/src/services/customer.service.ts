import { api, type PaginatedResponse } from "./api";
import type {
  Customer,
  CustomerFilters,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerStats,
} from "../types/customer.types";

// Interface para a resposta do backend (estrutura real)
interface BackendPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

// Adapter para transformar resposta do backend para formato esperado pelo frontend
function adaptPaginatedResponse<T>(
  backendResponse: BackendPaginatedResponse<T>,
): PaginatedResponse<T> {
  const { data, total, page, limit, totalPages } = backendResponse;
  return {
    data,
    meta: {
      page,
      limit,
      total,
      total_pages: totalPages,
      has_previous: page > 1,
      has_next: page < totalPages,
    },
  };
}

export const customerService = {
  /**
   * Lista clientes com filtros e paginação
   */
  async list(filters?: CustomerFilters): Promise<PaginatedResponse<Customer>> {
    const queryString = buildQueryString({
      page: filters?.page,
      limit: filters?.limit,
      search: filters?.search,
      status: filters?.status,
      type: filters?.type,
      category: filters?.category,
      sortBy: filters?.sort_by,
      sortOrder: filters?.sort_order,
    });

    const response = await api.get<BackendPaginatedResponse<Customer>>(
      `/customers${queryString ? `?${queryString}` : ""}`,
    );
    return adaptPaginatedResponse(response.data);
  },

  /**
   * Busca cliente por ID
   */
  async getById(id: string): Promise<Customer> {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  /**
   * Busca cliente por CPF/CNPJ
   */
  async getByTaxId(taxId: string): Promise<Customer> {
    const response = await api.get<Customer>(`/customers/tax-id/${taxId}`);
    return response.data;
  },

  /**
   * Cria novo cliente
   */
  async create(data: CreateCustomerDto): Promise<Customer> {
    const response = await api.post<Customer>("/customers", data);
    return response.data;
  },

  /**
   * Atualiza cliente existente
   */
  async update(id: string, data: UpdateCustomerDto): Promise<Customer> {
    const response = await api.patch<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  /**
   * Deleta cliente
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  /**
   * Busca estatísticas de clientes
   */
  async getStats(): Promise<CustomerStats> {
    // Como não existe endpoint de stats, buscamos todos e calculamos
    const response = await api.get<BackendPaginatedResponse<Customer>>("/customers?limit=1000");
    const customers = response.data.data;

    const stats: CustomerStats = {
      total: customers.length,
      active: customers.filter((c) => c.status === "active").length,
      inactive: customers.filter((c) => c.status === "inactive").length,
      blocked: customers.filter((c) => c.status === "blocked").length,
      prospect: customers.filter((c) => c.status === "prospect").length,
      individual: customers.filter((c) => c.type === "individual").length,
      corporate: customers.filter((c) => c.type === "corporate").length,
      premium: customers.filter((c) => c.category === "premium").length,
      vip: customers.filter((c) => c.category === "vip").length,
    };

    return stats;
  },
};
