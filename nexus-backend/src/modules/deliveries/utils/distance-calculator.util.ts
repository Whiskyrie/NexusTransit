import type { Coordinates } from '../validators/coordinates.validator';
import { DeliveryPriority } from '../enums/delivery-priority.enum';

/**
 * Utilitários para cálculos de distância e tempo de entrega
 *
 * Fornece métodos para:
 * - Calcular distância entre coordenadas (Haversine)
 * - Estimar tempo de entrega baseado em distância e prioridade
 * - Calcular distância total de rotas
 *
 * @class DistanceCalculator
 */
export class DistanceCalculator {
  /**
   * Raio da Terra em quilômetros
   */
  private static readonly EARTH_RADIUS_KM = 6371;

  /**
   * Velocidade média em área urbana (km/h)
   */
  private static readonly URBAN_SPEED_KMH = 30;

  /**
   * Velocidade média em rodovia (km/h)
   */
  private static readonly HIGHWAY_SPEED_KMH = 80;

  /**
   * Velocidade média padrão (km/h)
   */
  private static readonly DEFAULT_SPEED_KMH = 45;

  /**
   * Multiplicadores de tempo por prioridade
   */
  private static readonly PRIORITY_MULTIPLIERS: Record<DeliveryPriority, number> = {
    [DeliveryPriority.LOW]: 1.5,
    [DeliveryPriority.NORMAL]: 1.0,
    [DeliveryPriority.HIGH]: 0.7,
    [DeliveryPriority.CRITICAL]: 0.5,
  };

  /**
   * Calcula a distância entre dois pontos usando a fórmula de Haversine
   *
   * A fórmula de Haversine determina a distância de grande círculo entre
   * dois pontos na superfície de uma esfera a partir de suas latitudes e longitudes
   *
   * @param coord1 - Primeira coordenada
   * @param coord2 - Segunda coordenada
   * @returns Distância em quilômetros
   *
   * @example
   * ```typescript
   * const distance = DistanceCalculator.calculateHaversineDistance(
   *   { latitude: -23.5505, longitude: -46.6333 }, // São Paulo
   *   { latitude: -22.9068, longitude: -43.1729 }  // Rio de Janeiro
   * );
   * // Retorna aproximadamente 358 km
   * ```
   */
  static calculateHaversineDistance(coord1: Coordinates, coord2: Coordinates): number {
    const lat1Rad = this.toRadians(coord1.latitude);
    const lat2Rad = this.toRadians(coord2.latitude);
    const deltaLatRad = this.toRadians(coord2.latitude - coord1.latitude);
    const deltaLonRad = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = this.EARTH_RADIUS_KM * c;

    // Arredonda para 2 casas decimais
    return Math.round(distance * 100) / 100;
  }

  /**
   * Estima o tempo de entrega baseado na distância e prioridade
   *
   * @param distanceKm - Distância em quilômetros
   * @param priority - Prioridade da entrega
   * @param speedKmh - Velocidade média opcional (padrão: 45 km/h)
   * @returns Tempo estimado em minutos
   *
   * @example
   * ```typescript
   * const time = DistanceCalculator.estimateDeliveryTime(
   *   50,
   *   DeliveryPriority.HIGH
   * );
   * // Retorna aproximadamente 47 minutos
   * ```
   */
  static estimateDeliveryTime(
    distanceKm: number,
    priority: DeliveryPriority = DeliveryPriority.NORMAL,
    speedKmh: number = this.DEFAULT_SPEED_KMH,
  ): number {
    if (distanceKm <= 0) {
      return 0;
    }

    const baseTimeHours = distanceKm / speedKmh;
    const baseTimeMinutes = baseTimeHours * 60;
    const multiplier = this.PRIORITY_MULTIPLIERS[priority];

    return Math.round(baseTimeMinutes * multiplier);
  }

