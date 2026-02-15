import { Test, TestingModule } from "@nestjs/testing";
import { DeliveryReportTemplate } from "./delivery-report.template";
import type { DeliveryReportData } from "../interfaces/reporting.interfaces";

describe("DeliveryReportTemplate", () => {
  let template: DeliveryReportTemplate;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeliveryReportTemplate],
    }).compile();

    template = module.get<DeliveryReportTemplate>(DeliveryReportTemplate);
  });

  const mockDeliveries: DeliveryReportData[] = [
    {
      deliveryId: "DEL001",
      trackingNumber: "TRK123",
      origin: "São Paulo",
      destination: "Rio de Janeiro",
      status: "delivered",
      scheduledDate: new Date("2024-01-15"),
      actualDate: new Date("2024-01-15"),
      driverName: "João Silva",
      vehiclePlate: "ABC-1234",
      weight: 150.5,
      volume: 2.5,
    },
    {
      deliveryId: "DEL002",
      trackingNumber: "TRK124",
      origin: "Rio de Janeiro",
      destination: "São Paulo",
      status: "in_transit",
      scheduledDate: new Date("2024-01-20"),
      driverName: "Maria Souza",
      vehiclePlate: "DEF-5678",
      weight: 200,
      volume: 3.0,
    },
    {
      deliveryId: "DEL003",
      trackingNumber: "TRK125",
      origin: "Curitiba",
      destination: "Florianópolis",
      status: "pending",
      scheduledDate: new Date("2024-01-25"),
      weight: 100,
      volume: 1.5,
    },
  ];

  describe("getColumns", () => {
    it("should return all delivery columns", () => {
      const columns = template.getColumns();

      expect(columns).toHaveLength(11);
      expect(columns.map((c) => c.key)).toContain("deliveryId");
      expect(columns.map((c) => c.key)).toContain("trackingNumber");
      expect(columns.map((c) => c.key)).toContain("origin");
      expect(columns.map((c) => c.key)).toContain("destination");
      expect(columns.map((c) => c.key)).toContain("status");
      expect(columns.map((c) => c.key)).toContain("scheduledDate");
      expect(columns.map((c) => c.key)).toContain("actualDate");
      expect(columns.map((c) => c.key)).toContain("driverName");
      expect(columns.map((c) => c.key)).toContain("vehiclePlate");
      expect(columns.map((c) => c.key)).toContain("weight");
      expect(columns.map((c) => c.key)).toContain("volume");
    });
  });

  describe("createReport", () => {
    it("should create report with default title", () => {
      const report = template.createReport(mockDeliveries);

      expect(report.title).toBe("Relatório de Entregas");
      expect(report.columns).toHaveLength(11);
      expect(report.rows).toEqual(mockDeliveries);
    });

    it("should create report with custom title", () => {
      const customTitle = "Custom Delivery Report";
      const report = template.createReport(mockDeliveries, customTitle);

      expect(report.title).toBe(customTitle);
    });

    it("should create report with description", () => {
      const description = "Report for January 2024";
      const report = template.createReport(mockDeliveries, undefined, description);

      expect(report.description).toBe(description);
    });
  });

  describe("calculateMetrics", () => {
    it("should calculate correct totals", () => {
      const metrics = template.calculateMetrics(mockDeliveries);

      expect(metrics.total).toBe(3);
      expect(metrics.completed).toBe(1);
      expect(metrics.inTransit).toBe(1);
      expect(metrics.pending).toBe(1);
      expect(metrics.delayed).toBe(0);
    });

    it("should calculate total weight and volume", () => {
      const metrics = template.calculateMetrics(mockDeliveries);

      expect(metrics.totalWeight).toBe(450.5);
      expect(metrics.totalVolume).toBe(7.0);
    });

    it("should calculate on-time delivery rate", () => {
      const metrics = template.calculateMetrics(mockDeliveries);

      expect(metrics.onTimeDeliveries).toBe(1);
      expect(metrics.onTimeRate).toBe(100);
    });

    it("should calculate completion rate", () => {
      const metrics = template.calculateMetrics(mockDeliveries);

      expect(metrics.completionRate).toBeCloseTo(33.33, 1);
    });

    it("should handle empty deliveries", () => {
      const metrics = template.calculateMetrics([]);

      expect(metrics.total).toBe(0);
      expect(metrics.totalWeight).toBe(0);
      expect(metrics.completionRate).toBe(0);
    });
  });

  describe("filterByStatus", () => {
    it("should filter deliveries by status", () => {
      const delivered = template.filterByStatus(mockDeliveries, "delivered");

      expect(delivered).toHaveLength(1);
      expect(delivered[0].deliveryId).toBe("DEL001");
    });

    it("should return empty array when no matches", () => {
      const delayed = template.filterByStatus(mockDeliveries, "delayed");

      expect(delayed).toHaveLength(0);
    });
  });

  describe("filterByDateRange", () => {
    it("should filter deliveries by date range", () => {
      const startDate = new Date("2024-01-14");
      const endDate = new Date("2024-01-16");

      const filtered = template.filterByDateRange(mockDeliveries, startDate, endDate);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].deliveryId).toBe("DEL001");
    });

    it("should use actualDate when available", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-15");

      const filtered = template.filterByDateRange(mockDeliveries, startDate, endDate);

      expect(filtered).toHaveLength(1);
    });

    it("should use scheduledDate when actualDate is not available", () => {
      const startDate = new Date("2024-01-20");
      const endDate = new Date("2024-01-20");

      const filtered = template.filterByDateRange(mockDeliveries, startDate, endDate);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].deliveryId).toBe("DEL002");
    });
  });

  describe("groupByDriver", () => {
    it("should group deliveries by driver", () => {
      const groups = template.groupByDriver(mockDeliveries);

      expect(groups["João Silva"]).toHaveLength(1);
      expect(groups["Maria Souza"]).toHaveLength(1);
      expect(groups["Não atribuído"]).toHaveLength(1);
    });

    it("should handle deliveries without driver", () => {
      const groups = template.groupByDriver(mockDeliveries);

      expect(groups["Não atribuído"]).toBeDefined();
      expect(groups["Não atribuído"][0].deliveryId).toBe("DEL003");
    });
  });

  describe("groupByStatus", () => {
    it("should group deliveries by status", () => {
      const groups = template.groupByStatus(mockDeliveries);

      expect(groups["delivered"]).toHaveLength(1);
      expect(groups["in_transit"]).toHaveLength(1);
      expect(groups["pending"]).toHaveLength(1);
    });
  });
});
