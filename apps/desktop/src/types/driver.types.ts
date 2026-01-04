export enum DriverStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ON_LEAVE = "ON_LEAVE",
  BLOCKED = "BLOCKED",
}

export enum CNHCategory {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
  AB = "AB",
  AC = "AC",
  AD = "AD",
  AE = "AE",
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
