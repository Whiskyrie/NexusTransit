/**
 * Serviço de Incidentes
 * Responsável por toda comunicação com a API de incidentes
 */

import { api } from "./api";
import type {
  Incident,
  IncidentFilters,
  CreateIncidentDto,
  UpdateIncidentDto,
  UpdateIncidentStatusDto,
  CreateIncidentCommentDto,
  IncidentComment,
  IncidentAttachment,
  IncidentStatusHistory,
  IncidentStats,
  Webhook,
  WebhookFilters,
  WebhookLog,
  WebhookLogFilters,
  CreateWebhookDto,
  UpdateWebhookDto,
  PaginatedResponse,
} from "../types/incident.types";

class IncidentService {
  /**
   * Lista incidentes com filtros e paginação
   */
  async list(filters?: IncidentFilters): Promise<PaginatedResponse<Incident>> {
    const params = new URLSearchParams();

    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.incident_type) params.append("incident_type", filters.incident_type);
    if (filters?.severity) params.append("severity", filters.severity);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.driver_id) params.append("driver_id", filters.driver_id);
    if (filters?.vehicle_id) params.append("vehicle_id", filters.vehicle_id);
    if (filters?.delivery_id) params.append("delivery_id", filters.delivery_id);
    if (filters?.route_id) params.append("route_id", filters.route_id);
    if (filters?.reported_from) params.append("reported_from", filters.reported_from);
    if (filters?.reported_to) params.append("reported_to", filters.reported_to);
    if (filters?.sort_by) params.append("sort_by", filters.sort_by);
    if (filters?.sort_order) params.append("sort_order", filters.sort_order);

    const response = await api.get<PaginatedResponse<Incident>>(`/incidents?${params.toString()}`);
    return response.data;
  }

  /**
   * Busca incidente por ID
   */
  async getById(id: string): Promise<Incident> {
    const response = await api.get<Incident>(`/incidents/${id}`);
    return response.data;
  }

  /**
   * Cria novo incidente
   */
  async create(data: CreateIncidentDto): Promise<Incident> {
    const response = await api.post<Incident>("/incidents", data);
    return response.data;
  }

  /**
   * Atualiza incidente existente
   */
  async update(id: string, data: UpdateIncidentDto): Promise<Incident> {
    const response = await api.patch<Incident>(`/incidents/${id}`, data);
    return response.data;
  }

  /**
   * Remove incidente (soft delete)
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/incidents/${id}`);
  }

  /**
   * Atualiza status do incidente
   */
  async updateStatus(id: string, data: UpdateIncidentStatusDto): Promise<Incident> {
    const response = await api.patch<Incident>(`/incidents/${id}/status`, data);
    return response.data;
  }

  /**
   * Obtém histórico de status do incidente
   */
  async getStatusHistory(id: string): Promise<IncidentStatusHistory[]> {
    const response = await api.get<IncidentStatusHistory[]>(`/incidents/${id}/status-history`);
    return response.data;
  }

  /**
   * Obtém transições de status possíveis
   */
  async getPossibleTransitions(id: string): Promise<{
    current: string;
    nextStatuses: string[];
    transitions: Array<{ to: string; event: string | null; description: string }>;
  }> {
    const response = await api.get(`/incidents/${id}/possible-transitions`);
    return response.data;
  }

  /**
   * Adiciona comentário ao incidente
   */
  async addComment(id: string, data: CreateIncidentCommentDto): Promise<IncidentComment> {
    const response = await api.post<IncidentComment>(`/incidents/${id}/comments`, data);
    return response.data;
  }

  /**
   * Lista comentários do incidente
   */
  async getComments(id: string): Promise<IncidentComment[]> {
    const response = await api.get<IncidentComment[]>(`/incidents/${id}/comments`);
    return response.data;
  }

  /**
   * Faz upload de anexos ao incidente
   */
  async uploadAttachments(id: string, files: File[]): Promise<IncidentAttachment[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await api.post<IncidentAttachment[]>(
      `/incidents/${id}/attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  }

  /**
   * Lista anexos do incidente
   */
  async getAttachments(id: string): Promise<IncidentAttachment[]> {
    const response = await api.get<IncidentAttachment[]>(`/incidents/${id}/attachments`);
    return response.data;
  }

  /**
   * Remove anexo
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    await api.delete(`/incidents/attachments/${attachmentId}`);
  }

  /**
   * Obtém estatísticas gerais de incidentes
   */
  async getStats(): Promise<IncidentStats> {
    const response = await api.get<IncidentStats>("/incidents/stats");
    return response.data;
  }

  /**
   * Exporta incidentes (CSV ou PDF)
   */
  async export(filters?: IncidentFilters, format: "csv" | "pdf" = "csv"): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters?.incident_type) params.append("incident_type", filters.incident_type);
    if (filters?.severity) params.append("severity", filters.severity);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.reported_from) params.append("reported_from", filters.reported_from);
    if (filters?.reported_to) params.append("reported_to", filters.reported_to);

    params.append("format", format);

    const response = await api.get(`/incidents/export?${params.toString()}`, {
      responseType: "blob",
    });
    return response.data;
  }

  // ============================================================================
  // Webhooks
  // ============================================================================

  /**
   * Lista webhooks
   */
  async listWebhooks(filters?: WebhookFilters): Promise<PaginatedResponse<Webhook>> {
    const params = new URLSearchParams();

    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.is_active !== undefined) params.append("is_active", String(filters.is_active));

    const response = await api.get<PaginatedResponse<Webhook>>(`/webhooks?${params.toString()}`);
    return response.data;
  }

  /**
   * Busca webhook por ID
   */
  async getWebhookById(id: string): Promise<Webhook> {
    const response = await api.get<Webhook>(`/webhooks/${id}`);
    return response.data;
  }

  /**
   * Cria webhook
   */
  async createWebhook(data: CreateWebhookDto): Promise<Webhook> {
    const response = await api.post<Webhook>("/webhooks", data);
    return response.data;
  }

  /**
   * Atualiza webhook
   */
  async updateWebhook(id: string, data: UpdateWebhookDto): Promise<Webhook> {
    const response = await api.patch<Webhook>(`/webhooks/${id}`, data);
    return response.data;
  }

  /**
   * Remove webhook
   */
  async deleteWebhook(id: string): Promise<void> {
    await api.delete(`/webhooks/${id}`);
  }

  /**
   * Lista logs de webhook
   */
  async listWebhookLogs(filters?: WebhookLogFilters): Promise<PaginatedResponse<WebhookLog>> {
    const params = new URLSearchParams();

    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.webhook_id) params.append("webhook_id", filters.webhook_id);
    if (filters?.event) params.append("event", filters.event);
    if (filters?.success !== undefined) params.append("success", String(filters.success));

    const response = await api.get<PaginatedResponse<WebhookLog>>(
      `/webhooks/logs?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Testa webhook
   */
  async testWebhook(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(`/webhooks/${id}/test`);
    return response.data;
  }
}

export const incidentService = new IncidentService();
