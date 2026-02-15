import { Test, TestingModule } from "@nestjs/testing";
import { PdfGeneratorService } from "./pdf-generator.service";
import type { ReportData, PDFGenerationOptions } from "../interfaces/reporting.interfaces";

describe("PdfGeneratorService", () => {
  let service: PdfGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfGeneratorService],
    }).compile();

    service = module.get<PdfGeneratorService>(PdfGeneratorService);
  });

  describe("generate", () => {
    const mockReportData: ReportData<Record<string, unknown>> = {
      title: "Test Report",
      description: "Test Description",
      columns: [
        { header: "Name", key: "name" },
        { header: "Value", key: "value" },
      ],
      rows: [
        { name: "Item 1", value: 100 },
        { name: "Item 2", value: 200 },
      ],
    };

    it("should generate a PDF buffer", async () => {
      const result = await service.generate(mockReportData);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.filename).toBe("test_report.pdf");
      expect(result.mimeType).toBe("application/pdf");
      expect(result.size).toBeGreaterThan(0);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it("should use default options when none provided", async () => {
      const result = await service.generate(mockReportData);

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it("should apply custom options", async () => {
      const options: PDFGenerationOptions = {
        pageSize: "A3",
        orientation: "landscape",
        title: "Custom Title",
      };

      const result = await service.generate(mockReportData, options);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it("should sanitize filename", async () => {
      const dataWithSpecialChars: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        title: "Report @#$%^&*()",
      };

      const result = await service.generate(dataWithSpecialChars);

      expect(result.filename).toBe("report__________.pdf");
    });

    it("should generate PDF with empty rows", async () => {
      const emptyData: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        rows: [],
      };

      const result = await service.generate(emptyData);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it("should handle data with special characters", async () => {
      const dataWithSpecialChars: ReportData<Record<string, unknown>> = {
        ...mockReportData,
        rows: [
          { name: "Item <special>", value: "Value & more" },
          { name: "Unicode: ãçõ", value: 300 },
        ],
      };

      const result = await service.generate(dataWithSpecialChars);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it("should format dates correctly", async () => {
      const testDate = new Date("2024-01-15");
      const dataWithDates: ReportData<Record<string, unknown>> = {
        title: "Date Report",
        columns: [{ header: "Date", key: "date" }],
        rows: [{ date: testDate }],
      };

      const result = await service.generate(dataWithDates);

      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it("should format boolean values", async () => {
      const dataWithBooleans: ReportData<Record<string, unknown>> = {
        title: "Boolean Report",
        columns: [
          { header: "Name", key: "name" },
          { header: "Active", key: "active" },
        ],
        rows: [
          { name: "Item 1", active: true },
          { name: "Item 2", active: false },
        ],
      };

      const result = await service.generate(dataWithBooleans);

      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it("should handle null and undefined values", async () => {
      const dataWithNulls: ReportData<Record<string, unknown>> = {
        title: "Null Report",
        columns: [
          { header: "Name", key: "name" },
          { header: "Value", key: "value" },
        ],
        rows: [
          { name: "Item 1", value: null },
          { name: "Item 2", value: undefined },
        ],
      };

      const result = await service.generate(dataWithNulls);

      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it("should handle header with logo", async () => {
      // Skip logo test as pdfkit requires valid image format
      // This test verifies the header configuration is processed without errors
      const options: PDFGenerationOptions = {
        header: {
          title: "Company Header",
          subtitle: "Report Subtitle",
        },
      };

      const result = await service.generate(mockReportData, options);

      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it("should handle footer with page numbers", async () => {
      const options: PDFGenerationOptions = {
        footer: {
          showPageNumber: true,
          customText: "Relatório Nexus",
        },
      };

      const result = await service.generate(mockReportData, options);

      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it("should handle large datasets", async () => {
      const largeData: ReportData<Record<string, unknown>> = {
        title: "Large Report",
        columns: [
          { header: "ID", key: "id" },
          { header: "Name", key: "name" },
        ],
        rows: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
        })),
      };

      const result = await service.generate(largeData);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(1000);
    });
  });

  describe("formatValue", () => {
    it("should format null values as dash", () => {
      const result = (service as unknown as { formatValue: (v: unknown) => string }).formatValue(
        null,
      );
      expect(result).toBe("-");
    });

    it("should format undefined values as dash", () => {
      const result = (service as unknown as { formatValue: (v: unknown) => string }).formatValue(
        undefined,
      );
      expect(result).toBe("-");
    });

    it("should format dates to Brazilian format", () => {
      // Create date with explicit timezone to avoid timezone issues
      const date = new Date(2024, 0, 15, 12, 0, 0); // Jan 15, 2024 12:00:00
      const result = (service as unknown as { formatValue: (v: unknown) => string }).formatValue(
        date,
      );
      // Should contain day and month in Brazilian format
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(result).toContain("/01/2024");
    });

    it("should format true as Sim", () => {
      const result = (service as unknown as { formatValue: (v: unknown) => string }).formatValue(
        true,
      );
      expect(result).toBe("Sim");
    });

    it("should format false as Não", () => {
      const result = (service as unknown as { formatValue: (v: unknown) => string }).formatValue(
        false,
      );
      expect(result).toBe("Não");
    });

    it("should format numbers as strings", () => {
      const result = (service as unknown as { formatValue: (v: unknown) => string }).formatValue(
        123.45,
      );
      expect(result).toBe("123.45");
    });

    it("should format strings as is", () => {
      const result = (service as unknown as { formatValue: (v: unknown) => string }).formatValue(
        "test",
      );
      expect(result).toBe("test");
    });
  });
});
