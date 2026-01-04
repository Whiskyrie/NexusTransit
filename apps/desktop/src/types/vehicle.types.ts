export enum VehicleStatus {
  AVAILABLE = "AVAILABLE",
  IN_USE = "IN_USE",
  MAINTENANCE = "MAINTENANCE",
  OUT_OF_SERVICE = "OUT_OF_SERVICE",
}

export enum VehicleType {
  MOTORCYCLE = "MOTORCYCLE",
  CAR = "CAR",
  VAN = "VAN",
  TRUCK = "TRUCK",
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

export interface UpdateVehicleDto extends Partial(CreateVehicleDto) {}

export interface VehicleFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: VehicleStatus;
  vehicle_type?: VehicleType;
}
