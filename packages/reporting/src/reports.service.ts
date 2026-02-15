import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateReportDto } from "./dto/create-report.dto";
import { UpdateReportDto } from "./dto/update-report.dto";
import { PdfGeneratorService } from "./services/pdf-generator.service";
import { ExcelGeneratorService } from "./services/excel-generator.service";
import { CsvGeneratorService } from "./services/csv-generator.service";
import { ReportBuilderService } from "./services/report-builder.service";
import { DeliveryReportTemplate } from "./templates/delivery-report.template";
import { RouteReportTemplate } from "./templates/route-report.template";
import { IncidentReportTemplate } from "./templates/incident-report.template";
import type {
  ReportData,
  ReportOutputType,
  GeneratedReport,
  ReportBuilderOptions,
} from "./interfaces/reporting.interfaces";

@Injectable()
export class ReportsService {
  constructor(
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly excelGenerator: ExcelGeneratorService,
    private readonly csvGenerator: CsvGeneratorService,
    private readonly reportBuilder: ReportBuilderService,
    private readonly deliveryTemplate: DeliveryReportTemplate,
    private readonly routeTemplate: RouteReportTemplate,
    private readonly incidentTemplate: IncidentReportTemplate,
  ) {}

  create(_createReportDto: CreateReportDto) {
    return { id: 1, message: "Report created successfully" };
  }

  findAll() {
    return { reports: [] };
  }

  findOne(id: number) {
    if (id <= 0) {
      throw new NotFoundException(`Report #${id} not found`);
    }
    return { id, data: {} };
  }

  update(id: number, _updateReportDto: UpdateReportDto) {
    if (id <= 0) {
      throw new NotFoundException(`Report #${id} not found`);
    }
    return { id, message: "Report updated successfully" };
  }

  remove(id: number) {
    if (id <= 0) {
      throw new NotFoundException(`Report #${id} not found`);
    }
    return { id, message: "Report removed successfully" };
  }

  /**
   * Gera um relatório no formato especificado
   */
  async generateReport<T>(
    data: ReportData<T>,
    outputType: ReportOutputType,
    options?: Record<string, unknown>,
  ): Promise<GeneratedReport> {
    switch (outputType) {
      case "pdf":
        return this.pdfGenerator.generate(data, options);
      case "excel":
        return this.excelGenerator.generate(data, options);
      case "csv":
        return this.csvGenerator.generate(data, options);
      default:
        throw new Error(`Unsupported output type: ${outputType}`);
    }
  }

  /**
   * Gera relatório de entregas
   */
  async generateDeliveryReport(
    deliveries: unknown[],
    outputType: ReportOutputType,
    title?: string,
  ): Promise<GeneratedReport> {
    const reportData = this.deliveryTemplate.createReport(deliveries as never, title);
    return this.generateReport(reportData, outputType);
  }

  /**
   * Gera relatório de rotas
   */
  async generateRouteReport(
    routes: unknown[],
    outputType: ReportOutputType,
    title?: string,
  ): Promise<GeneratedReport> {
    const reportData = this.routeTemplate.createReport(routes as never, title);
    return this.generateReport(reportData, outputType);
  }

  /**
   * Gera relatório de incidentes
   */
  async generateIncidentReport(
    incidents: unknown[],
    outputType: ReportOutputType,
    title?: string,
  ): Promise<GeneratedReport> {
    const reportData = this.incidentTemplate.createReport(incidents as never, title);
    return this.generateReport(reportData, outputType);
  }

  /**
   * Constrói e gera um relatório a partir de dados brutos
   */
  async buildAndGenerate<T extends Record<string, unknown>>(
    data: T[],
    columns: ReportData<T>["columns"],
    outputType: ReportOutputType,
    options: ReportBuilderOptions = {},
    title = "Relatório",
  ): Promise<GeneratedReport> {
    const reportData = this.reportBuilder.buildReport(data, columns, options);
    reportData.title = title;
    return this.generateReport(reportData, outputType);
  }
}
