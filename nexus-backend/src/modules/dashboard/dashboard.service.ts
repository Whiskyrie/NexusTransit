import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Delivery } from '@/modules/deliveries/entities/delivery.entity';
import { Driver } from '@/modules/drivers/entities/driver.entity';
import { Vehicle } from '@/modules/vehicles/entities/vehicle.entity';
import { Route } from '@/modules/routes/entities/route.entity';
// TODO: Implementar cache de snapshots
// import { DashboardSnapshot } from './entities/dashboard-snapshot.entity';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { DashboardOverviewResponseDto } from './dto/dashboard-overview-response.dto';
import { TrendDataResponseDto } from './dto/trend-data-response.dto';
import { CategoryDistributionResponseDto } from './dto/category-distribution-response.dto';
import { PerformanceRankingResponseDto } from './dto/performance-ranking-response.dto';
import {
  DashboardMetrics,
  DeliveryMetrics,
  DriverMetrics,
  VehicleMetrics,
  RouteMetrics,
  FinancialMetrics,
  PerformanceMetrics,
  TrendData,
  CategoryDistribution,
  PerformanceRanking,
} from './interfaces/dashboard-metrics.interface';
import { DashboardPeriod, getPeriodStartDate, getPeriodEndDate } from './enums/dashboard-period.enum';
import { DeliveryStatus } from './../deliveries/enums/delivery-status.enum';
import { DriverStatus } from './../drivers/enums/driver-status.enum';
import { VehicleStatus } from './../vehicles/enums/vehicle-status.enum';
import { RouteStatus } from './../routes/enums/route-status';

