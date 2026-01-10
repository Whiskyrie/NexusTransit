import type { PaginatedResponse } from "../services/api";

export type { PaginatedResponse };

export enum CustomerType {
  INDIVIDUAL = "individual",
  CORPORATE = "corporate",
}

export enum CustomerStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BLOCKED = "blocked",
  PROSPECT = "prospect",
}

export enum CustomerCategory {
  STANDARD = "standard",
  PREMIUM = "premium",
  VIP = "vip",
}

export enum ContactType {
  PHONE = "phone",
  EMAIL = "email",
  WHATSAPP = "whatsapp",
}

export enum AddressType {
  RESIDENTIAL = "residential",
  COMMERCIAL = "commercial",
  BILLING = "billing",
}

export interface CustomerAddress {
  id?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  type: AddressType;
  isDefault?: boolean;
  // Campos do backend
  isPrimary?: boolean;
  isActive?: boolean;
  customerId?: string;
  latitude?: number | null;
  longitude?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface CustomerContact {
  id?: string;
  type: ContactType;
  value: string;
  label?: string;
  isDefault?: boolean;
}

export interface CustomerPreferences {
  id?: string;
  preferredContactMethod?: ContactType;
  preferredContactTime?: string;
  notificationPreferences?: {
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
  };
}

export interface DeliveryPreferences {
  requiresSignature?: boolean;
  allowedDeliveryTimes?: string;
  specialInstructions?: string;
}

export type CustomerMetadata = Record<string, string | number | boolean | null | undefined>;

export interface Customer {
  id: string;
  taxId: string;
  name: string;
  email: string;
  phone: string;
  type: CustomerType;
  status: CustomerStatus;
  category: CustomerCategory;
  addresses?: CustomerAddress[];
  contacts?: CustomerContact[];
  preferences?: CustomerPreferences[];
  metadata?: CustomerMetadata;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreateCustomerDto {
  taxId: string;
  name: string;
  email: string;
  phone: string;
  type: CustomerType;
  status?: CustomerStatus;
  category?: CustomerCategory;
  addresses?: CustomerAddress[];
  contacts?: CustomerContact[];
  preferences?: CustomerPreferences[];
  metadata?: CustomerMetadata;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string;
  phone?: string;
  status?: CustomerStatus;
  category?: CustomerCategory;
  addresses?: CustomerAddress[];
  contacts?: CustomerContact[];
  preferences?: CustomerPreferences[];
  metadata?: CustomerMetadata;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus;
  type?: CustomerType;
  category?: CustomerCategory;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}

export interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  blocked: number;
  prospect: number;
  individual: number;
  corporate: number;
  premium: number;
  vip: number;
}
