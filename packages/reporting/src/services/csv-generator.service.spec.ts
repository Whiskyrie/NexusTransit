import { Test, TestingModule } from "@nestjs/testing";
import { CsvGeneratorService } from "./csv-generator.service";
import type { ReportData, CSVGenerationOptions } from "../interfaces/reporting.interfaces";

describe("CsvGeneratorService", () => {
  let service: CsvGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvGeneratorService],
    }).compile();

    service = module.get<CsvGeneratorService>(CsvGeneratorService);
  });

  describe("generate", () => {
    const mockReportData: ReportData<Record<string, unknown>> = {
      title: "Test Report",
      columns: [
        { header: "Name", key: "name" },
        { header: "Value", key: "value" },
      ],
      rows: [
        { name: "Item 1", value: 100 },
        { name: "Item 2", value: 200 },
      ],
    };

    it("should generate a CSV buffer", async () => {
      const result = await service.generate(mockReportData);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.filename).toBe("test_report.csv");
      expect(result.mimeType).toBe("text/csv");
      expect(result.size).toBeGreaterThan(0);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it("should generate valid CSV content", async () => {
      const result = await service.generate(mockReportData);
      const csvContent = result.buffer.toString("utf-8");

      expect(csvContent).toContain('"Name"');
      expect(csvContent).toContain('"Value"');
      expect(csvContent).toContain('"Item 1"');
      expect(csvContent).toContain("100");
      expect(csvContent).toContain('"Item 2"');
      expect(csvContent).toContain("200");
    });

    it("should use comma as default delimiter", async () => {
      const result = await service.generate(mockReportData);
      const csvContent = result.buffer.toString("utf-8");

      expect(csvContent).toContain(",");
    });

    it("should use custom delimiter when specified", async () => {
      const options: CSVGenerationOptions = {
        delimiter: ";",
      };

      const result = await service.generate(mockReportData, options);
      const csvContent = result.buffer.toString("utf-8");

      expect(csvContent).toContain('";"');
    });

    it("should include header by default", async () => {
      const result = await service.generate(mockReportData);
      const csvContent = result.buffer.toString("utf-8");

      expect(csvContent).toContain('"Name"');
      expect(csvContent).toContain('"Value"');
    });

    it("should exclude header when includeHeader is false", async () => {
      const options: CSVGenerationOptions = {
        includeHeader: false,
      };

      const result = await service.generate(mockReportData, options);
      const csvContent = result.buffer.toString("utf-8");

      expect(csvContent).not.toContain('"Name"');
      expect(csvContent).toContain('"Item 1"');
      expect(csvContent).toContain("100");
    });

    it("should use UTF-8 encoding by default", async () => {
      const result = await service.generate(mockReportData);
      const csvContent = result.buffer.toString("utf-8");
      // json2csv quotes string values by default
      expect(csvContent).toContain('"Name"');
      expect(csvContent).toContain('"Value"');
    });

    it("should add BOM for UTF-8-BOM encoding", async () => {
      const options: CSVGenerationOptions = {
        encoding: "utf-8-bom",
      };

      const result = await service.generate(mockReportData, options);

      expect(result.buffer[0]).toBe(0xef);
      expect(result.buffer[1]).toBe(0xbb);
      expect(result.buffer[2]).toBe(0xbf);
    });

    it("should escape values containing commas", async () => {
      const dataWithCommas: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        rows: [{ name: "Item, with comma", value: 100 }],
      };

      const result = await service.generate(dataWithCommas);
      const csvContent = result.buffer.toString("utf-8");

      expect(csvContent).toContain('"Item, with comma"');
    });

    it("should escape values containing quotes", async () => {
      const dataWithQuotes: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        rows: [{ name: 'Item "quoted"', value: 100 }],
      };

      const result = await service.generate(dataWithQuotes);
      const csvContent = result.buffer.toString("utf-8");

      expect(csvContent).toContain('"Item ""quoted"""');
    });

    it("should handle empty data", async () => {
      const emptyData: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        rows: [],
      };

      const result = await service.generate(emptyData);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.toString("utf-8")).toContain('"Name"');
    });

    it("should handle null and undefined values", async () => {
      const dataWithNulls: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        rows: [
          { name: "Item 1", value: null },
          { name: "Item 2", value: undefined },
        ],
      };

      const result = await service.generate(dataWithNulls);
      const csvContent = result.buffer.toString("utf-8");

      expect(csvContent).toContain('"Item 1"');
      expect(csvContent).toContain('"Item 2"');
    });

    it("should sanitize filename", async () => {
      const dataWithSpecialChars: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        title: "Report @#$%^&*()",
      };

      const result = await service.generate(dataWithSpecialChars);

      expect(result.filename).toBe("report__________.csv");
    });

    it("should handle values with newlines", async () => {
      const dataWithNewlines: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        rows: [{ name: "Item\nwith\nnewlines", value: 100 }],
      };

      const result = await service.generate(dataWithNewlines);
      const csvContent = result.buffer.toString("utf-8");

      expect(csvContent).toContain('"Item\nwith\nnewlines"');
    });

    it("should handle latin1 encoding", async () => {
      const options: CSVGenerationOptions = {
        encoding: "latin1",
      };

      const dataWithAccents: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        rows: [{ name: "Relatório", value: 100 }],
      };

      const result = await service.generate(dataWithAccents, options);

      expect(result.buffer).toBeInstanceOf(Buffer);
    });
  });

  describe("generateWithCustomHeaders", () => {
    const mockReportData: ReportData<Record<string, unknown>> = {
      title: "Test Report",
      columns: [
        { header: "Name", key: "name" },
        { header: "Value", key: "value" },
      ],
      rows: [{ name: "Item 1", value: 100 }],
    };

    it("should use custom header mapping", async () => {
      const headerMapping = {
        name: "Nome Customizado",
        value: "Valor Customizado",
      };

      const result = await service.generateWithCustomHeaders(mockReportData, headerMapping);
      const csvContent = result.buffer.toString("utf-8");

      // json2csv quotes string values by default
      expect(csvContent).toContain('"Nome Customizado"');
      expect(csvContent).toContain('"Valor Customizado"');
    });
  });

  describe("generateWithTransform", () => {
    const mockReportData: ReportData<Record<string, unknown>> = {
      title: "Test Report",
      columns: [{ header: "Name", key: "name" }],
      rows: [{ name: "item 1", value: 100 }],
    };

    it("should apply transformation to rows", async () => {
      const transform = (row: Record<string, unknown>) => ({
        ...row,
        name: String(row.name).toUpperCase(),
      });

      const result = await service.generateWithTransform(mockReportData, transform);
      const csvContent = result.buffer.toString("utf-8");

      expect(csvContent).toContain("ITEM 1");
    });
  });

  describe("escapeValue", () => {
    it("should return empty string for null", () => {
      const result = service.escapeValue(null);
      expect(result).toBe("");
    });

    it("should return empty string for undefined", () => {
      const result = service.escapeValue(undefined);
      expect(result).toBe("");
    });

    it("should escape values containing commas", () => {
      const result = service.escapeValue("value, with comma");
      expect(result).toBe('"value, with comma"');
    });

    it("should escape values containing newlines", () => {
      const result = service.escapeValue("value\nwith newline");
      expect(result).toBe('"value\nwith newline"');
    });

    it("should escape values containing quotes", () => {
      const result = service.escapeValue('value "quoted"');
      expect(result).toBe('"value ""quoted"""');
    });

    it("should not escape simple values", () => {
      const result = service.escapeValue("simple value");
      expect(result).toBe("simple value");
    });
  });

  describe("validateCSV", () => {
    it("should validate correct CSV", () => {
      const csv = "Name,Value\nItem 1,100\nItem 2,200";
      const result = service.validateCSV(csv);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty CSV", () => {
      const csv = "";
      const result = service.validateCSV(csv);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("CSV vazio");
    });

    it("should detect inconsistent column counts", () => {
      const csv = "Name,Value\nItem 1,100\nItem 2";
      const result = service.validateCSV(csv);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("getDelimiterName", () => {
    it("should return 'Vírgula' for comma", () => {
      expect(service.getDelimiterName(",")).toBe("Vírgula");
    });

    it("should return 'Ponto e vírgula' for semicolon", () => {
      expect(service.getDelimiterName(";")).toBe("Ponto e vírgula");
    });

    it("should return 'Tab' for tab", () => {
      expect(service.getDelimiterName("\t")).toBe("Tab");
    });

    it("should return 'Pipe' for pipe", () => {
      expect(service.getDelimiterName("|")).toBe("Pipe");
    });

    it("should return 'Personalizado' for other delimiters", () => {
      expect(service.getDelimiterName("~")).toBe("Personalizado");
      expect(service.getDelimiterName(":")).toBe("Personalizado");
      expect(service.getDelimiterName("#")).toBe("Personalizado");
    });
  });

  describe("escapeValue with custom quote char", () => {
    it("should use single quote as quote char", () => {
      const result = service.escapeValue("value, with comma", "'");
      expect(result).toBe("'value, with comma'");
    });

    it("should escape custom quote char", () => {
      const result = service.escapeValue("value 'quoted'", "'");
      expect(result).toBe("'value ''quoted'''");
    });

    it("should handle custom quote char with special characters", () => {
      const result = service.escapeValue("value\nwith newline", "'");
      expect(result).toBe("'value\nwith newline'");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string value", () => {
      const result = service.escapeValue("");
      expect(result).toBe("");
    });

    it("should handle number value", () => {
      const result = service.escapeValue(123);
      expect(result).toBe("123");
    });

    it("should handle boolean value", () => {
      const result = service.escapeValue(true);
      expect(result).toBe("true");
    });

    it("should handle value with only special chars that need escaping", () => {
      const result = service.escapeValue('","');
      // Value contains quotes and commas, so it gets quoted and quotes are doubled
      expect(result).toBe('""","""');
    });

    it("should handle value with multiple commas", () => {
      const result = service.escapeValue("a,b,c,d,e");
      expect(result).toBe('"a,b,c,d,e"');
    });
  });
});
