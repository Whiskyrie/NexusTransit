import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from '../entities/route.entity';
import { RouteStop } from '../entities/route_stop.entity';
import { RouteStatus } from '../enums/route-status';
import { RouteStatistics, AggregatedMetrics, PerformanceReport } from '../interfaces';

/**
 * Serviço de métricas de rotas
 *
 * Responsável por:
 * - Calcular métricas da rota em tempo real
 * - Gerar relatórios de performance
 * - Atualizar métricas automaticamente
 * - Fornecer insights sobre eficiência
 */
@Injectable()
export class RouteMetricsService {
  private readonly logger = new Logger(RouteMetricsService.name);

  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(RouteStop)
    private readonly routeStopRepository: Repository<RouteStop>,
  ) {}

  /**
   * Calcula todas as métricas de uma rota
   */
  async calculateRouteMetrics(routeId: string): Promise<RouteStatistics> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: ['stops', 'vehicle', 'driver'],
    });

    if (!route) {
      throw new Error(`Rota com ID ${routeId} não encontrada`);
    }

    const stops = route.stops ?? [];

    // Calcular contadores de paradas
    const completedStops = stops.filter(s => s.status === 'COMPLETED').length;
    const failedStops = stops.filter(s => s.status === 'FAILED').length;
    const skippedStops = stops.filter(s => s.status === 'SKIPPED').length;
    const pendingStops = stops.filter(s => s.status === 'PENDING').length;

    // Calcular percentual de conclusão
    const completionPercentage =
      stops.length > 0 ? Math.round((completedStops / stops.length) * 100) : 0;

    // Calcular duração média das paradas
    const stopsWithDuration = stops.filter(s => s.actual_stop_duration_minutes);
    const averageStopDuration =
      stopsWithDuration.length > 0
        ? stopsWithDuration.reduce((sum, s) => sum + (s.actual_stop_duration_minutes ?? 0), 0) /
          stopsWithDuration.length
        : 0;

    // Calcular atrasos
    let totalDelayMinutes = 0;
    let onTimeStops = 0;
    let delayedStops = 0;

    for (const stop of stops) {
      if (stop.actual_arrival_time && stop.planned_arrival_time) {
        const delay = stop.getDelayMinutes();
        if (delay > 0) {
          totalDelayMinutes += delay;
          delayedStops++;
        } else {
          onTimeStops++;
        }
      }
    }

    // Calcular score de eficiência (0-100)
    const efficiencyScore = this.calculateEfficiencyScore(
      route,
      completionPercentage,
      totalDelayMinutes,
      stops.length,
    );

    return {
      route_id: route.id,
      route_code: route.route_code,
      status: route.status,
      total_distance_km: route.total_distance ?? 0,
      total_duration_minutes: route.total_duration ?? 0,
      total_stops: stops.length,
      completed_stops: completedStops,
      failed_stops: failedStops,
      skipped_stops: skippedStops,
      pending_stops: pendingStops,
      completion_percentage: completionPercentage,
      average_stop_duration_minutes: Math.round(averageStopDuration),
      total_delay_minutes: totalDelayMinutes,
      on_time_stops: onTimeStops,
      delayed_stops: delayedStops,
      estimated_arrival_time: this.calculateEstimatedArrival(route),
      actual_arrival_time: route.actual_end_time,
      fuel_consumption_estimate: route.fuel_consumption_estimate,
      fuel_cost_estimate: route.fuel_cost_estimate,
      efficiency_score: efficiencyScore,
    };
  }

  /**
   * Atualiza métricas da rota em tempo real
   */
  async updateRouteMetrics(routeId: string): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: ['stops'],
    });

    if (!route) {
      throw new Error(`Rota com ID ${routeId} não encontrada`);
    }

    const stops = route.stops ?? [];

    // Atualizar contadores
    route.total_deliveries = stops.length;
    route.completed_deliveries = stops.filter(s => s.status === 'COMPLETED').length;
    route.failed_deliveries = stops.filter(s => s.status === 'FAILED').length;

    // Calcular distância total percorrida (se houver coordenadas)
    let totalDistance = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      if (stops[i].distance_from_previous_km) {
        totalDistance += stops[i].distance_from_previous_km ?? 0;
      }
    }

    if (totalDistance > 0) {
      route.total_distance = totalDistance;
    }

    // Calcular duração real se a rota estiver em progresso ou completa
    if (route.actual_start_time) {
      const endTime = route.actual_end_time ?? new Date();
      const durationMs = endTime.getTime() - route.actual_start_time.getTime();
      route.total_duration = Math.floor(durationMs / (1000 * 60));
    }

    // Calcular score de otimização se disponível
    if (route.route_points && route.route_points.length > 0) {
      route.optimization_score = this.calculateOptimizationScoreFromPoints(route);
    }

    // Salvar rota atualizada
    await this.routeRepository.save(route);

    this.logger.debug(`Métricas atualizadas para rota ${routeId}`);

    return route;
  }

  /**
   * Gera métricas agregadas para um período
   */
  async getAggregatedMetrics(startDate: Date, endDate: Date): Promise<AggregatedMetrics> {
    const routes = await this.routeRepository.find({
      where: {
        planned_date: undefined, // Será filtrado no código
      },
      relations: ['stops'],
    });

    // Filtrar rotas por data manualmente (TypeORM Between pode não funcionar como esperado)
    const filteredRoutes = routes.filter(r => {
      const routeDate = new Date(r.planned_date);
      return routeDate >= startDate && routeDate <= endDate;
    });

    if (filteredRoutes.length === 0) {
      return {
        total_routes: 0,
        completed_routes: 0,
        in_progress_routes: 0,
        cancelled_routes: 0,
        total_distance_km: 0,
        average_route_distance_km: 0,
        total_duration_minutes: 0,
        average_route_duration_minutes: 0,
        total_stops: 0,
        average_stops_per_route: 0,
        completion_rate: 0,
        on_time_rate: 0,
        average_delay_minutes: 0,
      };
    }

    // Calcular métricas agregadas
    const totalRoutes = filteredRoutes.length;
    const completedRoutes = filteredRoutes.filter(r => r.status === RouteStatus.COMPLETED).length;
    const inProgressRoutes = filteredRoutes.filter(
      r => r.status === RouteStatus.IN_PROGRESS,
    ).length;
    const cancelledRoutes = filteredRoutes.filter(r => r.status === RouteStatus.CANCELLED).length;

    const totalDistance = filteredRoutes.reduce((sum, r) => sum + (r.total_distance ?? 0), 0);
    const averageDistance = totalDistance / totalRoutes;

    const totalDuration = filteredRoutes.reduce((sum, r) => sum + (r.total_duration ?? 0), 0);
    const averageDuration = totalDuration / totalRoutes;

    const totalStops = filteredRoutes.reduce((sum, r) => sum + (r.stops?.length ?? 0), 0);
    const averageStops = totalStops / totalRoutes;

    const completionRate = (completedRoutes / totalRoutes) * 100;

    // Calcular taxa de pontualidade
    let totalOnTimeStops = 0;
    let totalStopsWithTime = 0;
    let totalDelayMinutes = 0;

    for (const route of filteredRoutes) {
      for (const stop of route.stops ?? []) {
        if (stop.actual_arrival_time && stop.planned_arrival_time) {
          totalStopsWithTime++;
          const delay = stop.getDelayMinutes();
          if (delay === 0) {
            totalOnTimeStops++;
          } else {
            totalDelayMinutes += delay;
          }
        }
      }
    }

    const onTimeRate = totalStopsWithTime > 0 ? (totalOnTimeStops / totalStopsWithTime) * 100 : 0;

    const averageDelay = totalStopsWithTime > 0 ? totalDelayMinutes / totalStopsWithTime : 0;

    return {
      total_routes: totalRoutes,
      completed_routes: completedRoutes,
      in_progress_routes: inProgressRoutes,
      cancelled_routes: cancelledRoutes,
      total_distance_km: Math.round(totalDistance * 100) / 100,
      average_route_distance_km: Math.round(averageDistance * 100) / 100,
      total_duration_minutes: Math.round(totalDuration),
      average_route_duration_minutes: Math.round(averageDuration),
      total_stops: totalStops,
      average_stops_per_route: Math.round(averageStops * 10) / 10,
      completion_rate: Math.round(completionRate * 10) / 10,
      on_time_rate: Math.round(onTimeRate * 10) / 10,
      average_delay_minutes: Math.round(averageDelay),
    };
  }

  /**
   * Calcula tempo estimado de chegada
   */
  private calculateEstimatedArrival(route: Route): Date | undefined {
    if (!route.actual_start_time) {
      return undefined;
    }

    if (route.status === RouteStatus.COMPLETED) {
      return route.actual_end_time;
    }

    // Estimar com base no tempo restante
    const estimatedMinutes = route.estimated_duration_minutes ?? 0;
    const elapsedMs = new Date().getTime() - route.actual_start_time.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
    const remainingMinutes = Math.max(0, estimatedMinutes - elapsedMinutes);

    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + remainingMinutes);

    return eta;
  }

  /**
   * Calcula score de eficiência (0-100)
   */
  private calculateEfficiencyScore(
    route: Route,
    completionPercentage: number,
    totalDelayMinutes: number,
    totalStops: number,
  ): number {
    // Fatores para o score:
    // - 40% baseado na taxa de conclusão
    // - 30% baseado em atrasos (menor atraso = maior score)
    // - 30% baseado na otimização da rota

    const completionScore = completionPercentage * 0.4;

    // Penalizar atrasos (0 atraso = 30 pontos, >60 min = 0 pontos)
    const delayScore =
      totalStops > 0 ? Math.max(0, 30 - (totalDelayMinutes / totalStops) * 0.5) : 30;

    // Score de otimização (se disponível)
    const optimizationScore = (route.optimization_score ?? 50) * 0.3;

    const totalScore = completionScore + delayScore + optimizationScore;

    return Math.min(100, Math.max(0, Math.round(totalScore)));
  }

  /**
   * Calcula score de otimização a partir dos pontos da rota
   */
  private calculateOptimizationScoreFromPoints(route: Route): number {
    // Implementação simplificada
    // Em produção, comparar com rota não otimizada

    if (
      !route.route_points ||
      !Array.isArray(route.route_points) ||
      route.route_points.length < 2
    ) {
      return 0;
    }

    // Score baseado na quantidade de pontos vs distância
    // Mais pontos com menos distância = melhor otimização
    const totalDistance = route.total_distance ?? 1;
    const pointsPerKm = route.route_points.length / totalDistance;

    // Normalizar para escala 0-100
    const score = Math.min(100, pointsPerKm * 20);

    return Math.round(score);
  }

  /**
   * Gera relatório de performance de uma rota
   */
  async generatePerformanceReport(routeId: string): Promise<PerformanceReport> {
    const metrics = await this.calculateRouteMetrics(routeId);

    const insights: string[] = [];
    const recommendations: string[] = [];

    // Gerar insights
    if (metrics.completion_percentage === 100) {
      insights.push('Rota completada com sucesso');
    } else if (metrics.completion_percentage >= 80) {
      insights.push('Rota com alta taxa de conclusão');
    } else if (metrics.completion_percentage < 50) {
      insights.push('Rota com baixa taxa de conclusão - requer atenção');
    }

    if (metrics.total_delay_minutes > 60) {
      insights.push(`Atrasos significativos detectados (${metrics.total_delay_minutes} minutos)`);
    } else if (metrics.total_delay_minutes === 0) {
      insights.push('Rota executada no prazo');
    }

    if (metrics.efficiency_score >= 80) {
      insights.push('Excelente eficiência operacional');
    } else if (metrics.efficiency_score < 50) {
      insights.push('Eficiência abaixo do esperado');
    }

    // Gerar recomendações
    if (metrics.delayed_stops > metrics.on_time_stops) {
      recommendations.push('Revisar tempos planejados - muitas paradas atrasadas');
    }

    if (metrics.failed_stops > 0) {
      recommendations.push('Investigar causas de falhas nas entregas');
    }

    if (metrics.average_stop_duration_minutes > 20) {
      recommendations.push('Tempo médio de parada elevado - otimizar processo');
    }

    if (metrics.efficiency_score < 70) {
      recommendations.push('Considerar reotimização da rota para melhorar eficiência');
    }

    return {
      metrics,
      insights,
      recommendations,
    };
  }

  /**
   * Compara performance de duas rotas
   */
  async compareRoutes(
    routeId1: string,
    routeId2: string,
  ): Promise<{
    route1: RouteStatistics;
    route2: RouteStatistics;
    comparison: {
      better_completion: string;
      better_efficiency: string;
      better_punctuality: string;
      distance_difference_km: number;
      duration_difference_minutes: number;
    };
  }> {
    const [route1Metrics, route2Metrics] = await Promise.all([
      this.calculateRouteMetrics(routeId1),
      this.calculateRouteMetrics(routeId2),
    ]);

    const comparison = {
      better_completion:
        route1Metrics.completion_percentage >= route2Metrics.completion_percentage
          ? route1Metrics.route_code
          : route2Metrics.route_code,
      better_efficiency:
        route1Metrics.efficiency_score >= route2Metrics.efficiency_score
          ? route1Metrics.route_code
          : route2Metrics.route_code,
      better_punctuality:
        route1Metrics.total_delay_minutes <= route2Metrics.total_delay_minutes
          ? route1Metrics.route_code
          : route2Metrics.route_code,
      distance_difference_km: Math.abs(
        route1Metrics.total_distance_km - route2Metrics.total_distance_km,
      ),
      duration_difference_minutes: Math.abs(
        route1Metrics.total_duration_minutes - route2Metrics.total_duration_minutes,
      ),
    };

    return {
      route1: route1Metrics,
      route2: route2Metrics,
      comparison,
    };
  }
}
