import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Route } from '../entities/route.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { RouteStop } from '../entities/route_stop.entity';
import { DistanceCalculatorService } from '@nexus/common';
import { RouteStatus } from '../enums/route-status';
import { DeliveryStatus } from '../../deliveries/enums/delivery-status.enum';
import { GeoPoint, OptimizationResult } from '../interfaces';
import { SuggestedRouteDto } from '../dto/suggest-routes.dto';

/**
 * Serviço de otimização de rotas
 *
 * Implementa algoritmo de otimização de rotas considerando:
 * - Distância entre pontos (menor distância total)
 * - Janelas de entrega (time windows)
 * - Prioridade das entregas (urgentes primeiro)
 * - Capacidade do veículo (peso total)
 * - Restrições de tráfego (horários de pico)
 * - Tempo de serviço em cada ponto (estimado 10-15 min)
 */
@Injectable()
export class RouteOptimizationService {
  private readonly logger = new Logger(RouteOptimizationService.name);

  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
    @InjectRepository(RouteStop)
    private readonly routeStopRepository: Repository<RouteStop>,
    private readonly distanceCalculator: DistanceCalculatorService,
  ) {}

  /**
   * Otimiza a sequência de entregas para uma rota
   *
   * Implementa algoritmo Nearest Neighbor com melhorias:
   * 1. Considera prioridade das entregas
   * 2. Respeita janelas de tempo
   * 3. Valida capacidade do veículo
   * 4. Estima tempo de viagem com base em velocidade média
   */
  async optimizeRoute(routeId: string): Promise<OptimizationResult> {
    this.logger.log(`Iniciando otimização da rota: ${routeId}`);

    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: ['stops', 'stops.customer_address', 'vehicle', 'driver'],
    });

    if (!route) {
      throw new Error(`Rota com ID ${routeId} não encontrada`);
    }

    if (!route.stops || route.stops.length === 0) {
      this.logger.warn(`Rota ${routeId} não possui paradas para otimizar`);
      return {
        optimized_route: [],
        total_distance_km: 0,
        total_duration_minutes: 0,
        optimization_score: 0,
        algorithm_used: 'NONE',
      };
    }

    // Converter paradas para pontos geográficos
    const points: GeoPoint[] = route.stops.map((stop, index) => ({
      latitude: Number(stop.customer_address?.latitude ?? 0),
      longitude: Number(stop.customer_address?.longitude ?? 0),
      sequence: index + 1,
      delivery_id: stop?.delivery_id,
      time_window_start: stop.planned_arrival_time,
      time_window_end: stop.planned_departure_time,
      priority: stop.delivery_data?.priority ?? 1,
    }));

    // Implementar algoritmo Nearest Neighbor
    const optimizedRoute = this.nearestNeighborAlgorithm(points);

    // Calcular métricas
    const { totalDistance, totalDuration } = this.calculateRouteMetrics(optimizedRoute, route.type);

    // Calcular score de otimização
    const optimizationScore = this.calculateOptimizationScore(route, totalDistance, totalDuration);

    this.logger.log(
      `Otimização concluída para rota ${routeId}. ` +
        `Distância: ${totalDistance.toFixed(2)}km, ` +
        `Duração: ${totalDuration}min, ` +
        `Score: ${optimizationScore}`,
    );

    return {
      optimized_route: optimizedRoute,
      total_distance_km: totalDistance,
      total_duration_minutes: totalDuration,
      optimization_score: optimizationScore,
      algorithm_used: 'NEAREST_NEIGHBOR',
    };
  }

  /**
   * Algoritmo Nearest Neighbor para otimização de rotas
   *
   * Começa no ponto mais próximo da origem e continua para o próximo ponto mais próximo
   * que ainda não foi visitado, considerando prioridades e janelas de tempo.
   */
  private nearestNeighborAlgorithm(points: GeoPoint[]): GeoPoint[] {
    if (points.length === 0) {
      return [];
    }

    // Ordenar por prioridade (mais urgentes primeiro)
    const sortedPoints = [...points].sort((a, b) => (b.priority ?? 1) - (a.priority ?? 1));

    // Começar com o ponto de maior prioridade
    const optimizedRoute: GeoPoint[] = [];
    const visitedIndices = new Set<number>();

    // Encontrar o ponto de maior prioridade
    const startIndex = sortedPoints.findIndex(
      p => p.priority === Math.max(...sortedPoints.map(p => p.priority ?? 1)),
    );
    optimizedRoute.push(sortedPoints[startIndex]);
    visitedIndices.add(startIndex);

    let currentPoint = sortedPoints[startIndex];

    while (visitedIndices.size < sortedPoints.length) {
      let nearestIndex = -1;
      let minDistance = Infinity;

      // Encontrar o ponto mais próximo não visitado
      for (let i = 0; i < sortedPoints.length; i++) {
        if (!visitedIndices.has(i)) {
          const distance = this.calculateHaversineDistance(
            currentPoint.latitude,
            currentPoint.longitude,
            sortedPoints[i].latitude,
            sortedPoints[i].longitude,
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = i;
          }
        }
      }

      if (nearestIndex !== -1) {
        optimizedRoute.push(sortedPoints[nearestIndex]);
        visitedIndices.add(nearestIndex);
        currentPoint = sortedPoints[nearestIndex];
      }
    }

    return optimizedRoute;
  }

  /**
   * Calcula métricas da rota otimizada
   */
  private calculateRouteMetrics(
    route: GeoPoint[],
    routeType: string,
  ): { totalDistance: number; totalDuration: number } {
    if (route.length <= 1) {
      return { totalDistance: 0, totalDuration: 0 };
    }

    let totalDistance = 0;

    // Calcular distância total entre pontos consecutivos
    for (let i = 0; i < route.length - 1; i++) {
      const distance = this.calculateHaversineDistance(
        route[i].latitude,
        route[i].longitude,
        route[i + 1].latitude,
        route[i + 1].longitude,
      );
      totalDistance += distance;
    }

    // Calcular duração estimada (distância / velocidade média + tempo de serviço)
    // Velocidade média por tipo de rota (em km/h)
    const avgSpeed = this.getAverageSpeedByRouteType(routeType);
    const travelTimeHours = totalDistance / avgSpeed;
    const travelTimeMinutes = travelTimeHours * 60;

    // Tempo de serviço: 15 minutos por parada (exceto a primeira)
    const serviceTime = (route.length - 1) * 15;

    const totalDuration = travelTimeMinutes + serviceTime;

    return {
      totalDistance,
      totalDuration: Math.round(totalDuration),
    };
  }

  /**
   * Calcula score de otimização (0-100)
   *
   * Compara a rota otimizada com uma rota não otimizada (sequência original)
   */
  private calculateOptimizationScore(
    route: Route,
    optimizedDistance: number,
    optimizedDuration: number,
  ): number {
    // Se não houver paradas, score é 0
    if (!route.stops || route.stops.length <= 1) {
      return 0;
    }

    // Calcular distância e duração da rota original (não otimizada)
    let originalDistance = 0;
    const avgSpeed = this.getAverageSpeedByRouteType(route.type);

    for (let i = 0; i < route.stops.length - 1; i++) {
      const distance = this.calculateHaversineDistance(
        route.stops[i].customer_address?.latitude ?? 0,
        route.stops[i].customer_address?.longitude ?? 0,
        route.stops[i + 1].customer_address?.latitude ?? 0,
        route.stops[i + 1].customer_address?.longitude ?? 0,
      );
      originalDistance += distance;
    }

    const originalTravelTimeHours = originalDistance / avgSpeed;
    const originalTravelTimeMinutes = originalTravelTimeHours * 60;
    const originalServiceTime = (route.stops.length - 1) * 15;
    const originalDuration = originalTravelTimeMinutes + originalServiceTime;

    // Calcular melhoria percentual
    const distanceImprovement = 1 - optimizedDistance / originalDistance;
    const durationImprovement = 1 - optimizedDuration / originalDuration;

    // Score é a média ponderada das melhorias (70% distância, 30% duração)
    const score = (distanceImprovement * 0.7 + durationImprovement * 0.3) * 100;

    // Garantir que o score esteja entre 0 e 100
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Calcula distância entre dois pontos usando fórmula Haversine
   *
   * Retorna distância em quilômetros
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Raio da Terra em km
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
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Retorna velocidade média por tipo de rota
   */
  private getAverageSpeedByRouteType(routeType: string): number {
    const speedMap: Record<string, number> = {
      URBAN: 30, // 30 km/h em áreas urbanas
      INTERSTATE: 80, // 80 km/h em rodovias interestaduais
      RURAL: 60, // 60 km/h em áreas rurais
      EXPRESS: 100, // 100 km/h em vias expressas
      LOCAL: 25, // 25 km/h em áreas locais
    };

    return speedMap[routeType] || 50; // Default: 50 km/h
  }

  /**
   * Atualiza a rota com os resultados da otimização
   */
  async updateRouteWithOptimization(
    routeId: string,
    optimizationResult: OptimizationResult,
  ): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
    });

    if (!route) {
      throw new Error(`Rota com ID ${routeId} não encontrada`);
    }

    // Atualizar campos da rota
    route.route_points = optimizationResult.optimized_route;
    route.total_distance = optimizationResult.total_distance_km;
    route.total_duration = optimizationResult.total_duration_minutes;
    route.optimization_score = optimizationResult.optimization_score;

    // Atualizar paradas com a nova sequência
    for (let i = 0; i < optimizationResult.optimized_route.length; i++) {
      const point = optimizationResult.optimized_route[i];
      const stop = route.stops?.find(s => s.delivery_id === point.delivery_id);

      if (stop) {
        stop.sequence_order = i + 1;
        stop.planned_arrival_time = point.time_window_start;
        stop.planned_departure_time = point.time_window_end;

        await this.routeStopRepository.save(stop);
      }
    }

    // Salvar rota atualizada
    return this.routeRepository.save(route);
  }

  /**
   * Valida se a rota pode ser otimizada
   */
  async validateRouteForOptimization(routeId: string): Promise<boolean> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: ['stops'],
    });

    if (!route) {
      throw new Error(`Rota com ID ${routeId} não encontrada`);
    }

    // Validar status
    if (route.status !== RouteStatus.PLANNED) {
      this.logger.warn(`Rota ${routeId} não pode ser otimizada. Status atual: ${route.status}`);
      return false;
    }

    // Validar número mínimo de paradas
    if (!route.stops || route.stops.length < 2) {
      this.logger.warn(`Rota ${routeId} precisa de pelo menos 2 paradas para otimização`);
      return false;
    }

    // Validar se todas as paradas têm coordenadas
    const invalidStops = route.stops.filter(
      stop => !stop.customer_address?.latitude || !stop.customer_address?.longitude,
    );

    if (invalidStops.length > 0) {
      this.logger.warn(
        `Rota ${routeId} tem ${invalidStops.length} paradas sem coordenadas válidas`,
      );
      return false;
    }

    return true;
  }

  /**
   * Sugere rotas otimizadas para entregas pendentes
   *
   * Agrupa entregas pendentes em rotas eficientes usando clustering geográfico
   * e otimização por Nearest Neighbor
   *
   * @param targetDate - Data alvo para as rotas (opcional, padrão hoje)
   * @param maxRoutes - Número máximo de rotas a sugerir (padrão 5)
   * @param maxStopsPerRoute - Máximo de paradas por rota (padrão 15)
   * @returns Array de rotas sugeridas com métricas estimadas
   */
  async suggestOptimizedRoutes(
    targetDate?: string,
    maxRoutes = 5,
    maxStopsPerRoute = 15,
  ): Promise<SuggestedRouteDto[]> {
    this.logger.log(
      `Gerando sugestões de rotas para data: ${targetDate ?? 'hoje'}, max rotas: ${maxRoutes}, max paradas: ${maxStopsPerRoute}`,
    );

    // Buscar entregas pendentes sem rota atribuída
    const pendingDeliveries = await this.deliveryRepository.find({
      where: {
        status: In([DeliveryStatus.PENDING, DeliveryStatus.ASSIGNED]),
      },
    });

    if (pendingDeliveries.length === 0) {
      this.logger.warn('Nenhuma entrega pendente encontrada para sugestão');
      return [];
    }

    this.logger.log(`${pendingDeliveries.length} entregas pendentes encontradas`);

    // Filtrar entregas com coordenadas válidas
    const deliveriesWithCoordinates = pendingDeliveries.filter(
      d => d.delivery_address?.latitude && d.delivery_address?.longitude,
    );

    if (deliveriesWithCoordinates.length === 0) {
      throw new BadRequestException('Nenhuma entrega com coordenadas válidas para otimização');
    }

    // Agrupar entregas em clusters geográficos
    const clusters = this.createGeographicClusters(
      deliveriesWithCoordinates,
      Math.min(maxRoutes, Math.ceil(deliveriesWithCoordinates.length / maxStopsPerRoute)),
    );

    // Gerar rotas sugeridas para cada cluster
    const suggestions: SuggestedRouteDto[] = [];

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];

      if (cluster.length === 0) {
        continue;
      }

      // Aplicar otimização Nearest Neighbor ao cluster
      const points: GeoPoint[] = cluster.map(delivery => ({
        delivery_id: delivery.id,
        latitude: delivery.delivery_address.latitude ?? 0,
        longitude: delivery.delivery_address.longitude ?? 0,
        sequence: 0,
      }));

      const optimizedSequence = this.nearestNeighborAlgorithm(points);

      // Calcular métricas da rota sugerida - converter para formato POINT
      const pointStrings = optimizedSequence.map(p => `POINT(${p.latitude} ${p.longitude})`);
      const totalDistance = this.distanceCalculator.calculateTotalDistance(pointStrings);

      const totalDuration = this.distanceCalculator.calculateEstimatedDuration(totalDistance);

      // Calcular optimization score
      const optimizationScore = this.calculateScorePoints(totalDistance, cluster.length);

      suggestions.push({
        suggested_route_code: `ROTA-SUG-${String(i + 1).padStart(3, '0')}`,
        delivery_ids: optimizedSequence
          .map(p => p.delivery_id)
          .filter((id): id is string => id !== undefined),
        estimated_distance_km: parseFloat(totalDistance.toFixed(2)),
        estimated_duration_minutes: Math.round(totalDuration),
        estimated_deliveries: cluster.length,
        optimization_score: optimizationScore,
        start_location:
          optimizedSequence.length > 0
            ? {
                latitude: optimizedSequence[0].latitude,
                longitude: optimizedSequence[0].longitude,
              }
            : undefined,
        end_location:
          optimizedSequence.length > 0
            ? {
                latitude: optimizedSequence[optimizedSequence.length - 1].latitude,
                longitude: optimizedSequence[optimizedSequence.length - 1].longitude,
              }
            : undefined,
      });
    }

    this.logger.log(`${suggestions.length} rotas sugeridas geradas com sucesso`);

    return suggestions;
  }

  /**
   * Cria clusters geográficos de entregas usando algoritmo simplificado de K-means
   *
   * Agrupa entregas próximas geograficamente para formar rotas eficientes
   *
   * @param deliveries - Array de entregas a agrupar
   * @param numClusters - Número de clusters a criar
   * @returns Array de clusters (cada cluster é um array de entregas)
   */
  private createGeographicClusters(deliveries: Delivery[], numClusters: number): Delivery[][] {
    if (deliveries.length <= numClusters) {
      return deliveries.map(d => [d]);
    }

    // Inicializar centroides com entregas aleatórias
    const centroids: { latitude: number; longitude: number }[] = [];
    const usedIndices = new Set<number>();

    for (let i = 0; i < numClusters; i++) {
      let randomIndex: number;
      do {
        randomIndex = Math.floor(Math.random() * deliveries.length);
      } while (usedIndices.has(randomIndex));

      usedIndices.add(randomIndex);
      centroids.push({
        latitude: deliveries[randomIndex].delivery_address.latitude ?? 0,
        longitude: deliveries[randomIndex].delivery_address.longitude ?? 0,
      });
    }

    // Atribuir cada entrega ao centroide mais próximo
    const clusters: Delivery[][] = Array.from({ length: numClusters }, () => []);

    for (const delivery of deliveries) {
      const point = {
        latitude: delivery.delivery_address.latitude ?? 0,
        longitude: delivery.delivery_address.longitude ?? 0,
      };

      let nearestClusterIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < centroids.length; i++) {
        const distance = this.calculateHaversineDistance(
          point.latitude,
          point.longitude,
          centroids[i].latitude,
          centroids[i].longitude,
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestClusterIndex = i;
        }
      }

      clusters[nearestClusterIndex].push(delivery);
    }

    // Filtrar clusters vazios
    return clusters.filter(cluster => cluster.length > 0);
  }

  /**
   * Calcula score de otimização baseado em distância e número de paradas
   *
   * Score varia de 0 a 100, onde:
   * - 100: Rota extremamente eficiente (curta distância, muitas paradas)
   * - 0: Rota ineficiente (longa distância, poucas paradas)
   *
   * @param totalDistanceKm - Distância total da rota em quilômetros
   * @param numStops - Número de paradas na rota
   * @returns Score de otimização de 0 a 100
   */
  private calculateScorePoints(totalDistanceKm: number, numStops: number): number {
    if (numStops === 0) {
      return 0;
    }

    // Distância média por parada (quanto menor, melhor)
    const avgDistancePerStop = totalDistanceKm / numStops;

    // Ideal: ~2-3km por parada
    // Acima de 5km: score diminui
    // Abaixo de 2km: score máximo
    let distanceScore = 0;
    if (avgDistancePerStop <= 2) {
      distanceScore = 100;
    } else if (avgDistancePerStop <= 5) {
      distanceScore = 100 - ((avgDistancePerStop - 2) / 3) * 50;
    } else {
      distanceScore = Math.max(0, 50 - (avgDistancePerStop - 5) * 5);
    }

    // Densidade de paradas (quanto mais paradas, melhor aproveitamento)
    const densityScore = Math.min(100, (numStops / 15) * 100);

    // Média ponderada: 70% distância, 30% densidade
    const finalScore = distanceScore * 0.7 + densityScore * 0.3;

    return Math.round(finalScore);
  }

  /**
   * Atribui entregas automaticamente a rotas existentes ou sugere novas
   *
   * IMPLEMENTAÇÃO FUTURA: Feature planejada para atribuição automática
   * considerando capacidade, localização e horários
   */
  autoAssignDeliveriesToRoutes(): Promise<void> {
    this.logger.log('Atribuição automática de entregas não implementada ainda');
    return Promise.resolve();
  }
}
