import { Test, TestingModule } from "@nestjs/testing";
import { IncidentReportTemplate } from "./incident-report.template";
import type { IncidentReportData } from "../interfaces/reporting.interfaces";

describe("IncidentReportTemplate", () => {
  let template: IncidentReportTemplate;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncidentReportTemplate],
    }).compile();

    template = module.get<IncidentReportTemplate>(IncidentReportTemplate);
  });

  const mockIncidents: IncidentReportData[] = [
    {
      incidentId: "INC001",
      type: "Mechanical Failure",
      severity: "high",
      description: "Engine overheating",
      location: "Highway BR-101, km 45",
      reportedAt: new Date("2024-01-15T10:30:00"),
      resolvedAt: new Date("2024-01-15T14:30:00"),
      reportedBy: "João Silva",
      status: "resolved",
      impact: "Delivery delayed by 4 hours",
      resolution: "Engine coolant replaced",
    },
    {
      incidentId: "INC002",
      type: "Accident",
      severity: "critical",
      description: "Minor collision with another vehicle",
      location: "Av. Paulista, São Paulo",
      reportedAt: new Date("2024-01-16T08:00:00"),
      reportedBy: "Maria Souza",
      status: "in_progress",
      impact: "Vehicle damaged, route interrupted",
    },
    {
      incidentId: "INC003",
      type: "Delay",
      severity: "medium",
      description: "Traffic congestion due to accident",
      location: "Highway SP-280, km 120",
      reportedAt: new Date("2024-01-17T16:00:00"),
      resolvedAt: new Date("2024-01-17T18:30:00"),
      reportedBy: "Pedro Costa",
      status: "closed",
      resolution: "Traffic cleared, delivery completed",
    },
    {
      incidentId: "INC004",
      type: "Documentation Issue",
      severity: "low",
      description: "Missing delivery receipt signature",
      location: "Client location",
      reportedAt: new Date("2024-01-18T09:00:00"),
      reportedBy: "Ana Paula",
      status: "open",
    },
  ];

  describe("getColumns", () => {
    it("should return all incident columns", () => {
      const columns = template.getColumns();

      expect(columns).toHaveLength(11);
      expect(columns.map((c) => c.key)).toContain("incidentId");
      expect(columns.map((c) => c.key)).toContain("type");
      expect(columns.map((c) => c.key)).toContain("severity");
      expect(columns.map((c) => c.key)).toContain("description");
      expect(columns.map((c) => c.key)).toContain("location");
      expect(columns.map((c) => c.key)).toContain("reportedAt");
      expect(columns.map((c) => c.key)).toContain("resolvedAt");
      expect(columns.map((c) => c.key)).toContain("reportedBy");
      expect(columns.map((c) => c.key)).toContain("status");
      expect(columns.map((c) => c.key)).toContain("impact");
      expect(columns.map((c) => c.key)).toContain("resolution");
    });
  });

  describe("createReport", () => {
    it("should create report with default title", () => {
      const report = template.createReport(mockIncidents);

      expect(report.title).toBe("Relatório de Incidentes");
      expect(report.columns).toHaveLength(11);
      expect(report.rows).toEqual(mockIncidents);
    });

    it("should create report with custom title", () => {
      const customTitle = "Custom Incident Report";
      const report = template.createReport(mockIncidents, customTitle);

      expect(report.title).toBe(customTitle);
    });

    it("should create report with description", () => {
      const description = "Incident analysis Q1 2024";
      const report = template.createReport(mockIncidents, undefined, description);

      expect(report.description).toBe(description);
    });
  });

  describe("calculateMetrics", () => {
    it("should calculate correct totals", () => {
      const metrics = template.calculateMetrics(mockIncidents);

      expect(metrics.total).toBe(4);
    });

    it("should count incidents by severity", () => {
      const metrics = template.calculateMetrics(mockIncidents);

      expect(metrics.bySeverity.critical).toBe(1);
      expect(metrics.bySeverity.high).toBe(1);
      expect(metrics.bySeverity.medium).toBe(1);
      expect(metrics.bySeverity.low).toBe(1);
    });

    it("should count incidents by status", () => {
      const metrics = template.calculateMetrics(mockIncidents);

      expect(metrics.byStatus.open).toBe(1);
      expect(metrics.byStatus.in_progress).toBe(1);
      expect(metrics.byStatus.resolved).toBe(1);
      expect(metrics.byStatus.closed).toBe(1);
    });

    it("should calculate open and resolved incident counts", () => {
      const metrics = template.calculateMetrics(mockIncidents);

      expect(metrics.openIncidents).toBe(2);
      expect(metrics.resolvedIncidents).toBe(2);
    });

    it("should calculate average resolution time", () => {
      const metrics = template.calculateMetrics(mockIncidents);

      expect(metrics.avgResolutionTime).toBeGreaterThan(0);
    });

    it("should calculate critical rate", () => {
      const metrics = template.calculateMetrics(mockIncidents);

      expect(metrics.criticalRate).toBe(25);
    });

    it("should calculate resolution rate", () => {
      const metrics = template.calculateMetrics(mockIncidents);

      expect(metrics.resolutionRate).toBe(50);
    });

    it("should handle empty incidents array", () => {
      const metrics = template.calculateMetrics([]);

      expect(metrics.total).toBe(0);
      expect(metrics.avgResolutionTime).toBe(0);
      expect(metrics.resolutionRate).toBe(0);
    });
  });

  describe("filterBySeverity", () => {
    it("should filter incidents by severity", () => {
      const high = template.filterBySeverity(mockIncidents, "high");

      expect(high).toHaveLength(1);
      expect(high[0].incidentId).toBe("INC001");
    });

    it("should return empty array when no matches", () => {
      const critical = template.filterBySeverity([], "critical");

      expect(critical).toHaveLength(0);
    });
  });

  describe("filterByStatus", () => {
    it("should filter incidents by status", () => {
      const open = template.filterByStatus(mockIncidents, "open");

      expect(open).toHaveLength(1);
      expect(open[0].incidentId).toBe("INC004");
    });

    it("should return all matching incidents", () => {
      const resolved = template.filterByStatus(mockIncidents, "resolved");

      expect(resolved).toHaveLength(1);
    });
  });

  describe("filterByDateRange", () => {
    it("should filter incidents by date range", () => {
      // Use full datetime to avoid timezone issues
      const startDate = new Date("2024-01-15T00:00:00");
      const endDate = new Date("2024-01-16T23:59:59");

      const filtered = template.filterByDateRange(mockIncidents, startDate, endDate);

      expect(filtered).toHaveLength(2);
      expect(filtered.some((i) => i.incidentId === "INC001")).toBe(true);
      expect(filtered.some((i) => i.incidentId === "INC002")).toBe(true);
    });

    it("should use reportedAt for filtering", () => {
      // Use end of day for endDate to include incidents reported during the day
      const startDate = new Date("2024-01-18T00:00:00");
      const endDate = new Date("2024-01-18T23:59:59");

      const filtered = template.filterByDateRange(mockIncidents, startDate, endDate);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].incidentId).toBe("INC004");
    });
  });

  describe("groupByType", () => {
    it("should group incidents by type", () => {
      const groups = template.groupByType(mockIncidents);

      expect(groups["Mechanical Failure"]).toHaveLength(1);
      expect(groups["Accident"]).toHaveLength(1);
      expect(groups["Delay"]).toHaveLength(1);
      expect(groups["Documentation Issue"]).toHaveLength(1);
    });

    it("should group unknown types correctly", () => {
      const incidentsWithUnknown = [...mockIncidents, { ...mockIncidents[0], type: "" }];

      const groups = template.groupByType(incidentsWithUnknown);

      expect(groups["unknown"]).toHaveLength(1);
    });
  });

  describe("getCriticalOpenIncidents", () => {
    it("should identify critical open incidents", () => {
      const criticalOpen = template.getCriticalOpenIncidents(mockIncidents);

      expect(criticalOpen).toHaveLength(1);
      expect(criticalOpen[0].incidentId).toBe("INC002");
    });

    it("should not include resolved critical incidents", () => {
      const criticalResolved: IncidentReportData[] = [
        {
          ...mockIncidents[0],
          severity: "critical",
          status: "resolved",
        },
      ];

      const criticalOpen = template.getCriticalOpenIncidents(criticalResolved);

      expect(criticalOpen).toHaveLength(0);
    });
  });

  describe("calculateResolutionTime", () => {
    it("should calculate resolution time in hours", () => {
      const incident = mockIncidents[0];
      const resolutionTime = template.calculateResolutionTime(incident);

      expect(resolutionTime).toBe(4);
    });

    it("should return null for unresolved incidents", () => {
      const unresolved = mockIncidents[1];
      const resolutionTime = template.calculateResolutionTime(unresolved);

      expect(resolutionTime).toBeNull();
    });
  });

  describe("generateSummary", () => {
    it("should generate text summary for incident", () => {
      const summary = template.generateSummary(mockIncidents[0]);

      expect(summary).toContain("INC001");
      expect(summary).toContain("Mechanical Failure");
      expect(summary).toContain("HIGH");
      expect(summary).toContain("resolved");
      expect(summary).toContain("4.00 horas");
      expect(summary).toContain("Engine coolant replaced");
    });

    it("should indicate open status for unresolved incidents", () => {
      const summary = template.generateSummary(mockIncidents[1]);

      expect(summary).toContain("Ainda em aberto");
    });
  });
});
