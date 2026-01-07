/**
 * Tipos para o módulo de Entregas
 */

export type DeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export type DeliveryPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface DeliveryAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
}

export interface DeliveryContact {
  name: string;
  phone: string;
  email?: string;
  document?: string;
}

export interface DeliveryDimensions {
  length: number;
  width: number;
  height: number;
  unit?: string;
}

export interface DeliveryProductInfo {
  category?: string;
  fragility?: string;
  perishable?: boolean;
  stackable?: boolean;
  special_handling?: string[];
}

export interface DeliveryCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  taxId: string;
}

export interface DeliveryDriver {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
}

export interface DeliveryVehicle {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  vehicle_type: string;
}

export interface Delivery {
  id: string;
  tracking_code: string;
  status: DeliveryStatus;
  status_description: string;
  priority: DeliveryPriority;
  priority_description: string;
  customer_id: string;
  customer?: DeliveryCustomer;
  driver_id?: string;
  driver?: DeliveryDriver;
  vehicle_id?: string;
  vehicle?: DeliveryVehicle;
  description: string;
  weight: number;
  declared_value: number;
  dimensions?: DeliveryDimensions;
  product_info?: DeliveryProductInfo;
  pickup_address: DeliveryAddress;
  delivery_address: DeliveryAddress;
  pickup_contact?: DeliveryContact;
  delivery_contact?: DeliveryContact;
  scheduled_pickup_at?: string;
  scheduled_delivery_at?: string;
  actual_pickup_at?: string;
  actual_delivery_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryStats {
  total: number;
  pending: number;
  confirmed: number;
  assigned: number;
  in_transit: number;
  out_for_delivery: number;
  delivered: number;
  failed: number;
  cancelled: number;
}

export interface DeliveryFilters {
  page?: number;
  limit?: number;
  tracking_code?: string;
  description?: string;
  status?: DeliveryStatus;
  priority?: DeliveryPriority;
  customer_id?: string;
  driver_id?: string;
  vehicle_id?: string;
  overdue?: boolean;
  today?: boolean;
  active_only?: boolean;
  sort_by?:
    | "created_at"
    | "updated_at"
    | "scheduled_delivery_at"
    | "priority"
    | "status"
    | "tracking_code";
  sort_order?: "ASC" | "DESC";
}

export interface CreateDeliveryDto {
  customer_id: string;
  description: string;
  weight: number;
  declared_value: number;
  priority?: DeliveryPriority;
  pickup_address: DeliveryAddress;
  delivery_address: DeliveryAddress;
  pickup_contact?: DeliveryContact;
  delivery_contact?: DeliveryContact;
  scheduled_pickup_at?: string;
  scheduled_delivery_at?: string;
  dimensions?: DeliveryDimensions;
  product_info?: DeliveryProductInfo;
  notes?: string;
}

export interface UpdateDeliveryDto extends Partial<CreateDeliveryDto> {
  status?: DeliveryStatus;
  driver_id?: string;
  vehicle_id?: string;
}
