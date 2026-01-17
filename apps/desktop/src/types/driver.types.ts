export enum DriverStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  ON_LEAVE = "ON_LEAVE",
  BLOCKED = "BLOCKED",
  // Valores legados (lowercase)
  AVAILABLE = "available",
  ON_ROUTE = "on_route",
  UNAVAILABLE = "unavailable",
  BLOCKED_LEGACY = "blocked",
  VACATION = "vacation",
}

export enum CNHCategory {
  A = "a",
  B = "b",
  C = "c",
  D = "d",
  E = "e",
  AB = "ab",
  AC = "ac",
  AD = "ad",
  AE = "ae",
}

export interface Driver {
  id: string;
  cpf: string;
  full_name: string;
  birth_date: string;
  email: string;
  phone: string;
  cnh_number: string;
  cnh_category: CNHCategory;
  cnh_expiration_date: string;
  status: DriverStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateDriverDto {
  cpf: string;
  full_name: string;
  birth_date: string;
  email: string;
  phone: string;
  cnh_number: string;
  cnh_category: CNHCategory;
  cnh_expiration_date: string;
}

export interface UpdateDriverDto extends Partial<CreateDriverDto> {
  status?: DriverStatus;
}

export interface DriverFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: DriverStatus;
}
