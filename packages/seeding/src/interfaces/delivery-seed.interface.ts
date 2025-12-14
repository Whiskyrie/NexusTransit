/**
 * Interface para entidade Delivery no seeding
 */
export interface DeliveryEntity {
  id: string;
  tracking_code: string;
  status: string;
  priority: string;
  customer_id: string;
  driver_id?: string;
  vehicle_id?: string;
  description: string;
  weight: number;
  declared_value: number;
  pickup_address: AddressData;
  delivery_address: AddressData;
  scheduled_pickup_at: Date;
  scheduled_delivery_at: Date;
  actual_pickup_at?: Date;
  actual_delivery_at?: Date;
}

/**
 * Interface para endereço no seeding
 */
export interface AddressData {
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

/**
 * Interface para entidade Customer no seeding
 */
export interface CustomerEntity {
  id: string;
  name: string;
}

/**
 * Interface para entidade Driver no seeding
 */
export interface DriverEntity {
  id: string;
  full_name: string;
}

/**
 * Interface para entidade Vehicle no seeding
 */
export interface VehicleEntity {
  id: string;
  license_plate: string;
}
