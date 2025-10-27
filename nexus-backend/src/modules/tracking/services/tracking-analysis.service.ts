import { Injectable, Logger } from '@nestjs/common';
import { TrackingUtils } from '../utils/tracking.util';
import { RouteAnalysisUtils, RouteStatistics } from '../utils/route-analysis.util';
import { TRACKING_CONSTANTS } from '../constants/tracking.constants';

/**
 * Interface para ponto de rastreamento
 */
interface TrackingPoint {
  id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  recorded_at: Date;
  is_valid: boolean;
  is_stop: boolean;
}

/**
 * Service para análise de dados de rastreamento
 *
 * Fornece funcionalidades avançadas de análise de rotas e estatísticas
 */
@Injectable()
export class TrackingAnalysisService {
  private readonly logger = new Logger(TrackingAnalysisService.name);

  /**
   * Calcula estatísticas de uma rota
   */
  calculateRouteStatistics(points: TrackingPoint[]): RouteStatistics {
    this.logger.debug(`Calculando estatísticas para ${points.length} pontos`);

    const validPoints = points.filter(p => p.is_valid);

    if (validPoints.length < 2) {
      this.logger.warn('Pontos insuficientes para calcular estatísticas');
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

    const stats = RouteAnalysisUtils.calculateRouteStatistics(validPoints);

    this.logger.log(
      `Estatísticas calculadas: ${stats.totalDistance}km, ${stats.totalTime}s, ${stats.averageSpeed}km/h`,
    );

    return stats;
  }

  /**
   * Detecta paradas ao longo de uma rota
   */
  detectStops(
    points: TrackingPoint[],
    minDuration?: number,
  ): {
    startIndex: number;
    endIndex: number;
    duration: number;
    location: { latitude: number; longitude: number };
  }[] {
    this.logger.debug(`Detectando paradas em ${points.length} pontos`);

    const validPoints = points.filter(p => p.is_valid);
    const stops = RouteAnalysisUtils.detectStops(validPoints, minDuration);

    this.logger.log(`${stops.length} paradas detectadas`);

    return stops;
  }

  /**
   * Valida qualidade de pontos GPS
   */
  validatePointQuality(point: {
    latitude: number;
    longitude: number;
    speed?: number;
    accuracy?: number;
  }): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Valida coordenadas
    if (!TrackingUtils.validateCoordinates(point.latitude, point.longitude)) {
      issues.push('Coordenadas fora do intervalo válido');
    }

    // Valida velocidade
    if (point.speed !== undefined) {
      if (!TrackingUtils.validateSpeed(point.speed)) {
        issues.push(`Velocidade inválida: ${point.speed}km/h`);
      } else if (point.speed > TRACKING_CONSTANTS.SPEED.MAX_REALISTIC_SPEED) {
        warnings.push(`Velocidade acima do realista: ${point.speed}km/h`);
      }
    }

    // Valida precisão
    if (point.accuracy !== undefined) {
      if (!TrackingUtils.isAccuracyGood(point.accuracy)) {
        warnings.push(`Precisão baixa: ${point.accuracy}m`);
      }
      if (!TrackingUtils.isAccuracyAcceptable(point.accuracy)) {
        issues.push(`Precisão inaceitável: ${point.accuracy}m`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Calcula distância e tempo entre dois pontos
   */
  calculateDistanceAndTime(
    point1: { latitude: number; longitude: number; recorded_at: Date },
    point2: { latitude: number; longitude: number; recorded_at: Date },
  ): {
    distance: number;
    time: number;
    averageSpeed: number;
    bearing: number;
  } {
    const distance = TrackingUtils.calculateDistance(
      point1.latitude,
      point1.longitude,
      point2.latitude,
      point2.longitude,
    );

    const time = (point2.recorded_at.getTime() - point1.recorded_at.getTime()) / 1000;

    const averageSpeed = TrackingUtils.calculateAverageSpeed(distance, time);

    const bearing = TrackingUtils.calculateBearing(
      point1.latitude,
      point1.longitude,
      point2.latitude,
      point2.longitude,
    );

    return {
      distance,
      time,
      averageSpeed,
      bearing,
    };
  }

  /**
   * Verifica se um ponto está dentro de uma área (geofencing)
   */
  isPointInArea(
    point: { latitude: number; longitude: number },
    center: { latitude: number; longitude: number },
    radiusKm: number,
  ): boolean {
    return TrackingUtils.isWithinRadius(
      point.latitude,
      point.longitude,
      center.latitude,
      center.longitude,
      radiusKm,
    );
  }

  /**
   * Simplifica uma rota removendo pontos redundantes
   */
  simplifyRoute(points: TrackingPoint[], tolerance = 0.0001): TrackingPoint[] {
    this.logger.debug(`Simplificando rota de ${points.length} pontos com tolerância ${tolerance}`);

    const simplified = RouteAnalysisUtils.simplifyRoute(points, tolerance) as TrackingPoint[];

    this.logger.log(`Rota simplificada: ${points.length} -> ${simplified.length} pontos`);

    return simplified;
  }
}
