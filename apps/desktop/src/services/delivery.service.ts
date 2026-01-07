import { api, PaginatedResponse, buildQueryString } from "./api";
import type {
  Delivery,
  DeliveryFilters,
  DeliveryStats,
  CreateDeliveryDto,
  UpdateDeliveryDto,
} from "../types/delivery.types";

export const deliveryService = {
  /**
   * Lista entregas com filtros e paginação
   */
  async list(filters?: DeliveryFilters): Promise<PaginatedResponse<Delivery>> {
    // tracking_code precisa ter pelo menos 3 caracteres conforme validação do backend
    const trackingCode =
      filters?.tracking_code && filters.tracking_code.length >= 3
        ? filters.tracking_code
        : undefined;

    const queryString = buildQueryString({
      page: filters?.page,
      limit: filters?.limit,
      tracking_code: trackingCode,
      description: filters?.description,
      status: filters?.status,
      priority: filters?.priority,
      customer_id: filters?.customer_id,
      driver_id: filters?.driver_id,
      vehicle_id: filters?.vehicle_id,
      // Booleanos só são enviados quando true (evita enviar false na query string)
      overdue: filters?.overdue === true ? true : undefined,
      today: filters?.today === true ? true : undefined,
      active_only: filters?.active_only === true ? true : undefined,
      sort_by: filters?.sort_by,
      sort_order: filters?.sort_order,
    });

    const response = await api.get<PaginatedResponse<Delivery>>(
      `/deliveries${queryString ? `?${queryString}` : ""}`,
    );
    return response.data;
  },

  /**
   * Busca uma entrega por ID
   */
  async getById(id: string): Promise<Delivery> {
    const response = await api.get<Delivery>(`/deliveries/${id}`);
    return response.data;
  },

  /**
   * Busca uma entrega por código de rastreamento
   */
  async getByTrackingCode(code: string): Promise<Delivery> {
    const response = await api.get<Delivery>(`/deliveries/tracking/${code}`);
    return response.data;
  },

  /**
   * Cria uma nova entrega
   */
  async create(data: CreateDeliveryDto): Promise<Delivery> {
    const response = await api.post<Delivery>("/deliveries", data);
    return response.data;
  },

  /**
   * Atualiza uma entrega existente
   */
  async update(id: string, data: UpdateDeliveryDto): Promise<Delivery> {
    const response = await api.patch<Delivery>(`/deliveries/${id}`, data);
    return response.data;
  },

  /**
   * Exclui uma entrega
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/deliveries/${id}`);
  },

  /**
   * Obtém estatísticas das entregas
   * Como não existe endpoint de stats, calculamos a partir dos dados
   */
  async getStats(): Promise<DeliveryStats> {
    const stats: DeliveryStats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      assigned: 0,
      in_transit: 0,
      out_for_delivery: 0,
      delivered: 0,
      failed: 0,
      cancelled: 0,
    };

    try {
      // Buscar primeira página para obter o total
      const firstPage = await this.list({ page: 1, limit: 100 });
      stats.total = firstPage.meta.total;

      // Processar primeira página
      firstPage.data.forEach((delivery) => {
        this.countDeliveryStatus(stats, delivery.status);
      });

      // Se houver mais páginas, buscar todas
      const totalPages = firstPage.meta.total_pages;
      if (totalPages > 1) {
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
          promises.push(this.list({ page, limit: 100 }));
        }
        const results = await Promise.all(promises);
        results.forEach((result) => {
          result.data.forEach((delivery) => {
            this.countDeliveryStatus(stats, delivery.status);
          });
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }

    return stats;
  },

  /**
   * Conta o status de uma entrega para as estatísticas
   */
  countDeliveryStatus(stats: DeliveryStats, status: string): void {
    switch (status) {
      case "PENDING":
        stats.pending++;
        break;
      case "CONFIRMED":
        stats.confirmed++;
        break;
      case "ASSIGNED":
        stats.assigned++;
        break;
      case "IN_TRANSIT":
        stats.in_transit++;
        break;
      case "OUT_FOR_DELIVERY":
        stats.out_for_delivery++;
        break;
      case "DELIVERED":
        stats.delivered++;
        break;
      case "FAILED":
        stats.failed++;
        break;
      case "CANCELLED":
        stats.cancelled++;
        break;
    }
  },

  /**
   * Altera o status de uma entrega
   */
  async changeStatus(id: string, status: string, notes?: string): Promise<Delivery> {
    const response = await api.patch<Delivery>(`/deliveries/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  /**
   * Atribui motorista e veículo a uma entrega
   */
  async assign(id: string, driverId: string, vehicleId?: string): Promise<Delivery> {
    const response = await api.patch<Delivery>(`/deliveries/${id}/assign`, {
      driver_id: driverId,
      vehicle_id: vehicleId,
    });
    return response.data;
  },
};