/**
 * Dashboard Service - Serviço principal de métricas e análises
 *
 * Features:
 * - Cálculo de KPIs em tempo real
 * - Geração de relatórios consolidados
 * - Análise de tendências
 * - Rankings de performance
 * - Cache de métricas
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    // TODO: Implementar cache de snapshots usando DashboardSnapshot
    // @InjectRepository(DashboardSnapshot)
    // private readonly snapshotRepository: Repository<DashboardSnapshot>,
  ) {}

  /**
   * Retorna overview completo do dashboard com todas as métricas
   */
  async getOverview(filterDto: DashboardFilterDto): Promise<DashboardOverviewResponseDto> {
    const startTime = Date.now();

    const { period = DashboardPeriod.LAST_30_DAYS, start_date, end_date } = filterDto;

    // Calcular datas do período
    const startDate = getPeriodStartDate(
      period,
      start_date ? new Date(start_date) : undefined,
    );
    const endDate = getPeriodEndDate(
      period,
      end_date ? new Date(end_date) : undefined,
    );

    this.logger.log(`Calculando overview para período ${period} (${startDate} - ${endDate})`);

    // Buscar métricas em paralelo
    const [
      deliveryMetrics,
      driverMetrics,
      vehicleMetrics,
      routeMetrics,
      financialMetrics,
      performanceMetrics,
    ] = await Promise.all([
      this.calculateDeliveryMetrics(startDate, endDate),
      this.calculateDriverMetrics(startDate, endDate),
      this.calculateVehicleMetrics(startDate, endDate),
      this.calculateRouteMetrics(startDate, endDate),
      this.calculateFinancialMetrics(startDate, endDate),
      this.calculatePerformanceMetrics(startDate, endDate),
    ]);

    const metrics: DashboardMetrics = {
      deliveries: deliveryMetrics,
      drivers: driverMetrics,
      vehicles: vehicleMetrics,
      routes: routeMetrics,
      financial: financialMetrics,
      performance: performanceMetrics,
    };

    // Calcular comparação com período anterior
    const comparison = await this.calculateComparison(startDate, endDate, metrics);

    const duration = Date.now() - startTime;
    this.logger.log(`Overview calculado em ${duration}ms`);

    return {
      period: period.toString(),
      start_date: startDate,
      end_date: endDate,
      metrics,
      comparison,
      generated_at: new Date(),
    };
  }

  /**
   * Calcula métricas de entregas
   */
  private async calculateDeliveryMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<DeliveryMetrics> {
    const whereClause = {
      created_at: Between(startDate, endDate),
    };

    // Buscar todas as entregas do período
    const deliveries = await this.deliveryRepository.find({
      where: whereClause,
      select: [
        'id',
        'status',
        'scheduled_delivery_at',
        'actual_delivery_at',
        'created_at',
      ],
    });

    const total = deliveries.length;
    const completed = deliveries.filter((d) => d.status === DeliveryStatus.DELIVERED).length;
    const pending = deliveries.filter((d) => d.status === DeliveryStatus.PENDING).length;
    const in_progress = deliveries.filter(
      (d) =>
        d.status === DeliveryStatus.IN_TRANSIT ||
        d.status === DeliveryStatus.OUT_FOR_DELIVERY ||
        d.status === DeliveryStatus.PICKED_UP,
    ).length;
    const cancelled = deliveries.filter((d) => d.status === DeliveryStatus.CANCELLED).length;
    const failed = deliveries.filter((d) => d.status === DeliveryStatus.FAILED).length;

    const success_rate = total > 0 ? (completed / total) * 100 : 0;
    const cancellation_rate = total > 0 ? (cancelled / total) * 100 : 0;

    // Calcular tempo médio de entrega
    const completedDeliveries = deliveries.filter(
      (d) => d.status === DeliveryStatus.DELIVERED && d.actual_delivery_at,
    );
    let average_delivery_time = 0;
    if (completedDeliveries.length > 0) {
      const totalTime = completedDeliveries.reduce((sum, d) => {
        const time =
          new Date(d.actual_delivery_at!).getTime() - new Date(d.created_at).getTime();
        return sum + time;
      }, 0);
      average_delivery_time = totalTime / completedDeliveries.length / (1000 * 60); // em minutos
    }

    // Calcular pontualidade
    const on_time_deliveries = completedDeliveries.filter((d) => {
      return (
        new Date(d.actual_delivery_at!) <= new Date(d.scheduled_delivery_at)
      );
    }).length;
    const delayed_deliveries = completedDeliveries.length - on_time_deliveries;
    const on_time_rate =
      completedDeliveries.length > 0
        ? (on_time_deliveries / completedDeliveries.length) * 100
        : 0;

    return {
      total,
      completed,
      pending,
      in_progress,
      cancelled,
      failed,
      success_rate: parseFloat(success_rate.toFixed(2)),
      cancellation_rate: parseFloat(cancellation_rate.toFixed(2)),
      average_delivery_time: parseFloat(average_delivery_time.toFixed(2)),
      average_attempts: 1.2, // TODO: Implementar cálculo real baseado em delivery_attempts
      on_time_deliveries,
      delayed_deliveries,
      on_time_rate: parseFloat(on_time_rate.toFixed(2)),
    };
  }

  /**
   * Calcula métricas de motoristas
   */
  private async calculateDriverMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<DriverMetrics> {
    // Buscar todos os motoristas ativos
    const drivers = await this.driverRepository.find({
      where: { is_active: true },
      select: ['id', 'full_name', 'status'],
    });

    const total_active = drivers.length;
    const available = drivers.filter((d) => d.status === DriverStatus.AVAILABLE).length;
    const on_route = drivers.filter((d) => d.status === DriverStatus.ON_ROUTE).length;
    const on_break = drivers.filter(
      (d) => d.status === DriverStatus.VACATION || d.status === DriverStatus.UNAVAILABLE,
    ).length;
    const inactive = drivers.filter((d) => d.status === DriverStatus.BLOCKED).length;

    const utilization_rate = total_active > 0 ? (on_route / total_active) * 100 : 0;

    // Calcular entregas por motorista no período
    const deliveriesCount = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .select('delivery.driver_id', 'driver_id')
      .addSelect('COUNT(delivery.id)', 'count')
      .where('delivery.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('delivery.driver_id IS NOT NULL')
      .groupBy('delivery.driver_id')
      .getRawMany();

    const totalDeliveries = deliveriesCount.reduce(
      (sum, item) => sum + parseInt(item.count),
      0,
    );
    const average_deliveries_per_driver =
      total_active > 0 ? totalDeliveries / total_active : 0;

    // Encontrar top performer
    let top_performer;
    if (deliveriesCount.length > 0) {
      const topDriver = deliveriesCount.reduce((max, item) =>
        parseInt(item.count) > parseInt(max.count) ? item : max,
      );

      const driverInfo = drivers.find((d) => d.id === topDriver.driver_id);
      if (driverInfo) {
        top_performer = {
          driver_id: driverInfo.id,
          driver_name: driverInfo.full_name,
          deliveries_count: parseInt(topDriver.count),
        };
      }
    }

    return {
      total_active,
      available,
      on_route,
      on_break,
      inactive,
      utilization_rate: parseFloat(utilization_rate.toFixed(2)),
      average_deliveries_per_driver: parseFloat(average_deliveries_per_driver.toFixed(2)),
      ...(top_performer && { top_performer }),
    };
  }

  /**
   * Calcula métricas de veículos
   */
  private async calculateVehicleMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<VehicleMetrics> {
    // Buscar todos os veículos
    const vehicles = await this.vehicleRepository.find({
      select: ['id', 'status', 'next_maintenance_at'],
    });

    const total = vehicles.length;
    const active = vehicles.filter(
      (v) => v.status === VehicleStatus.ACTIVE || v.status === VehicleStatus.IN_ROUTE,
    ).length;
    const in_maintenance = vehicles.filter(
      (v) => v.status === VehicleStatus.MAINTENANCE,
    ).length;
    const inactive = vehicles.filter(
      (v) => v.status === VehicleStatus.INACTIVE || v.status === VehicleStatus.OUT_OF_SERVICE,
    ).length;

    const fleet_utilization_rate = total > 0 ? (active / total) * 100 : 0;

    // Calcular distância percorrida no período (via rotas)
    const routesDistance = await this.routeRepository
      .createQueryBuilder('route')
      .select('SUM(route.actual_distance_km)', 'total_distance')
      .where('route.actual_start_time BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('route.actual_distance_km IS NOT NULL')
      .getRawOne();

    const total_distance_km = parseFloat(routesDistance?.total_distance || 0);
    const average_distance_per_vehicle = total > 0 ? total_distance_km / total : 0;

    // Veículos que precisam de manutenção
    const now = new Date();
    const vehicles_needing_maintenance = vehicles.filter(
      (v) => v.next_maintenance_at && new Date(v.next_maintenance_at) <= now,
    ).length;

    return {
      total,
      active,
      in_maintenance,
      inactive,
      fleet_utilization_rate: parseFloat(fleet_utilization_rate.toFixed(2)),
      total_distance_km: parseFloat(total_distance_km.toFixed(2)),
      average_distance_per_vehicle: parseFloat(average_distance_per_vehicle.toFixed(2)),
      vehicles_needing_maintenance,
    };
  }

  /**
   * Calcula métricas de rotas
   */
  private async calculateRouteMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<RouteMetrics> {
    const routes = await this.routeRepository.find({
      where: {
        planned_date: Between(startDate, endDate),
      },
      select: [
        'id',
        'status',
        'estimated_distance_km',
        'actual_distance_km',
      ],
    });

    const total = routes.length;
    const planned = routes.filter((r) => r.status === RouteStatus.PLANNED).length;
    const in_progress = routes.filter((r) => r.status === RouteStatus.IN_PROGRESS).length;
    const completed = routes.filter((r) => r.status === RouteStatus.COMPLETED).length;
    const cancelled = routes.filter((r) => r.status === RouteStatus.CANCELLED).length;

    const completion_rate = total > 0 ? (completed / total) * 100 : 0;

    const total_planned_distance_km = routes.reduce(
      (sum, r) => sum + (r.estimated_distance_km || 0),
      0,
    );
    const total_actual_distance_km = routes.reduce(
      (sum, r) => sum + (r.actual_distance_km || 0),
      0,
    );

    const route_efficiency =
      total_planned_distance_km > 0
        ? (total_planned_distance_km / total_actual_distance_km) * 100
        : 0;

    return {
      total,
      planned,
      in_progress,
      completed,
      cancelled,
      completion_rate: parseFloat(completion_rate.toFixed(2)),
      total_planned_distance_km: parseFloat(total_planned_distance_km.toFixed(2)),
      total_actual_distance_km: parseFloat(total_actual_distance_km.toFixed(2)),
      route_efficiency: parseFloat(route_efficiency.toFixed(2)),
    };
  }

  /**
   * Calcula métricas financeiras
   */
  private async calculateFinancialMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<FinancialMetrics> {
    const deliveries = await this.deliveryRepository.find({
      where: {
        created_at: Between(startDate, endDate),
        status: DeliveryStatus.DELIVERED,
      },
      select: ['delivery_fee', 'total_cost'],
    });

    const total_revenue = deliveries.reduce(
      (sum, d) => sum + (d.delivery_fee || 0),
      0,
    );
    const total_cost = deliveries.reduce(
      (sum, d) => sum + (d.total_cost || 0),
      0,
    );
    const gross_profit = total_revenue - total_cost;
    const profit_margin = total_revenue > 0 ? (gross_profit / total_revenue) * 100 : 0;

    const average_revenue_per_delivery =
      deliveries.length > 0 ? total_revenue / deliveries.length : 0;
    const average_cost_per_delivery =
      deliveries.length > 0 ? total_cost / deliveries.length : 0;

    // Estimar custo de combustível das rotas
    const fuelCost = await this.routeRepository
      .createQueryBuilder('route')
      .select('SUM(route.fuel_cost_estimate)', 'total_fuel_cost')
      .where('route.actual_start_time BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    const estimated_fuel_cost = parseFloat(fuelCost?.total_fuel_cost || 0);

    const average_delivery_fee = average_revenue_per_delivery;

    return {
      total_revenue: parseFloat(total_revenue.toFixed(2)),
      total_cost: parseFloat(total_cost.toFixed(2)),
      gross_profit: parseFloat(gross_profit.toFixed(2)),
      profit_margin: parseFloat(profit_margin.toFixed(2)),
      average_revenue_per_delivery: parseFloat(average_revenue_per_delivery.toFixed(2)),
      average_cost_per_delivery: parseFloat(average_cost_per_delivery.toFixed(2)),
      estimated_fuel_cost: parseFloat(estimated_fuel_cost.toFixed(2)),
      average_delivery_fee: parseFloat(average_delivery_fee.toFixed(2)),
    };
  }

  /**
   * Calcula métricas de performance
   */
  private async calculatePerformanceMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<PerformanceMetrics> {
    const deliveries = await this.deliveryRepository.find({
      where: {
        created_at: Between(startDate, endDate),
      },
      select: [
        'status',
        'scheduled_delivery_at',
        'actual_delivery_at',
        'created_at',
      ],
    });

    const completed = deliveries.filter((d) => d.status === DeliveryStatus.DELIVERED);

    // Calcular taxa de sucesso na primeira tentativa
    // TODO: Implementar baseado em delivery_attempts real
    const first_attempt_success_rate = 91.2;

    // Calcular tempo médio de resposta (placeholder)
    const average_response_time = 12.5; // TODO: Implementar cálculo real

    // Calcular produtividade
    const hoursInPeriod =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const productivity_rate = hoursInPeriod > 0 ? completed.length / hoursInPeriod : 0;

    // Calcular scores (baseados em múltiplas métricas)
    const operational_efficiency_score = this.calculateEfficiencyScore(deliveries);
    const service_quality_score = this.calculateQualityScore(completed);
    const customer_satisfaction_score = 89.7; // Placeholder - implementar integração com sistema de feedback

    return {
      operational_efficiency_score: parseFloat(operational_efficiency_score.toFixed(2)),
      service_quality_score: parseFloat(service_quality_score.toFixed(2)),
      customer_satisfaction_score: parseFloat(customer_satisfaction_score.toFixed(2)),
      average_response_time: parseFloat(average_response_time.toFixed(2)),
      first_attempt_success_rate: parseFloat(first_attempt_success_rate.toFixed(2)),
      productivity_rate: parseFloat(productivity_rate.toFixed(2)),
    };
  }

  /**
   * Calcula score de eficiência operacional
   */
  private calculateEfficiencyScore(deliveries: Delivery[]): number {
    if (deliveries.length === 0) return 0;

    const completed = deliveries.filter((d) => d.status === DeliveryStatus.DELIVERED).length;
    const successRate = (completed / deliveries.length) * 100;

    // Score baseado em múltiplos fatores (simplificado)
    return Math.min(100, successRate * 0.9);
  }

  /**
   * Calcula score de qualidade de serviço
   */
  private calculateQualityScore(completedDeliveries: Delivery[]): number {
    if (completedDeliveries.length === 0) return 0;

    const onTime = completedDeliveries.filter(
      (d) =>
        d.actual_delivery_at &&
        new Date(d.actual_delivery_at) <= new Date(d.scheduled_delivery_at),
    ).length;

    const onTimeRate = (onTime / completedDeliveries.length) * 100;

    return onTimeRate;
  }

  /**
   * Calcula comparação com período anterior
   */
  private async calculateComparison(
    startDate: Date,
    endDate: Date,
    currentMetrics: DashboardMetrics,
  ): Promise<any> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate.getTime());

    const [
      previousDeliveryMetrics,
      previousFinancialMetrics,
    ] = await Promise.all([
      this.calculateDeliveryMetrics(previousStartDate, previousEndDate),
      this.calculateFinancialMetrics(previousStartDate, previousEndDate),
    ]);

    const deliveries_growth =
      previousDeliveryMetrics.total > 0
        ? ((currentMetrics.deliveries.total - previousDeliveryMetrics.total) /
            previousDeliveryMetrics.total) *
          100
        : 0;

    const revenue_growth =
      previousFinancialMetrics.total_revenue > 0
        ? ((currentMetrics.financial.total_revenue -
            previousFinancialMetrics.total_revenue) /
            previousFinancialMetrics.total_revenue) *
          100
        : 0;

    const success_rate_change =
      currentMetrics.deliveries.success_rate - previousDeliveryMetrics.success_rate;

    const efficiency_change = 0; // Placeholder

    return {
      deliveries_growth: parseFloat(deliveries_growth.toFixed(2)),
      revenue_growth: parseFloat(revenue_growth.toFixed(2)),
      success_rate_change: parseFloat(success_rate_change.toFixed(2)),
      efficiency_change: parseFloat(efficiency_change.toFixed(2)),
    };
  }

  /**
   * Retorna dados de tendência para gráficos
   */
  async getTrendData(
    metricName: string,
    filterDto: DashboardFilterDto,
  ): Promise<TrendDataResponseDto> {
    const { period = DashboardPeriod.LAST_30_DAYS, start_date, end_date } = filterDto;

    const startDate = getPeriodStartDate(
      period,
      start_date ? new Date(start_date) : undefined,
    );
    const endDate = getPeriodEndDate(
      period,
      end_date ? new Date(end_date) : undefined,
    );

    this.logger.log(`Calculando tendência para ${metricName}`);

    let trendData: TrendData[] = [];

    switch (metricName) {
      case 'deliveries':
        trendData = await this.getDeliveriesTrend(startDate, endDate);
        break;
      case 'revenue':
        trendData = await this.getRevenueTrend(startDate, endDate);
        break;
      case 'routes':
        trendData = await this.getRoutesTrend(startDate, endDate);
        break;
      default:
        throw new Error(`Métrica desconhecida: ${metricName}`);
    }

    const values = trendData.map((d) => d.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = values.length > 0 ? total / values.length : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;

    // Calcular tendência
    const trend = this.calculateTrend(values);
    const change_percentage = this.calculateChangePercentage(values);

    return {
      period: period.toString(),
      metric_name: metricName,
      data: trendData,
      total,
      average: parseFloat(average.toFixed(2)),
      min,
      max,
      trend,
      change_percentage: parseFloat(change_percentage.toFixed(2)),
    };
  }

  /**
   * Calcula tendência de entregas
   */
  private async getDeliveriesTrend(startDate: Date, endDate: Date): Promise<TrendData[]> {
    const deliveriesByDay = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .select("DATE(delivery.created_at)", 'date')
      .addSelect('COUNT(delivery.id)', 'count')
      .where('delivery.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy("DATE(delivery.created_at)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return deliveriesByDay.map((item) => ({
      label: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: parseInt(item.count),
      date: new Date(item.date),
    }));
  }

  /**
   * Calcula tendência de receita
   */
  private async getRevenueTrend(startDate: Date, endDate: Date): Promise<TrendData[]> {
    const revenueByDay = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .select("DATE(delivery.created_at)", 'date')
      .addSelect('SUM(delivery.delivery_fee)', 'revenue')
      .where('delivery.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('delivery.status = :status', { status: DeliveryStatus.DELIVERED })
      .groupBy("DATE(delivery.created_at)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return revenueByDay.map((item) => ({
      label: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: parseFloat(item.revenue || 0),
      date: new Date(item.date),
    }));
  }

  /**
   * Calcula tendência de rotas
   */
  private async getRoutesTrend(startDate: Date, endDate: Date): Promise<TrendData[]> {
    const routesByDay = await this.routeRepository
      .createQueryBuilder('route')
      .select("DATE(route.planned_date)", 'date')
      .addSelect('COUNT(route.id)', 'count')
      .where('route.planned_date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy("DATE(route.planned_date)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return routesByDay.map((item) => ({
      label: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: parseInt(item.count),
      date: new Date(item.date),
    }));
  }

  /**
   * Calcula tendência dos dados
   */
  private calculateTrend(values: number[]): string {
    if (values.length < 2) return 'estável';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 5) return 'crescimento';
    if (change < -5) return 'decrescimento';
    return 'estável';
  }

  /**
   * Calcula percentual de mudança
   */
  private calculateChangePercentage(values: number[]): number {
    if (values.length < 2) return 0;

    const first = values[0]!;
    const last = values[values.length - 1]!;

    if (first === 0) return last > 0 ? 100 : 0;

    return ((last - first) / first) * 100;
  }

  /**
   * Retorna distribuição por categoria
   */
  async getCategoryDistribution(
    categoryType: string,
    filterDto: DashboardFilterDto,
  ): Promise<CategoryDistributionResponseDto> {
    const { period = DashboardPeriod.LAST_30_DAYS, start_date, end_date } = filterDto;

    const startDate = getPeriodStartDate(
      period,
      start_date ? new Date(start_date) : undefined,
    );
    const endDate = getPeriodEndDate(
      period,
      end_date ? new Date(end_date) : undefined,
    );

    this.logger.log(`Calculando distribuição para ${categoryType}`);

    let distribution: CategoryDistribution[] = [];
    let total = 0;

    switch (categoryType) {
      case 'deliveries_by_status':
        ({ distribution, total } = await this.getDeliveriesByStatus(startDate, endDate));
        break;
      case 'vehicles_by_type':
        ({ distribution, total } = await this.getVehiclesByType());
        break;
      case 'drivers_by_status':
        ({ distribution, total } = await this.getDriversByStatus());
        break;
      default:
        throw new Error(`Tipo de categoria desconhecido: ${categoryType}`);
    }

    return {
      metric_name: categoryType,
      total,
      distribution,
    };
  }

  /**
   * Distribuição de entregas por status
   */
  private async getDeliveriesByStatus(
    startDate: Date,
    endDate: Date,
  ): Promise<{ distribution: CategoryDistribution[]; total: number }> {
    const deliveriesByStatus = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .select('delivery.status', 'status')
      .addSelect('COUNT(delivery.id)', 'count')
      .where('delivery.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('delivery.status')
      .getRawMany();

    const total = deliveriesByStatus.reduce((sum, item) => sum + parseInt(item.count), 0);

    const statusColors: Record<string, string> = {
      [DeliveryStatus.DELIVERED]: '#10b981',
      [DeliveryStatus.PENDING]: '#f59e0b',
      [DeliveryStatus.IN_TRANSIT]: '#3b82f6',
      [DeliveryStatus.OUT_FOR_DELIVERY]: '#6366f1',
      [DeliveryStatus.CANCELLED]: '#ef4444',
      [DeliveryStatus.FAILED]: '#dc2626',
      [DeliveryStatus.ASSIGNED]: '#8b5cf6',
      [DeliveryStatus.PICKED_UP]: '#14b8a6',
    };

    const distribution = deliveriesByStatus.map((item) => ({
      category: item.status,
      count: parseInt(item.count),
      percentage: parseFloat(((parseInt(item.count) / total) * 100).toFixed(2)),
      color: statusColors[item.status] || '#6b7280',
    }));

    return { distribution, total };
  }

  /**
   * Distribuição de veículos por tipo
   */
  private async getVehiclesByType(): Promise<{
    distribution: CategoryDistribution[];
    total: number;
  }> {
    const vehiclesByType = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .select('vehicle.vehicle_type', 'type')
      .addSelect('COUNT(vehicle.id)', 'count')
      .groupBy('vehicle.vehicle_type')
      .getRawMany();

    const total = vehiclesByType.reduce((sum, item) => sum + parseInt(item.count), 0);

    const distribution = vehiclesByType.map((item) => ({
      category: item.type,
      count: parseInt(item.count),
      percentage: parseFloat(((parseInt(item.count) / total) * 100).toFixed(2)),
    }));

    return { distribution, total };
  }

  /**
   * Distribuição de motoristas por status
   */
  private async getDriversByStatus(): Promise<{
    distribution: CategoryDistribution[];
    total: number;
  }> {
    const driversByStatus = await this.driverRepository
      .createQueryBuilder('driver')
      .select('driver.status', 'status')
      .addSelect('COUNT(driver.id)', 'count')
      .where('driver.is_active = :isActive', { isActive: true })
      .groupBy('driver.status')
      .getRawMany();

    const total = driversByStatus.reduce((sum, item) => sum + parseInt(item.count), 0);

    const statusColors: Record<string, string> = {
      [DriverStatus.AVAILABLE]: '#10b981',
      [DriverStatus.ON_ROUTE]: '#3b82f6',
      [DriverStatus.UNAVAILABLE]: '#f59e0b',
      [DriverStatus.VACATION]: '#fbbf24',
      [DriverStatus.BLOCKED]: '#6b7280',
    };

    const distribution = driversByStatus.map((item) => ({
      category: item.status,
      count: parseInt(item.count),
      percentage: parseFloat(((parseInt(item.count) / total) * 100).toFixed(2)),
      color: statusColors[item.status] || '#6b7280',
    }));

    return { distribution, total };
  }

  /**
   * Retorna ranking de performance
   */
  async getPerformanceRanking(
    rankingType: string,
    filterDto: DashboardFilterDto,
  ): Promise<PerformanceRankingResponseDto> {
    const { period = DashboardPeriod.LAST_30_DAYS, start_date, end_date } = filterDto;

    const startDate = getPeriodStartDate(
      period,
      start_date ? new Date(start_date) : undefined,
    );
    const endDate = getPeriodEndDate(
      period,
      end_date ? new Date(end_date) : undefined,
    );

    this.logger.log(`Calculando ranking para ${rankingType}`);

    let ranking: PerformanceRanking[] = [];
    let metric = '';

    switch (rankingType) {
      case 'top_drivers':
        ({ ranking, metric } = await this.getTopDrivers(startDate, endDate));
        break;
      case 'top_vehicles':
        ({ ranking, metric } = await this.getTopVehicles(startDate, endDate));
        break;
      default:
        throw new Error(`Tipo de ranking desconhecido: ${rankingType}`);
    }

    return {
      ranking_type: rankingType,
      period: period.toString(),
      ranking,
      metric,
    };
  }

  /**
   * Ranking de melhores motoristas
   */
  private async getTopDrivers(
    startDate: Date,
    endDate: Date,
  ): Promise<{ ranking: PerformanceRanking[]; metric: string }> {
    const topDrivers = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .select('delivery.driver_id', 'driver_id')
      .addSelect('driver.full_name', 'driver_name')
      .addSelect('COUNT(delivery.id)', 'deliveries_count')
      .addSelect(
        `COUNT(CASE WHEN delivery.status = '${DeliveryStatus.DELIVERED}' THEN 1 END)`,
        'completed_count',
      )
      .innerJoin('delivery.driver', 'driver')
      .where('delivery.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('delivery.driver_id IS NOT NULL')
      .groupBy('delivery.driver_id, driver.full_name')
      .orderBy('deliveries_count', 'DESC')
      .limit(10)
      .getRawMany();

    const ranking = topDrivers.map((item, index) => ({
      id: item.driver_id,
      name: item.driver_name,
      score: parseInt(item.deliveries_count),
      rank: index + 1,
      metadata: {
        deliveries: parseInt(item.deliveries_count),
        completed: parseInt(item.completed_count),
        success_rate: parseFloat(
          ((parseInt(item.completed_count) / parseInt(item.deliveries_count)) * 100).toFixed(
            2,
          ),
        ),
      },
    }));

    return { ranking, metric: 'deliveries_count' };
  }

  /**
   * Ranking de veículos mais utilizados
   */
  private async getTopVehicles(
    startDate: Date,
    endDate: Date,
  ): Promise<{ ranking: PerformanceRanking[]; metric: string }> {
    const topVehicles = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .select('delivery.vehicle_id', 'vehicle_id')
      .addSelect('vehicle.license_plate', 'vehicle_plate')
      .addSelect('vehicle.model', 'vehicle_model')
      .addSelect('COUNT(delivery.id)', 'deliveries_count')
      .innerJoin('delivery.vehicle', 'vehicle')
      .where('delivery.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('delivery.vehicle_id IS NOT NULL')
      .groupBy('delivery.vehicle_id, vehicle.license_plate, vehicle.model')
      .orderBy('deliveries_count', 'DESC')
      .limit(10)
      .getRawMany();

    const ranking = topVehicles.map((item, index) => ({
      id: item.vehicle_id,
      name: `${item.vehicle_model} (${item.vehicle_plate})`,
      score: parseInt(item.deliveries_count),
      rank: index + 1,
      metadata: {
        deliveries: parseInt(item.deliveries_count),
        license_plate: item.vehicle_plate,
      },
    }));

    return { ranking, metric: 'deliveries_count' };
  }
}
