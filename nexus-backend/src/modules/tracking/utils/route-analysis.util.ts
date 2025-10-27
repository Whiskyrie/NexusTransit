import { TRACKING_CONSTANTS } from '../constants/tracking.constants';

/**
 * Interface para ponto de rastreamento simplificado
 */
interface TrackingPoint {
  latitude: number;
  longitude: number;
  recorded_at: Date;
  speed?: number;
}

/**
 * Interface para estatísticas de rota
 */
export interface RouteStatistics {
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  maxSpeed: number;
  totalStops: number;
  totalStopTime: number;
  movingTime: number;
  idleTime: number;
}

/**
 * Utilitários para análise e estatísticas de rotas
 */
export class RouteAnalysisUtils {
  /**
   * Calcula estatísticas completas de uma rota
   */
  static calculateRouteStatistics(points: TrackingPoint[]): RouteStatistics {
    if (points.length < 2) {
      return {
        totalDistance: 0,
        totalTime: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        totalStops: 0,
        totalStopTime: 0,
        movingTime: 0,
        idleTime: 0,
      };
    }

    let totalDistance = 0;
    let maxSpeed = 0;
    let totalStopTime = 0;
    let totalStops = 0;
    let movingTime = 0;
    let idleTime = 0;

    const sortedPoints = [...points].sort(
      (a, b) => a.recorded_at.getTime() - b.recorded_at.getTime(),
    );

    for (let i = 1; i < sortedPoints.length; i++) {
      const prev = sortedPoints[i - 1];
      const curr = sortedPoints[i];

      if (!prev || !curr) {
        continue;
      }

      // Calcula distância
      const distance = this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude,
      );
      totalDistance += distance;

      // Calcula tempo
      const timeDiff = (curr.recorded_at.getTime() - prev.recorded_at.getTime()) / 1000;

      // Detecta velocidade máxima
      if (curr.speed && curr.speed > maxSpeed) {
        maxSpeed = curr.speed;
      }

      // Detecta paradas
      const isStop =
        curr.speed !== undefined &&
        curr.speed < TRACKING_CONSTANTS.STOP_DETECTION.MIN_SPEED_FOR_STOP;

      if (isStop) {
        totalStopTime += timeDiff;
        idleTime += timeDiff;

        // Conta como uma nova parada se o ponto anterior estava em movimento
        if (
          prev.speed !== undefined &&
          prev.speed >= TRACKING_CONSTANTS.STOP_DETECTION.MIN_SPEED_FOR_STOP
        ) {
          totalStops++;
        }
      } else {
        movingTime += timeDiff;
      }
    }

    const firstPoint = sortedPoints[0];
    const lastPoint = sortedPoints[sortedPoints.length - 1];

    if (!firstPoint || !lastPoint) {
      return {
        totalDistance: 0,
        totalTime: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        totalStops: 0,
        totalStopTime: 0,
        movingTime: 0,
        idleTime: 0,
      };
    }

    const totalTime = (lastPoint.recorded_at.getTime() - firstPoint.recorded_at.getTime()) / 1000;

    const averageSpeed = movingTime > 0 ? (totalDistance / movingTime) * 3600 : 0;

    return {
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalTime: Math.round(totalTime),
      averageSpeed: Math.round(averageSpeed * 100) / 100,
      maxSpeed: Math.round(maxSpeed * 100) / 100,
      totalStops,
      totalStopTime: Math.round(totalStopTime),
      movingTime: Math.round(movingTime),
      idleTime: Math.round(idleTime),
    };
  }

  /**
   * Detecta paradas ao longo de uma rota
   */
  static detectStops(
    points: TrackingPoint[],
    minDuration: number = TRACKING_CONSTANTS.STOP_DETECTION.MIN_DURATION_FOR_STOP * 60,
  ): {
    startIndex: number;
    endIndex: number;
    duration: number;
    location: { latitude: number; longitude: number };
  }[] {
    const stops: {
      startIndex: number;
      endIndex: number;
      duration: number;
      location: { latitude: number; longitude: number };
    }[] = [];

    if (points.length < 2) {
      return stops;
    }

    const sortedPoints = [...points].sort(
      (a, b) => a.recorded_at.getTime() - b.recorded_at.getTime(),
    );

    let stopStart: number | null = null;
    let stopLatSum = 0;
    let stopLonSum = 0;
    let stopPointCount = 0;

    for (let i = 0; i < sortedPoints.length; i++) {
      const point = sortedPoints[i];

      if (!point) {
        continue;
      }

      const isStop =
        point.speed !== undefined &&
        point.speed < TRACKING_CONSTANTS.STOP_DETECTION.MIN_SPEED_FOR_STOP;

      if (isStop) {
        if (stopStart === null) {
          stopStart = i;
          stopLatSum = point.latitude;
          stopLonSum = point.longitude;
          stopPointCount = 1;
        } else {
          stopLatSum += point.latitude;
          stopLonSum += point.longitude;
          stopPointCount++;
        }
      } else if (stopStart !== null) {
        // Fim da parada
        const prevPoint = sortedPoints[i - 1];
        const startPoint = sortedPoints[stopStart];

        if (!prevPoint || !startPoint) {
          continue;
        }

        const duration =
          (prevPoint.recorded_at.getTime() - startPoint.recorded_at.getTime()) / 1000;

        if (duration >= minDuration) {
          stops.push({
            startIndex: stopStart,
            endIndex: i - 1,
            duration: Math.round(duration),
            location: {
              latitude: stopLatSum / stopPointCount,
              longitude: stopLonSum / stopPointCount,
            },
          });
        }

        stopStart = null;
        stopLatSum = 0;
        stopLonSum = 0;
        stopPointCount = 0;
      }
    }

    // Verifica se há uma parada no final
    if (stopStart !== null) {
      const lastPoint = sortedPoints[sortedPoints.length - 1];
      const startPoint = sortedPoints[stopStart];

      if (lastPoint && startPoint) {
        const duration =
          (lastPoint.recorded_at.getTime() - startPoint.recorded_at.getTime()) / 1000;

        if (duration >= minDuration) {
          stops.push({
            startIndex: stopStart,
            endIndex: sortedPoints.length - 1,
            duration: Math.round(duration),
            location: {
              latitude: stopLatSum / stopPointCount,
              longitude: stopLonSum / stopPointCount,
            },
          });
        }
      }
    }

    return stops;
  }

  /**
   * Calcula a distância usando fórmula de Haversine
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Converte graus para radianos
   */
  private static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Simplifica uma rota removendo pontos redundantes (algoritmo Douglas-Peucker)
   */
  static simplifyRoute(points: TrackingPoint[], tolerance = 0.0001): TrackingPoint[] {
    if (points.length <= 2) {
      return points;
    }

    // Implementação simplificada
    return points.filter((point, index) => {
      if (index === 0 || index === points.length - 1) {
        return true;
      }

      const prev = points[index - 1];
      const next = points[index + 1];

      if (!prev || !next) {
        return false;
      }

      const distance = this.calculateDistance(
        prev.latitude,
        prev.longitude,
        next.latitude,
        next.longitude,
      );

      return distance > tolerance;
    });
  }
}
