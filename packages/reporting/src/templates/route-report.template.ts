import { Injectable } from "@nestjs/common";
import type { ReportData, ReportColumn, RouteReportData } from "../interfaces/reporting.interfaces";

@Injectable()
export class RouteReportTemplate {
  /**
   * Nome do template
   */
  readonly name = "route";

  /**
   * Título padrão do relatório
   */
  readonly defaultTitle = "Relatório de Rotas";

  /**
   * Colunas padrão para o relatório de rotas
   */
  getColumns(): ReportColumn[] {
    return [
      {
        key: "routeId",
        header: "ID da Rota",
        width: 15,
      },
      {
        key: "routeName",
        header: "Nome da Rota",
        width: 25,
      },
      {
        key: "startLocation",
        header: "Local de Origem",
        width: 25,
      },
      {
        key: "endLocation",
        header: "Local de Destino",
        width: 25,
      },
      {
        key: "distance",
        header: "Distância (km)",
        width: 15,
      },
      {
        key: "estimatedDuration",
        header: "Duração Estimada (min)",
        width: 20,
      },
      {
        key: "actualDuration",
        header: "Duração Real (min)",
        width: 18,
      },
      {
        key: "stops",
        header: "Paradas",
        width: 10,
      },
      {
        key: "completedStops",
        header: "Paradas Completadas",
        width: 20,
      },
      {
        key: "fuelConsumption",
        header: "Consumo (L)",
        width: 12,
      },
      {
        key: "efficiency",
        header: "Eficiência (%)",
        width: 15,
      },
    ];
  }

  /**
   * Cria um relatório de rotas a partir dos dados
   */
  createReport(
    routes: RouteReportData[],
    title?: string,
    description?: string,
  ): ReportData<RouteReportData> {
    return {
      title: title || this.defaultTitle,
      description,
      columns: this.getColumns(),
      rows: routes,
    };
  }

  /**
   * Calcula métricas de resumo para rotas
   */
  calculateMetrics(routes: RouteReportData[]) {
    const total = routes.length;
    const totalDistance = routes.reduce((sum, r) => sum + r.distance, 0);
    const totalStops = routes.reduce((sum, r) => sum + r.stops, 0);
    const completedStops = routes.reduce((sum, r) => sum + r.completedStops, 0);
    const avgEfficiency = total > 0 ? routes.reduce((sum, r) => sum + r.efficiency, 0) / total : 0;

    const routesWithActual = routes.filter((r) => r.actualDuration !== undefined);
    const avgTimeDeviation =
      routesWithActual.length > 0
        ? routesWithActual.reduce((sum, r) => {
            const deviation = Math.abs((r.actualDuration || 0) - r.estimatedDuration);
            return sum + deviation;
          }, 0) / routesWithActual.length
        : 0;

    return {
      total,
      totalDistance,
      totalStops,
      completedStops,
      completionRate: totalStops > 0 ? (completedStops / totalStops) * 100 : 0,
      avgEfficiency,
      avgTimeDeviation,
      totalFuelConsumption: routes.reduce((sum, r) => sum + (r.fuelConsumption || 0), 0),
    };
  }

  /**
   * Filtra rotas por eficiência mínima
   */
  filterByMinEfficiency(routes: RouteReportData[], minEfficiency: number): RouteReportData[] {
    return routes.filter((r) => r.efficiency >= minEfficiency);
  }

  /**
   * Identifica rotas com atraso
   */
  getDelayedRoutes(routes: RouteReportData[]): RouteReportData[] {
    return routes.filter((r) => {
      if (!r.actualDuration) return false;
      return r.actualDuration > r.estimatedDuration * 1.2;
    });
  }

  /**
   * Agrupa rotas por faixa de eficiência
   */
  groupByEfficiency(routes: RouteReportData[]) {
    const groups = {
      excellent: [] as RouteReportData[],
      good: [] as RouteReportData[],
      average: [] as RouteReportData[],
      poor: [] as RouteReportData[],
    };

    for (const route of routes) {
      if (route.efficiency >= 90) {
        groups.excellent.push(route);
      } else if (route.efficiency >= 75) {
        groups.good.push(route);
      } else if (route.efficiency >= 60) {
        groups.average.push(route);
      } else {
        groups.poor.push(route);
      }
    }

    return groups;
  }

  /**
   * Calcula economia de combustível estimada
   */
  calculateFuelSavings(routes: RouteReportData[]) {
    const baselineConsumption = 0.3;

    return routes.reduce((total, route) => {
      const estimatedConsumption = route.distance * baselineConsumption;
      const actualConsumption = route.fuelConsumption || estimatedConsumption;
      return total + (estimatedConsumption - actualConsumption);
    }, 0);
  }
}
