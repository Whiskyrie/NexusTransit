import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingEvent } from '../entities/tracking-event.entity';
import {
  ARRIVAL_RADIUS_METERS,
  NEAR_DESTINATION_RADIUS_METERS,
  MIN_STOP_DURATION_MINUTES,
  AVERAGE_SPEED_WINDOW_MINUTES,
} from '../constants/tracking.constants';
import {
  DistanceQueryResult,
  SpeedQueryResult,
  StopQueryResult,
  TotalDistanceQueryResult,
} from '../interfaces/query-results.interface';
import {
  DistanceResult,
  ETAResult,
  RouteDeviationResult,
  UnscheduledStopResult,
  DelayResult,
} from '../interfaces/calculation-results.interface';

/**
 * Service para cálculos geográficos e análises de rastreamento
 */
@Injectable()
export class TrackingCalculationService {
  private readonly logger = new Logger(TrackingCalculationService.name);

  constructor(
    @InjectRepository(TrackingEvent)
    private readonly trackingEventRepository: Repository<TrackingEvent>,
  ) {}

  /**
   * Calcula distância entre dois eventos usando PostGIS
   */
  async calculateDistanceBetweenEvents(
    eventId1: string,
    eventId2: string,
  ): Promise<DistanceResult> {
    const query = `
      SELECT 
        ST_Distance(
          e1.location::geography,
          e2.location::geography
        ) as distance_meters
      FROM tracking_events e1, tracking_events e2
      WHERE e1.event_id = $1 AND e2.event_id = $2
      AND e1.location IS NOT NULL AND e2.location IS NOT NULL
    `;

    const result = await this.trackingEventRepository.query<DistanceQueryResult[]>(query, [
      eventId1,
      eventId2,
    ]);

    if (!result || result.length === 0) {
      return {
        distance_meters: 0,
        distance_km: 0,
      };
    }

    const distanceMeters = parseFloat(result[0].distance_meters);

    return {
      distance_meters: Math.round(distanceMeters * 100) / 100,
      distance_km: Math.round((distanceMeters / 1000) * 100) / 100,
    };
  }

  /**
   * Calcula distância entre coordenadas usando PostGIS
   */
  async calculateDistanceBetweenCoordinates(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): Promise<DistanceResult> {
    const query = `
      SELECT 
        ST_Distance(
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
        ) as distance_meters
    `;

    const result = await this.trackingEventRepository.query<DistanceQueryResult[]>(query, [
      lon1,
      lat1,
      lon2,
      lat2,
    ]);

    const distanceMeters = parseFloat(result[0].distance_meters);

    return {
      distance_meters: Math.round(distanceMeters * 100) / 100,
      distance_km: Math.round((distanceMeters / 1000) * 100) / 100,
    };
  }

  /**
   * Calcula ETA baseado em eventos de rastreamento
   */
  async calculateETA(
    deliveryId: string,
    destinationLat: number,
    destinationLon: number,
  ): Promise<ETAResult> {
    // Buscar último evento com localização
    const lastEvent = await this.trackingEventRepository.findOne({
      where: {
        delivery_id: deliveryId,
      },
      order: { timestamp: 'DESC' },
    });

    if (!lastEvent?.location) {
      throw new Error('Nenhum evento com localização encontrado para esta entrega');
    }

    // Extrair coordenadas do último evento
    const coords = lastEvent.getCoordinates();
    if (!coords) {
      throw new Error('Não foi possível extrair coordenadas do último evento');
    }

    // Calcular distância restante
    const distanceResult = await this.calculateDistanceBetweenCoordinates(
      coords.latitude,
      coords.longitude,
      destinationLat,
      destinationLon,
    );

    // Calcular velocidade média
    const averageSpeed = await this.calculateAverageSpeed(deliveryId);

    // Se não tiver velocidade média, usar velocidade padrão de 40 km/h
    const speedKmh = averageSpeed > 0 ? averageSpeed : 40;

    // Calcular tempo estimado em minutos
    const estimatedDurationMinutes = Math.round((distanceResult.distance_km / speedKmh) * 60);

    // Calcular horário estimado de chegada
    const estimatedArrival = new Date(lastEvent.timestamp);
    estimatedArrival.setMinutes(estimatedArrival.getMinutes() + estimatedDurationMinutes);

    this.logger.debug(
      `ETA calculado para entrega ${deliveryId}: ${estimatedDurationMinutes} minutos (${speedKmh} km/h)`,
    );

    return {
      estimated_arrival: estimatedArrival,
      estimated_duration_minutes: estimatedDurationMinutes,
      average_speed_kmh: Math.round(speedKmh * 100) / 100,
      remaining_distance_km: distanceResult.distance_km,
    };
  }

