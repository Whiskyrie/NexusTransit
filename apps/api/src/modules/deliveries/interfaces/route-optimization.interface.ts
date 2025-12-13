import type { Coordinates } from './address.interface';
import type { DeliveryPriority } from '../enums/delivery-priority.enum';

/**
 * Interface para representar uma entrega em uma rota
 */
export interface RouteDelivery {
  id: string;
  coordinates: Coordinates;
  priority: DeliveryPriority;
  estimatedDuration: number; // em minutos
}

/**
 * Interface para representar uma rota otimizada
 */
export interface OptimizedRoute {
  deliveries: RouteDelivery[];
  totalDistance: number; // em km
  totalTime: number; // em minutos
  sequence: string[]; // IDs das entregas na ordem otimizada
}
