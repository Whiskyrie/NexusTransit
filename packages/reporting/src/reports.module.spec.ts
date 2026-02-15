import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ReportingModule } from "./reports.module";
import { ReportsService } from "./reports.service";
import { PdfGeneratorService } from "./services/pdf-generator.service";
import { ExcelGeneratorService } from "./services/excel-generator.service";
import { CsvGeneratorService } from "./services/csv-generator.service";
import { ReportBuilderService } from "./services/report-builder.service";
import { DeliveryReportTemplate } from "./templates/delivery-report.template";
import { RouteReportTemplate } from "./templates/route-report.template";
import { IncidentReportTemplate } from "./templates/incident-report.template";
import { Report } from "./entities/report.entity";

describe("ReportingModule", () => {
  let module: TestingModule;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  const mockDataSource = {
    createEntityManager: jest.fn(),
    destroy: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ReportingModule],
    })
      .overrideProvider(getRepositoryToken(Report))
      .useValue(mockRepository)
      .overrideProvider(TypeOrmModule)
      .useValue({})
      .compile();
  }, 10000);

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it("should be defined", () => {
    expect(module).toBeDefined();
  });

  it("should provide ReportsService", () => {
    const service = module.get<ReportsService>(ReportsService);
    expect(service).toBeDefined();
  });

  it("should provide PdfGeneratorService", () => {
    const service = module.get<PdfGeneratorService>(PdfGeneratorService);
    expect(service).toBeDefined();
  });

  it("should provide ExcelGeneratorService", () => {
    const service = module.get<ExcelGeneratorService>(ExcelGeneratorService);
    expect(service).toBeDefined();
  });

  it("should provide CsvGeneratorService", () => {
    const service = module.get<CsvGeneratorService>(CsvGeneratorService);
    expect(service).toBeDefined();
  });

  it("should provide ReportBuilderService", () => {
    const service = module.get<ReportBuilderService>(ReportBuilderService);
    expect(service).toBeDefined();
  });

  it("should provide DeliveryReportTemplate", () => {
    const template = module.get<DeliveryReportTemplate>(DeliveryReportTemplate);
    expect(template).toBeDefined();
  });

  it("should provide RouteReportTemplate", () => {
    const template = module.get<RouteReportTemplate>(RouteReportTemplate);
    expect(template).toBeDefined();
  });

  it("should provide IncidentReportTemplate", () => {
    const template = module.get<IncidentReportTemplate>(IncidentReportTemplate);
    expect(template).toBeDefined();
  });

  describe("exports", () => {
    it("should export ReportsService", () => {
      const exportedService = module.get(ReportsService);
      expect(exportedService).toBeInstanceOf(ReportsService);
    });

    it("should export generator services", () => {
      expect(module.get(PdfGeneratorService)).toBeInstanceOf(PdfGeneratorService);
      expect(module.get(ExcelGeneratorService)).toBeInstanceOf(ExcelGeneratorService);
      expect(module.get(CsvGeneratorService)).toBeInstanceOf(CsvGeneratorService);
      expect(module.get(ReportBuilderService)).toBeInstanceOf(ReportBuilderService);
    });
  });
});
