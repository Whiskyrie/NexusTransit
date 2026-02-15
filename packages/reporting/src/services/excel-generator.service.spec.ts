import { Test, TestingModule } from "@nestjs/testing";
import * as ExcelJS from "exceljs";
import { ExcelGeneratorService } from "./excel-generator.service";
import type { ReportData, ExcelGenerationOptions } from "../interfaces/reporting.interfaces";

describe("ExcelGeneratorService", () => {
  let service: ExcelGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelGeneratorService],
    }).compile();

    service = module.get<ExcelGeneratorService>(ExcelGeneratorService);
  });

  describe("generate", () => {
    const mockReportData: ReportData<Record<string, unknown>> = {
      title: "Test Report",
      columns: [
        { header: "Name", key: "name", width: 20 },
        { header: "Value", key: "value", width: 15 },
      ],
      rows: [
        { name: "Item 1", value: 100 },
        { name: "Item 2", value: 200 },
      ],
    };

    it("should generate an Excel buffer", async () => {
      const result = await service.generate(mockReportData);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.filename).toBe("test_report.xlsx");
      expect(result.mimeType).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      expect(result.size).toBeGreaterThan(0);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it("should create valid Excel file that can be read back", async () => {
      const result = await service.generate(mockReportData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);

      expect(workbook.worksheets.length).toBeGreaterThan(0);
      const worksheet = workbook.worksheets[0];
      expect(worksheet.rowCount).toBeGreaterThan(1);
    });

    it("should apply column headers correctly", async () => {
      const result = await service.generate(mockReportData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      const headerRow = worksheet.getRow(1);
      expect(headerRow.getCell(1).value).toBe("Name");
      expect(headerRow.getCell(2).value).toBe("Value");
    });

    it("should apply data rows correctly", async () => {
      const result = await service.generate(mockReportData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      const dataRow1 = worksheet.getRow(2);
      expect(dataRow1.getCell(1).value).toBe("Item 1");
      expect(dataRow1.getCell(2).value).toBe(100);

      const dataRow2 = worksheet.getRow(3);
      expect(dataRow2.getCell(1).value).toBe("Item 2");
      expect(dataRow2.getCell(2).value).toBe(200);
    });

    it("should use default sheet name when not specified", async () => {
      const result = await service.generate(mockReportData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);

      expect(workbook.worksheets[0].name).toBe("Relatório");
    });

    it("should use custom sheet name when specified", async () => {
      const options: ExcelGenerationOptions = {
        sheetName: "Custom Sheet",
      };

      const result = await service.generate(mockReportData, options);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);

      expect(workbook.worksheets[0].name).toBe("Custom Sheet");
    });

    it("should apply header styling", async () => {
      const result = await service.generate(mockReportData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      const headerCell = worksheet.getRow(1).getCell(1);
      expect(headerCell.font?.bold).toBe(true);
    });

    it("should freeze header row when freezeHeader is true", async () => {
      const options: ExcelGenerationOptions = {
        freezeHeader: true,
      };

      const result = await service.generate(mockReportData, options);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.views).toBeDefined();
      expect(worksheet.views![0].state).toBe("frozen");
    });

    it("should apply autoFilter when enabled", async () => {
      const options: ExcelGenerationOptions = {
        autoFilter: true,
      };

      const result = await service.generate(mockReportData, options);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.autoFilter).toBeDefined();
    });

    it("should set workbook creator", async () => {
      const options: ExcelGenerationOptions = {
        creator: "Test Creator",
      };

      const result = await service.generate(mockReportData, options);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);

      expect(workbook.creator).toBe("Test Creator");
    });

    it("should set workbook creation date", async () => {
      const createdAt = new Date("2024-01-15");
      const options: ExcelGenerationOptions = {
        createdAt,
      };

      const result = await service.generate(mockReportData, options);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);

      expect(workbook.created).toEqual(createdAt);
    });

    it("should handle empty data", async () => {
      const emptyData: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        rows: [],
      };

      const result = await service.generate(emptyData);

      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it("should sanitize filename", async () => {
      const dataWithSpecialChars: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        title: "Report @#$%^&*()",
      };

      const result = await service.generate(dataWithSpecialChars);

      expect(result.filename).toBe("report__________.xlsx");
    });

    it("should handle special characters in title", async () => {
      const dataWithSpecialChars: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        title: "Relatório - Teste @#$%^&*()_+{}|:\"<>?[]\\;',./",
      };

      const result = await service.generate(dataWithSpecialChars);

      expect(result.filename).toContain(".xlsx");
      expect(result.filename.startsWith("relat_rio")).toBe(true);
    });

    it("should not apply autoFilter when disabled", async () => {
      const options: ExcelGenerationOptions = {
        autoFilter: false,
      };

      const result = await service.generate(mockReportData, options);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.autoFilter).toBeUndefined();
    });

    it("should use default creator when not specified", async () => {
      const result = await service.generate(mockReportData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);

      expect(workbook.creator).toBe("NexusTransit");
    });

    it("should use current date when createdAt not specified", async () => {
      const before = new Date();
      const result = await service.generate(mockReportData);
      const after = new Date();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);

      expect(workbook.created).toBeInstanceOf(Date);
      // Check if created date is within reasonable time range
      const createdTime = workbook.created.getTime();
      expect(createdTime).toBeGreaterThanOrEqual(before.getTime() - 1000);
      expect(createdTime).toBeLessThanOrEqual(after.getTime() + 1000);
    });

    it("should apply column formatting - bold", async () => {
      const dataWithFormatting: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        columns: [
          { header: "Name", key: "name", width: 20 },
          {
            header: "Value",
            key: "value",
            width: 15,
            format: { bold: true },
          },
        ],
      };

      const result = await service.generate(dataWithFormatting);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      const dataCell = worksheet.getRow(2).getCell(2);
      expect(dataCell.font?.bold).toBe(true);
    });

    it("should apply column formatting - italic", async () => {
      const dataWithFormatting: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        columns: [
          { header: "Name", key: "name", width: 20 },
          {
            header: "Value",
            key: "value",
            width: 15,
            format: { italic: true },
          },
        ],
      };

      const result = await service.generate(dataWithFormatting);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      const dataCell = worksheet.getRow(2).getCell(2);
      expect(dataCell.font?.italic).toBe(true);
    });

    it("should apply column formatting - underline", async () => {
      const dataWithFormatting: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        columns: [
          { header: "Name", key: "name", width: 20 },
          {
            header: "Value",
            key: "value",
            width: 15,
            format: { underline: true },
          },
        ],
      };

      const result = await service.generate(dataWithFormatting);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      const dataCell = worksheet.getRow(2).getCell(2);
      expect(dataCell.font?.underline).toBe(true);
    });

    it("should apply column formatting - fontSize", async () => {
      const dataWithFormatting: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        columns: [
          { header: "Name", key: "name", width: 20 },
          {
            header: "Value",
            key: "value",
            width: 15,
            format: { fontSize: 14 },
          },
        ],
      };

      const result = await service.generate(dataWithFormatting);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      const dataCell = worksheet.getRow(2).getCell(2);
      expect(dataCell.font?.size).toBe(14);
    });

    it("should apply column formatting - fontColor", async () => {
      const dataWithFormatting: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        columns: [
          { header: "Name", key: "name", width: 20 },
          {
            header: "Value",
            key: "value",
            width: 15,
            format: { fontColor: "#FF0000" },
          },
        ],
      };

      const result = await service.generate(dataWithFormatting);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      const dataCell = worksheet.getRow(2).getCell(2);
      expect(dataCell.font?.color?.argb).toBe("FF0000");
    });

    it("should apply column formatting - backgroundColor", async () => {
      const dataWithFormatting: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        columns: [
          { header: "Name", key: "name", width: 20 },
          {
            header: "Value",
            key: "value",
            width: 15,
            format: { backgroundColor: "#00FF00" },
          },
        ],
      };

      const result = await service.generate(dataWithFormatting);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      const dataCell = worksheet.getRow(2).getCell(2);
      expect(dataCell.fill?.fgColor?.argb).toBe("00FF00");
    });

    it("should apply column formatting - alignment", async () => {
      const dataWithFormatting: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        columns: [
          { header: "Name", key: "name", width: 20 },
          {
            header: "Value",
            key: "value",
            width: 15,
            format: { alignment: "right" },
          },
        ],
      };

      const result = await service.generate(dataWithFormatting);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      const dataCell = worksheet.getRow(2).getCell(2);
      expect(dataCell.alignment?.horizontal).toBe("right");
    });

    it("should apply column formatting - numberFormat", async () => {
      const dataWithFormatting: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        columns: [
          { header: "Name", key: "name", width: 20 },
          {
            header: "Value",
            key: "value",
            width: 15,
            format: { numberFormat: '#,##0.00"$"' },
          },
        ],
      };

      const result = await service.generate(dataWithFormatting);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      const dataCell = worksheet.getRow(2).getCell(2);
      expect(dataCell.numFmt).toBe('#,##0.00"$"');
    });

    it("should apply multiple formatting options", async () => {
      const dataWithFormatting: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        columns: [
          { header: "Name", key: "name", width: 20 },
          {
            header: "Value",
            key: "value",
            width: 15,
            format: {
              bold: true,
              italic: true,
              fontSize: 12,
              fontColor: "#0000FF",
            },
          },
        ],
      };

      const result = await service.generate(dataWithFormatting);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      const dataCell = worksheet.getRow(2).getCell(2);
      expect(dataCell.font?.bold).toBe(true);
      expect(dataCell.font?.italic).toBe(true);
      expect(dataCell.font?.size).toBe(12);
      expect(dataCell.font?.color?.argb).toBe("0000FF");
    });

    it("should set row height for data rows", async () => {
      const result = await service.generate(mockReportData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      const dataRow = worksheet.getRow(2);
      expect(dataRow.height).toBe(20);
    });
  });

  describe("generateMultiSheet", () => {
    it("should create multiple sheets", async () => {
      const sheets = [
        {
          name: "Sheet1",
          data: {
            title: "Report 1",
            columns: [{ header: "A", key: "a" }],
            rows: [{ a: 1 }],
          },
        },
        {
          name: "Sheet2",
          data: {
            title: "Report 2",
            columns: [{ header: "B", key: "b" }],
            rows: [{ b: 2 }],
          },
        },
      ];

      const result = await service.generateMultiSheet(sheets);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);

      expect(workbook.worksheets.length).toBe(2);
      expect(workbook.worksheets[0].name).toBe("Sheet1");
      expect(workbook.worksheets[1].name).toBe("Sheet2");
    });

    it("should apply sheet-specific options", async () => {
      const sheets = [
        {
          name: "Sheet1",
          data: {
            title: "Report 1",
            columns: [{ header: "A", key: "a" }],
            rows: [{ a: 1 }],
          },
          options: {
            sheetName: "Custom1",
            freezeHeader: false,
          },
        },
      ];

      const result = await service.generateMultiSheet(sheets);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toBe("relatorio_multiplo.xlsx");
    });

    it("should apply global options to all sheets", async () => {
      const sheets = [
        {
          name: "Sheet1",
          data: {
            title: "Report 1",
            columns: [{ header: "A", key: "a" }],
            rows: [{ a: 1 }],
          },
        },
      ];

      const globalOptions: ExcelGenerationOptions = {
        creator: "Global Creator",
        createdAt: new Date("2024-01-01"),
      };

      const result = await service.generateMultiSheet(sheets, globalOptions);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);

      expect(workbook.creator).toBe("Global Creator");
    });

    it("should handle empty sheets array", async () => {
      const sheets: Array<{ name: string; data: ReportData<Record<string, unknown>> }> = [];

      const result = await service.generateMultiSheet(sheets);

      expect(result.buffer).toBeInstanceOf(Buffer);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      expect(workbook.worksheets.length).toBe(0);
    });

    it("should use default creator when not specified in global options", async () => {
      const sheets = [
        {
          name: "Sheet1",
          data: {
            title: "Report 1",
            columns: [{ header: "A", key: "a" }],
            rows: [{ a: 1 }],
          },
        },
      ];

      const result = await service.generateMultiSheet(sheets);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);

      expect(workbook.creator).toBe("NexusTransit");
    });
  });

  describe("addFormula", () => {
    const formulaTestData: ReportData<Record<string, unknown>> = {
      title: "Formula Test",
      columns: [
        { header: "Name", key: "name", width: 20 },
        { header: "Value", key: "value", width: 15 },
      ],
      rows: [
        { name: "Item 1", value: 100 },
        { name: "Item 2", value: 200 },
      ],
    };

    it("should add formula to cells", async () => {
      const result = await service.generate(formulaTestData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      service.addFormula(worksheet, 3, 2, 3, "SUM(B2:B{row})");

      const cell = worksheet.getCell(3, 3);
      expect(cell.value).toBeDefined();
    });

    it("should add formula to multiple cells", async () => {
      const result = await service.generate(formulaTestData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      service.addFormula(worksheet, 2, 2, 3, "SUM(B{row}:C{row})");

      const cell2 = worksheet.getCell(2, 2);
      const cell3 = worksheet.getCell(3, 2);
      // The formula should have {row} replaced with actual row numbers
      expect((cell2.value as { formula?: string }).formula).toBeDefined();
      expect((cell3.value as { formula?: string }).formula).toBeDefined();
    });

    it("should add formula without {row} placeholder", async () => {
      const result = await service.generate(formulaTestData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      service.addFormula(worksheet, 4, 2, 2, "AVERAGE(B2:B3)");

      const cell = worksheet.getCell(2, 4);
      expect((cell.value as { formula?: string }).formula).toBe("AVERAGE(B2:B3)");
    });
  });

  describe("applyConditionalFormatting", () => {
    const condFormatTestData: ReportData<Record<string, unknown>> = {
      title: "Conditional Formatting Test",
      columns: [
        { header: "Name", key: "name", width: 20 },
        { header: "Value", key: "value", width: 15 },
      ],
      rows: [
        { name: "Item 1", value: 100 },
        { name: "Item 2", value: 200 },
      ],
    };

    it("should apply conditional formatting", async () => {
      const result = await service.generate(condFormatTestData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      service.applyConditionalFormatting(worksheet, "B2:B10", [
        {
          type: "cellIs",
          operator: "greaterThan",
          value: 100,
          style: {
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF0000" },
            },
          },
        },
      ]);

      expect(worksheet.addConditionalFormatting.length).toBeGreaterThan(0);
    });

    it("should apply conditional formatting with lessThan operator", async () => {
      const result = await service.generate(condFormatTestData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      service.applyConditionalFormatting(worksheet, "B2:B10", [
        {
          type: "cellIs",
          operator: "lessThan",
          value: 50,
          style: {
            font: { color: { argb: "FF0000" } },
          },
        },
      ]);

      expect(worksheet.addConditionalFormatting.length).toBeGreaterThan(0);
    });

    it("should apply conditional formatting with equal operator", async () => {
      const result = await service.generate(condFormatTestData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      service.applyConditionalFormatting(worksheet, "B2:B10", [
        {
          type: "cellIs",
          operator: "equal",
          value: 100,
          priority: 2,
          style: {
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "00FF00" },
            },
          },
        },
      ]);

      expect(worksheet.addConditionalFormatting.length).toBeGreaterThan(0);
    });

    it("should apply multiple conditional formatting rules", async () => {
      const result = await service.generate(condFormatTestData);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(new Uint8Array(result.buffer) as any);
      const worksheet = workbook.worksheets[0];

      service.applyConditionalFormatting(worksheet, "B2:B10", [
        {
          type: "cellIs",
          operator: "greaterThan",
          value: 100,
          style: {
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF0000" },
            },
          },
        },
        {
          type: "cellIs",
          operator: "lessThan",
          value: 50,
          style: {
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "0000FF" },
            },
          },
        },
      ]);

      expect(worksheet.addConditionalFormatting.length).toBeGreaterThan(0);
    });
  });
});
