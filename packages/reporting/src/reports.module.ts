import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";
import { Report } from "./entities/report.entity";
import { PdfGeneratorService } from "./services/pdf-generator.service";
import { ExcelGeneratorService } from "./services/excel-generator.service";
import { CsvGeneratorService } from "./services/csv-generator.service";
import { ReportBuilderService } from "./services/report-builder.service";
import { DeliveryReportTemplate } from "./templates/delivery-report.template";
import { RouteReportTemplate } from "./templates/route-report.template";
import { IncidentReportTemplate } from "./templates/incident-report.template";

@Module({
  imports: [TypeOrmModule.forFeature([Report])],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    PdfGeneratorService,
    ExcelGeneratorService,
    CsvGeneratorService,
    ReportBuilderService,
    DeliveryReportTemplate,
    RouteReportTemplate,
    IncidentReportTemplate,
  ],
  exports: [
    ReportsService,
    PdfGeneratorService,
    ExcelGeneratorService,
    CsvGeneratorService,
    ReportBuilderService,
    TypeOrmModule,
  ],
})
export class ReportingModule {}
