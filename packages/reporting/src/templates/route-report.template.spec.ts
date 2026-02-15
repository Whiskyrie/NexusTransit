import { Test, TestingModule } from "@nestjs/testing";
import { RouteReportTemplate } from "./route-report.template";
import type { RouteReportData } from "../interfaces/reporting.interfaces";

describe("RouteReportTemplate", () => {
  let template: RouteReportTemplate;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RouteReportTemplate],
    }).compile();

    template = module.get<RouteReportTemplate>(RouteReportTemplate);
  });

  const mockRoutes: RouteReportData[] = [
    {
      routeId: "R001",
      routeName: "São Paulo - Rio",
      startLocation: "São Paulo",
      endLocation: "Rio de Janeiro",
      distance: 450,
      estimatedDuration: 360,
      actualDuration: 380,
      stops: 5,
      completedStops: 5,
      fuelConsumption: 45,
      efficiency: 94.7,
    },
    {
      routeId: "R002",
      routeName: "Rio - BH",
      startLocation: "Rio de Janeiro",
      endLocation: "Belo Horizonte",
      distance: 350,
      estimatedDuration: 300,
      actualDuration: 330,
      stops: 4,
      completedStops: 3,
      fuelConsumption: 35,
      efficiency: 82.0,
    },
    {
      routeId: "R003",
      routeName: "SP - Campinas",
      startLocation: "São Paulo",
      endLocation: "Campinas",
      distance: 100,
      estimatedDuration: 90,
      actualDuration: 85,
      stops: 3,
      completedStops: 3,
      fuelConsumption: 10,
      efficiency: 95.5,
    },
  ];

  describe("getColumns", () => {
    it("should return all route columns", () => {
      const columns = template.getColumns();

      expect(columns).toHaveLength(11);
      expect(columns.map((c) => c.key)).toContain("routeId");
      expect(columns.map((c) => c.key)).toContain("routeName");
      expect(columns.map((c) => c.key)).toContain("startLocation");
      expect(columns.map((c) => c.key)).toContain("endLocation");
      expect(columns.map((c) => c.key)).toContain("distance");
      expect(columns.map((c) => c.key)).toContain("estimatedDuration");
      expect(columns.map((c) => c.key)).toContain("actualDuration");
      expect(columns.map((c) => c.key)).toContain("stops");
      expect(columns.map((c) => c.key)).toContain("completedStops");
      expect(columns.map((c) => c.key)).toContain("fuelConsumption");
      expect(columns.map((c) => c.key)).toContain("efficiency");
    });
  });

  describe("createReport", () => {
    it("should create report with default title", () => {
      const report = template.createReport(mockRoutes);

      expect(report.title).toBe("Relatório de Rotas");
      expect(report.columns).toHaveLength(11);
      expect(report.rows).toEqual(mockRoutes);
    });

    it("should create report with custom title", () => {
      const customTitle = "Custom Route Report";
      const report = template.createReport(mockRoutes, customTitle);

      expect(report.title).toBe(customTitle);
    });

    it("should create report with description", () => {
      const description = "Route analysis Q1 2024";
      const report = template.createReport(mockRoutes, undefined, description);

      expect(report.description).toBe(description);
    });
  });

  describe("calculateMetrics", () => {
    it("should calculate correct totals", () => {
      const metrics = template.calculateMetrics(mockRoutes);

      expect(metrics.total).toBe(3);
      expect(metrics.totalDistance).toBe(900);
      expect(metrics.totalStops).toBe(12);
      expect(metrics.completedStops).toBe(11);
    });

    it("should calculate average efficiency", () => {
      const metrics = template.calculateMetrics(mockRoutes);

      expect(metrics.avgEfficiency).toBeCloseTo(90.7, 1);
    });

    it("should calculate time deviation", () => {
      const metrics = template.calculateMetrics(mockRoutes);

      expect(metrics.avgTimeDeviation).toBeGreaterThan(0);
    });

    it("should calculate completion rate", () => {
      const metrics = template.calculateMetrics(mockRoutes);

      expect(metrics.completionRate).toBeCloseTo(91.67, 1);
    });

    it("should calculate total fuel consumption", () => {
      const metrics = template.calculateMetrics(mockRoutes);

      expect(metrics.totalFuelConsumption).toBe(90);
    });

    it("should handle empty routes", () => {
      const metrics = template.calculateMetrics([]);

      expect(metrics.total).toBe(0);
      expect(metrics.avgEfficiency).toBe(0);
      expect(metrics.completionRate).toBe(0);
    });
  });

  describe("filterByMinEfficiency", () => {
    it("should filter routes by minimum efficiency", () => {
      const filtered = template.filterByMinEfficiency(mockRoutes, 90);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].routeId).toBe("R001");
      expect(filtered[1].routeId).toBe("R003");
    });

    it("should return empty array when no routes meet criteria", () => {
      const filtered = template.filterByMinEfficiency(mockRoutes, 99);

      expect(filtered).toHaveLength(0);
    });
  });

  describe("getDelayedRoutes", () => {
    it("should identify delayed routes", () => {
      // Create a route that is actually delayed (> 20% over estimated)
      const routesWithDelayed = [
        ...mockRoutes,
        {
          routeId: "R004",
          routeName: "Delayed Route",
          startLocation: "A",
          endLocation: "B",
          distance: 100,
          estimatedDuration: 100,
          actualDuration: 130, // 30% over estimated
          stops: 2,
          completedStops: 2,
          fuelConsumption: 10,
          efficiency: 70,
        },
      ];

      const delayed = template.getDelayedRoutes(routesWithDelayed);

      expect(delayed.length).toBeGreaterThan(0);
      expect(delayed.some((r) => r.routeId === "R004")).toBe(true);
    });

    it("should not include routes without actual duration", () => {
      const routesWithoutActual = [
        {
          ...mockRoutes[0],
          actualDuration: undefined,
        },
      ];

      const delayed = template.getDelayedRoutes(routesWithoutActual);

      expect(delayed).toHaveLength(0);
    });
  });

  describe("groupByEfficiency", () => {
    it("should group routes by efficiency categories", () => {
      const groups = template.groupByEfficiency(mockRoutes);

      // R001: 94.7% -> excellent (>=90)
      // R002: 82.0% -> good (80-89)
      // R003: 95.5% -> excellent (>=90)
      expect(groups.excellent).toHaveLength(2);
      expect(groups.good).toHaveLength(1);
      expect(groups.average).toHaveLength(0);
      expect(groups.poor).toHaveLength(0);
    });

    it("should categorize correctly based on efficiency ranges", () => {
      const routesWithVariousEfficiencies: RouteReportData[] = [
        { ...mockRoutes[0], efficiency: 95 },
        { ...mockRoutes[0], efficiency: 80 },
        { ...mockRoutes[0], efficiency: 65 },
        { ...mockRoutes[0], efficiency: 50 },
      ];

      const groups = template.groupByEfficiency(routesWithVariousEfficiencies);

      expect(groups.excellent).toHaveLength(1);
      expect(groups.good).toHaveLength(1);
      expect(groups.average).toHaveLength(1);
      expect(groups.poor).toHaveLength(1);
    });
  });

  describe("calculateFuelSavings", () => {
    it("should calculate positive savings", () => {
      const savings = template.calculateFuelSavings([
        { ...mockRoutes[0], distance: 100, fuelConsumption: 25 },
      ]);

      expect(savings).toBeGreaterThan(0);
    });

    it("should calculate negative savings (over consumption)", () => {
      const savings = template.calculateFuelSavings([
        { ...mockRoutes[0], distance: 100, fuelConsumption: 35 },
      ]);

      expect(savings).toBeLessThan(0);
    });

    it("should handle undefined fuel consumption", () => {
      const savings = template.calculateFuelSavings([
        { ...mockRoutes[0], fuelConsumption: undefined },
      ]);

      expect(savings).toBe(0);
    });
  });
});