  /**
   * Calcula velocidade média baseada em eventos recentes
   */
  async calculateAverageSpeed(deliveryId: string): Promise<number> {
    const windowMinutes = AVERAGE_SPEED_WINDOW_MINUTES;

    const query = `
      SELECT 
        e1.event_id,
        e1.timestamp as t1,
        e1.location as loc1,
        e2.timestamp as t2,
        e2.location as loc2,
        ST_Distance(e1.location::geography, e2.location::geography) as distance_meters,
        EXTRACT(EPOCH FROM (e2.timestamp - e1.timestamp)) / 60 as duration_minutes
      FROM tracking_events e1
      INNER JOIN tracking_events e2 
        ON e1.delivery_id = e2.delivery_id 
        AND e2.timestamp > e1.timestamp
      WHERE e1.delivery_id = $1
        AND e1.location IS NOT NULL 
        AND e2.location IS NOT NULL
        AND e2.timestamp >= NOW() - INTERVAL '${windowMinutes} minutes'
      ORDER BY e1.timestamp DESC
      LIMIT 10
    `;

    const result = await this.trackingEventRepository.query<SpeedQueryResult[]>(query, [
      deliveryId,
    ]);

    if (!result || result.length === 0) {
      return 0;
    }

    // Calcular velocidade média ponderada
    let totalDistance = 0;
    let totalDuration = 0;

    for (const row of result) {
      const distanceMeters = parseFloat(row.distance_meters);
      const durationMinutes = parseFloat(row.duration_minutes);

      if (durationMinutes > 0) {
        totalDistance += distanceMeters;
        totalDuration += durationMinutes;
      }
    }

    if (totalDuration === 0) {
      return 0;
    }

    // Converter para km/h
    const averageSpeedKmh = totalDistance / 1000 / (totalDuration / 60);

    return Math.round(averageSpeedKmh * 100) / 100;
  }

  /**
   * Detecta desvio de rota baseado em geometria de rota esperada
   */
  async detectRouteDeviation(
    deliveryId: string,
    routeGeometry: string,
    toleranceMeters = 500,
  ): Promise<RouteDeviationResult> {
    // Buscar último evento da entrega
    const lastEvent = await this.trackingEventRepository.findOne({
      where: {
        delivery_id: deliveryId,
      },
      order: { timestamp: 'DESC' },
    });

    if (!lastEvent?.location) {
      return {
        is_deviated: false,
        deviation_distance_meters: 0,
        deviation_percentage: 0,
      };
    }

    // Calcular distância do ponto atual até a rota esperada
    const query = `
      SELECT 
        ST_Distance(
          $1::geography,
          ST_GeomFromText($2, 4326)::geography
        ) as deviation_meters
    `;

    const result = await this.trackingEventRepository.query<{ deviation_meters: string }[]>(query, [
      lastEvent.location,
      routeGeometry,
    ]);

    const deviationMeters = parseFloat(result[0].deviation_meters);
    const isDeviated = deviationMeters > toleranceMeters;
    const deviationPercentage = (deviationMeters / toleranceMeters) * 100;

    if (isDeviated) {
      this.logger.warn(
        `Desvio de rota detectado para entrega ${deliveryId}: ${Math.round(deviationMeters)}m`,
      );
    }

    return {
      is_deviated: isDeviated,
      deviation_distance_meters: Math.round(deviationMeters * 100) / 100,
      deviation_percentage: Math.round(deviationPercentage * 100) / 100,
    };
  }

  /**
   * Detecta paradas não programadas analisando padrões de velocidade
   */
  async detectUnscheduledStops(deliveryId: string): Promise<UnscheduledStopResult[]> {
    const minStopDurationMinutes = MIN_STOP_DURATION_MINUTES;

    const query = `
      WITH events_with_speed AS (
        SELECT 
          event_id,
          timestamp,
          location,
          speed,
          LAG(timestamp) OVER (ORDER BY timestamp) as prev_timestamp,
          LAG(location) OVER (ORDER BY timestamp) as prev_location
        FROM tracking_events
        WHERE delivery_id = $1
          AND location IS NOT NULL
        ORDER BY timestamp
      ),
      stop_candidates AS (
        SELECT 
          event_id,
          timestamp,
          location,
          speed,
          prev_timestamp,
          ST_Distance(location::geography, prev_location::geography) as distance_meters,
          EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60 as duration_minutes
        FROM events_with_speed
        WHERE prev_timestamp IS NOT NULL
      )
      SELECT 
        event_id,
        timestamp,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude,
        duration_minutes,
        distance_meters
      FROM stop_candidates
      WHERE (speed = 0 OR speed < 1)
        AND duration_minutes >= $2
        AND distance_meters < 50
      ORDER BY timestamp
    `;

    const result = await this.trackingEventRepository.query<StopQueryResult[]>(query, [
      deliveryId,
      minStopDurationMinutes,
    ]);

    return result.map(row => ({
      has_stop: true,
      stop_duration_minutes: Math.round(parseFloat(row.duration_minutes)),
      stop_location: {
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
      },
      stop_start_time: new Date(row.timestamp),
      stop_end_time: undefined, // Será definido se houver próximo evento
    }));
  }

