import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { PdfGeneratorService } from "./services/pdf-generator.service";
import { ExcelGeneratorService } from "./services/excel-generator.service";
import { CsvGeneratorService } from "./services/csv-generator.service";
import { ReportBuilderService } from "./services/report-builder.service";
import { DeliveryReportTemplate } from "./templates/delivery-report.template";
import { RouteReportTemplate } from "./templates/route-report.template";
import { IncidentReportTemplate } from "./templates/incident-report.template";
import { Report } from "./entities/report.entity";
import { ReportOutputType, type ReportData } from "./interfaces/reporting.interfaces";

describe("ReportsService", () => {
  let service: ReportsService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockPdfGenerator = {
    generate: jest.fn(),
  };

  const mockExcelGenerator = {
    generate: jest.fn(),
  };

  const mockCsvGenerator = {
    generate: jest.fn(),
  };

  const mockReportBuilder = {
    buildReport: jest.fn(),
  };

  const mockDeliveryTemplate = {
    createReport: jest.fn(),
  };

  const mockRouteTemplate = {
    createReport: jest.fn(),
  };

  const mockIncidentTemplate = {
    createReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Report),
          useValue: mockRepository,
        },
        {
          provide: PdfGeneratorService,
          useValue: mockPdfGenerator,
        },
        {
          provide: ExcelGeneratorService,
          useValue: mockExcelGenerator,
        },
        {
          provide: CsvGeneratorService,
          useValue: mockCsvGenerator,
        },
        {
          provide: ReportBuilderService,
          useValue: mockReportBuilder,
        },
        {
          provide: DeliveryReportTemplate,
          useValue: mockDeliveryTemplate,
        },
        {
          provide: RouteReportTemplate,
          useValue: mockRouteTemplate,
        },
        {
          provide: IncidentReportTemplate,
          useValue: mockIncidentTemplate,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);

    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a report", () => {
      const createDto = { name: "Test Report", type: "delivery" };
      const result = service.create(createDto as never);

      expect(result).toEqual({
        id: 1,
        message: "Report created successfully",
      });
    });
  });

  describe("findAll", () => {
    it("should return all reports", () => {
      const result = service.findAll();

      expect(result).toEqual({ reports: [] });
    });
  });

  describe("findOne", () => {
    it("should return a report by id", () => {
      const result = service.findOne(1);

      expect(result).toEqual({ id: 1, data: {} });
    });

    it("should throw NotFoundException for invalid id", () => {
      expect(() => service.findOne(0)).toThrow(NotFoundException);
      expect(() => service.findOne(-1)).toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should update a report", () => {
      const updateDto = { name: "Updated Report" };
      const result = service.update(1, updateDto as never);

      expect(result).toEqual({
        id: 1,
        message: "Report updated successfully",
      });
    });

    it("should throw NotFoundException for invalid id", () => {
      expect(() => service.update(0, {} as never)).toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should remove a report", () => {
      const result = service.remove(1);

      expect(result).toEqual({
        id: 1,
        message: "Report removed successfully",
      });
    });

    it("should throw NotFoundException for invalid id", () => {
      expect(() => service.remove(0)).toThrow(NotFoundException);
    });
  });

  describe("generateReport", () => {
    const mockReportData: ReportData<Record<string, unknown>> = {
      title: "Test Report",
      columns: [{ header: "Name", key: "name" }],
      rows: [{ name: "Test" }],
    };

    const mockGeneratedReport = {
      buffer: Buffer.from("test"),
      filename: "test.pdf",
      mimeType: "application/pdf",
      size: 100,
      generatedAt: new Date(),
    };

    it("should generate PDF report", async () => {
      mockPdfGenerator.generate.mockResolvedValue(mockGeneratedReport);

      const result = await service.generateReport(mockReportData, ReportOutputType.PDF);

      expect(mockPdfGenerator.generate).toHaveBeenCalledWith(mockReportData, undefined);
      expect(result).toEqual(mockGeneratedReport);
    });

    it("should generate Excel report", async () => {
      mockExcelGenerator.generate.mockResolvedValue({
        ...mockGeneratedReport,
        filename: "test.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const result = await service.generateReport(mockReportData, ReportOutputType.EXCEL);

      expect(mockExcelGenerator.generate).toHaveBeenCalledWith(mockReportData, undefined);
      expect(result.filename).toBe("test.xlsx");
    });

    it("should generate CSV report", async () => {
      mockCsvGenerator.generate.mockResolvedValue({
        ...mockGeneratedReport,
        filename: "test.csv",
        mimeType: "text/csv",
      });

      const result = await service.generateReport(mockReportData, ReportOutputType.CSV);

      expect(mockCsvGenerator.generate).toHaveBeenCalledWith(mockReportData, undefined);
      expect(result.filename).toBe("test.csv");
    });

    it("should throw error for unsupported output type", async () => {
      await expect(service.generateReport(mockReportData, "unsupported" as never)).rejects.toThrow(
        "Unsupported output type: unsupported",
      );
    });

    it("should pass options to generator", async () => {
      const options = { header: { title: "Custom" } };
      mockPdfGenerator.generate.mockResolvedValue(mockGeneratedReport);

      await service.generateReport(mockReportData, ReportOutputType.PDF, options);

      expect(mockPdfGenerator.generate).toHaveBeenCalledWith(mockReportData, options);
    });
  });

  describe("generateDeliveryReport", () => {
    const mockDeliveries = [{ id: 1, name: "Delivery 1" }];
    const mockReportData: ReportData<never> = {
      title: "Delivery Report",
      columns: [],
      rows: mockDeliveries as never,
    };

    const mockGeneratedReport = {
      buffer: Buffer.from("test"),
      filename: "delivery_report.pdf",
      mimeType: "application/pdf",
      size: 100,
      generatedAt: new Date(),
    };

    it("should generate delivery report with PDF", async () => {
      mockDeliveryTemplate.createReport.mockReturnValue(mockReportData);
      mockPdfGenerator.generate.mockResolvedValue(mockGeneratedReport);

      const result = await service.generateDeliveryReport(mockDeliveries, ReportOutputType.PDF);

      expect(mockDeliveryTemplate.createReport).toHaveBeenCalledWith(mockDeliveries, undefined);
      expect(result).toEqual(mockGeneratedReport);
    });

    it("should use custom title", async () => {
      mockDeliveryTemplate.createReport.mockReturnValue(mockReportData);
      mockPdfGenerator.generate.mockResolvedValue(mockGeneratedReport);

      const customTitle = "Custom Delivery Report";
      await service.generateDeliveryReport(mockDeliveries, ReportOutputType.PDF, customTitle);

      expect(mockDeliveryTemplate.createReport).toHaveBeenCalledWith(mockDeliveries, customTitle);
    });
  });

  describe("generateRouteReport", () => {
    const mockRoutes = [{ id: 1, name: "Route 1" }];
    const mockReportData: ReportData<never> = {
      title: "Route Report",
      columns: [],
      rows: mockRoutes as never,
    };

    const mockGeneratedReport = {
      buffer: Buffer.from("test"),
      filename: "route_report.pdf",
      mimeType: "application/pdf",
      size: 100,
      generatedAt: new Date(),
    };

    it("should generate route report", async () => {
      mockRouteTemplate.createReport.mockReturnValue(mockReportData);
      mockPdfGenerator.generate.mockResolvedValue(mockGeneratedReport);

      const result = await service.generateRouteReport(mockRoutes, ReportOutputType.PDF);

      expect(mockRouteTemplate.createReport).toHaveBeenCalledWith(mockRoutes, undefined);
      expect(result).toEqual(mockGeneratedReport);
    });
  });

  describe("generateIncidentReport", () => {
    const mockIncidents = [{ id: 1, name: "Incident 1" }];
    const mockReportData: ReportData<never> = {
      title: "Incident Report",
      columns: [],
      rows: mockIncidents as never,
    };

    const mockGeneratedReport = {
      buffer: Buffer.from("test"),
      filename: "incident_report.pdf",
      mimeType: "application/pdf",
      size: 100,
      generatedAt: new Date(),
    };

    it("should generate incident report", async () => {
      mockIncidentTemplate.createReport.mockReturnValue(mockReportData);
      mockPdfGenerator.generate.mockResolvedValue(mockGeneratedReport);

      const result = await service.generateIncidentReport(mockIncidents, ReportOutputType.PDF);

      expect(mockIncidentTemplate.createReport).toHaveBeenCalledWith(mockIncidents, undefined);
      expect(result).toEqual(mockGeneratedReport);
    });
  });

  describe("buildAndGenerate", () => {
    const mockData = [{ name: "Test", value: 100 }];
    const mockColumns = [{ header: "Name", key: "name" }];
    const mockBuiltReport: ReportData<never> = {
      title: "Built Report",
      columns: mockColumns,
      rows: mockData as never,
    };

    const mockGeneratedReport = {
      buffer: Buffer.from("test"),
      filename: "built_report.pdf",
      mimeType: "application/pdf",
      size: 100,
      generatedAt: new Date(),
    };

    it("should build and generate report", async () => {
      mockReportBuilder.buildReport.mockReturnValue(mockBuiltReport);
      mockPdfGenerator.generate.mockResolvedValue(mockGeneratedReport);

      const result = await service.buildAndGenerate(
        mockData,
        mockColumns,
        ReportOutputType.PDF,
        {},
        "Custom Title",
      );

      expect(mockReportBuilder.buildReport).toHaveBeenCalledWith(mockData, mockColumns, {});
      expect(mockPdfGenerator.generate).toHaveBeenCalled();
      expect(result).toEqual(mockGeneratedReport);
    });

    it("should apply custom title to report", async () => {
      mockReportBuilder.buildReport.mockReturnValue(mockBuiltReport);
      mockPdfGenerator.generate.mockResolvedValue(mockGeneratedReport);

      await service.buildAndGenerate(
        mockData,
        mockColumns,
        ReportOutputType.PDF,
        {},
        "My Custom Report",
      );

      expect(mockBuiltReport.title).toBe("My Custom Report");
    });

    it("should pass options to report builder", async () => {
      const options = {
        limit: 10,
        filters: [{ field: "value", operator: "gt" as const, value: 50 }],
      };

      mockReportBuilder.buildReport.mockReturnValue(mockBuiltReport);
      mockPdfGenerator.generate.mockResolvedValue(mockGeneratedReport);

      await service.buildAndGenerate(mockData, mockColumns, ReportOutputType.PDF, options);

      expect(mockReportBuilder.buildReport).toHaveBeenCalledWith(mockData, mockColumns, options);
    });
  });
});