  /**
   * Calcula a distância total de uma rota (múltiplos pontos)
   *
   * @param coordinates - Array de coordenadas em ordem
   * @returns Distância total em quilômetros
   *
   * @example
   * ```typescript
   * const totalDistance = DistanceCalculator.calculateTotalRouteDistance([
   *   { latitude: -23.5505, longitude: -46.6333 },
   *   { latitude: -23.5506, longitude: -46.6334 },
   *   { latitude: -23.5507, longitude: -46.6335 }
   * ]);
   * ```
   */
  static calculateTotalRouteDistance(coordinates: Coordinates[]): number {
    if (!coordinates || coordinates.length < 2) {
      return 0;
    }

    let totalDistance = 0;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const current = coordinates[i];
      const next = coordinates[i + 1];

      if (current && next) {
        const distance = this.calculateHaversineDistance(current, next);
        totalDistance += distance;
      }
    }

    return Math.round(totalDistance * 100) / 100;
  }

  /**
   * Estima o tempo total de uma rota com múltiplas paradas
   *
   * @param coordinates - Array de coordenadas
   * @param priority - Prioridade da entrega
   * @param stopTimeMinutes - Tempo de parada em cada ponto (padrão: 5 min)
   * @returns Tempo total estimado em minutos
   */
  static estimateTotalRouteTime(
    coordinates: Coordinates[],
    priority: DeliveryPriority = DeliveryPriority.NORMAL,
    stopTimeMinutes = 5,
  ): number {
    const totalDistance = this.calculateTotalRouteDistance(coordinates);
    const travelTime = this.estimateDeliveryTime(totalDistance, priority);
    const totalStopTime = (coordinates.length - 1) * stopTimeMinutes;

    return travelTime + totalStopTime;
  }

  /**
   * Determina o tipo de via baseado na distância
   *
   * @param distanceKm - Distância em quilômetros
   * @returns 'urban' para distâncias < 30km, 'highway' para distâncias >= 30km
   */
  static determineRoadType(distanceKm: number): 'urban' | 'highway' {
    return distanceKm < 30 ? 'urban' : 'highway';
  }

  /**
   * Calcula velocidade média ajustada pelo tipo de via
   *
   * @param distanceKm - Distância em quilômetros
   * @returns Velocidade média em km/h
   */
  static getAdjustedSpeed(distanceKm: number): number {
    const roadType = this.determineRoadType(distanceKm);
    return roadType === 'urban' ? this.URBAN_SPEED_KMH : this.HIGHWAY_SPEED_KMH;
  }

  /**
   * Converte graus para radianos
   *
   * @param degrees - Graus
   * @returns Radianos
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calcula o ponto médio entre duas coordenadas
   *
   * @param coord1 - Primeira coordenada
   * @param coord2 - Segunda coordenada
   * @returns Coordenada do ponto médio
   */
  static calculateMidpoint(coord1: Coordinates, coord2: Coordinates): Coordinates {
    const lat1Rad = this.toRadians(coord1.latitude);
    const lat2Rad = this.toRadians(coord2.latitude);
    const lon1Rad = this.toRadians(coord1.longitude);
    const deltaLonRad = this.toRadians(coord2.longitude - coord1.longitude);

    const bx = Math.cos(lat2Rad) * Math.cos(deltaLonRad);
    const by = Math.cos(lat2Rad) * Math.sin(deltaLonRad);

    const lat3Rad = Math.atan2(
      Math.sin(lat1Rad) + Math.sin(lat2Rad),
      Math.sqrt((Math.cos(lat1Rad) + bx) * (Math.cos(lat1Rad) + bx) + by * by),
    );

    const lon3Rad = lon1Rad + Math.atan2(by, Math.cos(lat1Rad) + bx);

    return {
      latitude: this.toDegrees(lat3Rad),
      longitude: this.toDegrees(lon3Rad),
    };
  }

  /**
   * Converte radianos para graus
   *
   * @param radians - Radianos
   * @returns Graus
   */
  private static toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}
