/**
 * Tipos e interfaces para o módulo de Incidentes
 */

import type { Driver } from "./driver.types";
import type { Vehicle } from "./vehicle.types";

// ============================================================================
// Enums
// ============================================================================

export enum IncidentType {
  TRAFFIC_ACCIDENT = "TRAFFIC_ACCIDENT",
  VEHICLE_BREAKDOWN = "VEHICLE_BREAKDOWN",
  DELAYED_TRAFFIC = "DELAYED_TRAFFIC",
  CUSTOMER_NOT_FOUND = "CUSTOMER_NOT_FOUND",
  WRONG_ADDRESS = "WRONG_ADDRESS",
  REFUSED_DELIVERY = "REFUSED_DELIVERY",
  THEFT = "THEFT",
  DAMAGE = "DAMAGE",
  WEATHER = "WEATHER",
  OTHER = "OTHER",
}

export enum IncidentSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum IncidentStatus {
  REPORTED = "REPORTED",
  INVESTIGATING = "INVESTIGATING",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  ESCALATED = "ESCALATED",
}

// ============================================================================
// Entities
// ============================================================================

export interface IncidentAttachment {
  id: string;
  incident_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface IncidentComment {
  id: string;
  incident_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentStatusHistory {
  id: string;
  incident_id: string;
  previous_status: IncidentStatus | null;
  new_status: IncidentStatus;
  changed_by: string;
  changed_by_name: string;
  notes: string | null;
  created_at: string;
}

export interface Incident {
  id: string;
  incident_number: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;

  // Relacionamentos
  delivery_id?: string;
  route_id?: string;
  driver_id: string;
  driver?: Driver;
  vehicle_id?: string;
  vehicle?: Vehicle;

  // Localização
  latitude?: number;
  longitude?: number;
  location_address?: string;

  // Timestamps
  reported_at: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relações carregadas
  attachments?: IncidentAttachment[];
  comments?: IncidentComment[];
  status_history?: IncidentStatusHistory[];
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  webhook_name: string;
  event: string;
  payload: Record<string, unknown>;
  response_status?: number;
  response_body?: string;
  error?: string;
  retry_count: number;
  created_at: string;
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateIncidentDto {
  incident_type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  driver_id: string;
  vehicle_id?: string;
  delivery_id?: string;
  route_id?: string;
  latitude?: number;
  longitude?: number;
  location_address?: string;
  initial_comment?: string;
}

export interface UpdateIncidentDto {
  incident_type?: IncidentType;
  severity?: IncidentSeverity;
  title?: string;
  description?: string;
  driver_id?: string;
  vehicle_id?: string;
  delivery_id?: string;
  route_id?: string;
  latitude?: number;
  longitude?: number;
  location_address?: string;
}

export interface UpdateIncidentStatusDto {
  status: IncidentStatus;
  notes?: string;
}

export interface CreateIncidentCommentDto {
  content: string;
}

export interface CreateWebhookDto {
  name: string;
  url: string;
  events: string[];
  secret?: string;
}

export interface UpdateWebhookDto {
  name?: string;
  url?: string;
  events?: string[];
  is_active?: boolean;
  secret?: string;
}

// ============================================================================
// Filters
// ============================================================================

export interface IncidentFilters {
  page?: number;
  limit?: number;
  search?: string;
  incident_type?: IncidentType;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  driver_id?: string;
  vehicle_id?: string;
  delivery_id?: string;
  route_id?: string;
  reported_from?: string;
  reported_to?: string;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}

export interface WebhookFilters {
  page?: number;
  limit?: number;
  is_active?: boolean;
}

export interface WebhookLogFilters {
  page?: number;
  limit?: number;
  webhook_id?: string;
  event?: string;
  success?: boolean;
}

// ============================================================================
// Statistics
// ============================================================================

export interface IncidentStats {
  total: number;
  by_status: Record<IncidentStatus, number>;
  by_severity: Record<IncidentSeverity, number>;
  by_type: Record<IncidentType, number>;
  avg_resolution_time?: number;
  critical_count: number;
  open_count: number;
}

// ============================================================================
// Paginated Response
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_previous: boolean;
    has_next: boolean;
  };
}

// ============================================================================
// Traduções
// ============================================================================

export const IncidentTypeLabels: Record<IncidentType, string> = {
  [IncidentType.TRAFFIC_ACCIDENT]: "Acidente de Trânsito",
  [IncidentType.VEHICLE_BREAKDOWN]: "Quebra do Veículo",
  [IncidentType.DELAYED_TRAFFIC]: "Atraso no Trânsito",
  [IncidentType.CUSTOMER_NOT_FOUND]: "Cliente Não Encontrado",
  [IncidentType.WRONG_ADDRESS]: "Endereço Incorreto",
  [IncidentType.REFUSED_DELIVERY]: "Entrega Recusada",
  [IncidentType.THEFT]: "Furto/Roubo",
  [IncidentType.DAMAGE]: "Dano à Carga",
  [IncidentType.WEATHER]: "Condições Climáticas",
  [IncidentType.OTHER]: "Outro",
};

export const IncidentSeverityLabels: Record<IncidentSeverity, string> = {
  [IncidentSeverity.LOW]: "Baixa",
  [IncidentSeverity.MEDIUM]: "Média",
  [IncidentSeverity.HIGH]: "Alta",
  [IncidentSeverity.CRITICAL]: "Crítica",
};

export const IncidentStatusLabels: Record<IncidentStatus, string> = {
  [IncidentStatus.REPORTED]: "Reportado",
  [IncidentStatus.INVESTIGATING]: "Em Investigação",
  [IncidentStatus.IN_PROGRESS]: "Em Progresso",
  [IncidentStatus.RESOLVED]: "Resolvido",
  [IncidentStatus.CLOSED]: "Fechado",
  [IncidentStatus.ESCALATED]: "Escalado",
};
