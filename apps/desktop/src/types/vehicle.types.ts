export enum VehicleStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  MAINTENANCE = "maintenance",
  OUT_OF_SERVICE = "out_of_service",
  IN_ROUTE = "in_route",
}

export enum VehicleType {
  MOTORCYCLE = "motorcycle",
  CAR = "car",
  VAN = "van",
  TRUCK = "truck",
  BICYCLE = "bicycle",
}

export enum FuelType {
  GASOLINE = "GASOLINE",
  ETHANOL = "ETHANOL",
  DIESEL = "DIESEL",
  FLEX = "FLEX",
  ELECTRIC = "ELECTRIC",
  HYBRID = "HYBRID",
}

export interface Vehicle {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  vehicle_type: VehicleType;
  fuel_type: FuelType;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleDto {
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  vehicle_type: VehicleType;
  fuel_type: FuelType;
  status?: VehicleStatus;
}

export interface UpdateVehicleDto extends Partial<CreateVehicleDto> {}

export interface VehicleFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: VehicleStatus;
  vehicle_type?: VehicleType;
}