  /**
   * Detecta atrasos comparando ETA com horário esperado
   */
  async detectDelay(
    deliveryId: string,
    expectedArrival: Date,
    destinationLat: number,
    destinationLon: number,
  ): Promise<DelayResult> {
    try {
      // Calcular ETA atual
      const eta = await this.calculateETA(deliveryId, destinationLat, destinationLon);

      // Calcular diferença em minutos
      const delayMinutes = Math.round(
        (eta.estimated_arrival.getTime() - expectedArrival.getTime()) / (1000 * 60),
      );

      const isDelayed = delayMinutes > 15; // Tolerância de 15 minutos

      if (isDelayed) {
        this.logger.warn(`Atraso detectado para entrega ${deliveryId}: ${delayMinutes} minutos`);
      }

      return {
        is_delayed: isDelayed,
        delay_minutes: delayMinutes,
        expected_arrival: expectedArrival,
        estimated_arrival: eta.estimated_arrival,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao detectar atraso: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return {
        is_delayed: false,
        delay_minutes: 0,
        expected_arrival: expectedArrival,
        estimated_arrival: expectedArrival,
      };
    }
  }

  /**
   * Verifica se motorista está próximo do destino
   */
  async isNearDestination(
    deliveryId: string,
    destinationLat: number,
    destinationLon: number,
  ): Promise<boolean> {
    const lastEvent = await this.trackingEventRepository.findOne({
      where: {
        delivery_id: deliveryId,
      },
      order: { timestamp: 'DESC' },
    });

    if (!lastEvent?.location) {
      return false;
    }

    const coords = lastEvent.getCoordinates();
    if (!coords) {
      return false;
    }

    const distance = await this.calculateDistanceBetweenCoordinates(
      coords.latitude,
      coords.longitude,
      destinationLat,
      destinationLon,
    );

    return distance.distance_meters <= NEAR_DESTINATION_RADIUS_METERS;
  }

  /**
   * Verifica se motorista chegou ao destino
   */
  async hasArrived(
    deliveryId: string,
    destinationLat: number,
    destinationLon: number,
  ): Promise<boolean> {
    const lastEvent = await this.trackingEventRepository.findOne({
      where: {
        delivery_id: deliveryId,
      },
      order: { timestamp: 'DESC' },
    });

    if (!lastEvent?.location) {
      return false;
    }

    const coords = lastEvent.getCoordinates();
    if (!coords) {
      return false;
    }

    const distance = await this.calculateDistanceBetweenCoordinates(
      coords.latitude,
      coords.longitude,
      destinationLat,
      destinationLon,
    );

    return distance.distance_meters <= ARRIVAL_RADIUS_METERS;
  }

  /**
   * Calcula distância total percorrida em uma entrega
   */
  async calculateTotalDistance(deliveryId: string): Promise<DistanceResult> {
    const query = `
      WITH ordered_events AS (
        SELECT 
          event_id,
          location,
          timestamp,
          LAG(location) OVER (ORDER BY timestamp) as prev_location
        FROM tracking_events
        WHERE delivery_id = $1
          AND location IS NOT NULL
        ORDER BY timestamp
      )
      SELECT 
        SUM(
          ST_Distance(
            location::geography,
            prev_location::geography
          )
        ) as total_distance_meters
      FROM ordered_events
      WHERE prev_location IS NOT NULL
    `;

    const result = await this.trackingEventRepository.query<TotalDistanceQueryResult[]>(query, [
      deliveryId,
    ]);

    const totalMeters = result[0].total_distance_meters
      ? parseFloat(result[0].total_distance_meters)
      : 0;

    return {
      distance_meters: Math.round(totalMeters * 100) / 100,
      distance_km: Math.round((totalMeters / 1000) * 100) / 100,
    };
  }
}
