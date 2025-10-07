import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../entities/delivery.entity';
import { DeliveryPriority } from '../enums/delivery-priority.enum';
import type { Coordinates } from '../interfaces/address.interface';
import type { RouteDelivery, OptimizedRoute } from '../interfaces/route-optimization.interface';
import { DistanceCalculator } from '../utils/distance-calculator.util';

/**
 * Serviço de otimização de rotas de entrega
 *
 * @class RouteOptimizationService
 */
@Injectable()
export class RouteOptimizationService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
  ) {}

  /**
   * Calcula a rota ótima para um conjunto de entregas
   */
  async calculateOptimalRoute(
    deliveryIds: string[],
    startPoint?: Coordinates,
  ): Promise<OptimizedRoute> {
    const deliveries = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .where('delivery.id IN (:...ids)', { ids: deliveryIds })
      .getMany();

    const routeDeliveries: RouteDelivery[] = deliveries.map(delivery => ({
      id: delivery.id,
      coordinates: {
        latitude: delivery.delivery_address?.latitude ?? 0,
        longitude: delivery.delivery_address?.longitude ?? 0,
      },
      priority: delivery.priority,
      estimatedDuration: delivery.estimated_duration ?? 30,
    }));

    const optimizedDeliveries = this.nearestNeighborAlgorithm(routeDeliveries, startPoint);

    let totalDistance = 0;
    let totalTime = 0;
    let currentPoint = startPoint ?? optimizedDeliveries[0]?.coordinates;

    if (!currentPoint) {
      return { deliveries: [], totalDistance: 0, totalTime: 0, sequence: [] };
    }

    for (const delivery of optimizedDeliveries) {
      const distance = DistanceCalculator.calculateHaversineDistance(
        currentPoint,
        delivery.coordinates,
      );
      totalDistance += distance;
      totalTime += DistanceCalculator.estimateDeliveryTime(distance, delivery.priority);
      currentPoint = delivery.coordinates;
    }

    return {
      deliveries: optimizedDeliveries,
      totalDistance: Number.parseFloat(totalDistance.toFixed(2)),
      totalTime: Math.round(totalTime),
      sequence: optimizedDeliveries.map(d => d.id),
    };
  }

  /**
   * Estima o tempo total de uma rota
   */
  async estimateTotalTime(deliveryIds: string[], includeServiceTime = true): Promise<number> {
    const route = await this.calculateOptimalRoute(deliveryIds);
    let totalTime = route.totalTime;

    if (includeServiceTime) {
      totalTime += route.deliveries.length * 15; // 15 minutos por parada
    }

    return totalTime;
  }

  /**
   * Agrupa entregas por região geográfica
   */
  async groupDeliveriesByRegion(
    deliveryIds: string[],
    maxDistanceKm = 5,
  ): Promise<
    {
      name: string;
      deliveryIds: string[];
      count: number;
    }[]
  > {
    const deliveries = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .where('delivery.id IN (:...ids)', { ids: deliveryIds })
      .getMany();

    const regions: { name: string; deliveryIds: string[]; count: number }[] = [];
    const processed = new Set<string>();

    for (const delivery of deliveries) {
      if (processed.has(delivery.id)) {
        continue;
      }

      const coords: Coordinates = {
        latitude: delivery.delivery_address?.latitude ?? 0,
        longitude: delivery.delivery_address?.longitude ?? 0,
      };

      const nearby = deliveries.filter(d => {
        if (processed.has(d.id)) {
          return false;
        }
        const dCoords: Coordinates = {
          latitude: d.delivery_address?.latitude ?? 0,
          longitude: d.delivery_address?.longitude ?? 0,
        };
        return DistanceCalculator.calculateHaversineDistance(coords, dCoords) <= maxDistanceKm;
      });

      if (nearby.length > 0) {
        regions.push({
          name: `Região ${regions.length + 1}`,
          deliveryIds: nearby.map(d => d.id),
          count: nearby.length,
        });
        for (const d of nearby) {
          processed.add(d.id);
        }
      }
    }

    return regions;
  }

  private nearestNeighborAlgorithm(
    deliveries: RouteDelivery[],
    startPoint?: Coordinates,
  ): RouteDelivery[] {
    if (deliveries.length === 0) {
      return [];
    }

    const remaining = [...deliveries];
    const result: RouteDelivery[] = [];

    // Ordenar por prioridade
    remaining.sort((a, b) => {
      const order: Record<DeliveryPriority, number> = {
        [DeliveryPriority.CRITICAL]: 0,
        [DeliveryPriority.HIGH]: 1,
        [DeliveryPriority.NORMAL]: 2,
        [DeliveryPriority.LOW]: 3,
      };
      return order[a.priority] - order[b.priority];
    });

    let currentPoint = startPoint ?? remaining[0]?.coordinates;
    if (!currentPoint) {
      return [];
    }

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < remaining.length; i++) {
        const delivery = remaining[i];
        if (!delivery) {
          continue;
        }

        const distance = DistanceCalculator.calculateHaversineDistance(
          currentPoint,
          delivery.coordinates,
        );

        const priorityWeight =
          delivery.priority === DeliveryPriority.CRITICAL
            ? 0.5
            : delivery.priority === DeliveryPriority.HIGH
              ? 0.75
              : 1;

        const adjustedDistance = distance * priorityWeight;

        if (adjustedDistance < nearestDistance) {
          nearestDistance = adjustedDistance;
          nearestIndex = i;
        }
      }

      const nearest = remaining.splice(nearestIndex, 1)[0];
      if (nearest) {
        result.push(nearest);
        currentPoint = nearest.coordinates;
      }
    }

    return result;
  }
}
