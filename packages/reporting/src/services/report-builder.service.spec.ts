import { Test, TestingModule } from "@nestjs/testing";
import { ReportBuilderService } from "./report-builder.service";
import type {
  ReportColumn,
  ReportFilter,
  ReportSort,
  ReportBuilderOptions,
} from "../interfaces/reporting.interfaces";

describe("ReportBuilderService", () => {
  let service: ReportBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportBuilderService],
    }).compile();

    service = module.get<ReportBuilderService>(ReportBuilderService);
  });

  const mockColumns: ReportColumn[] = [
    { header: "Name", key: "name" },
    { header: "Age", key: "age" },
    { header: "City", key: "city" },
  ];

  const mockData = [
    { name: "John", age: 30, city: "New York" },
    { name: "Jane", age: 25, city: "Boston" },
    { name: "Bob", age: 35, city: "New York" },
    { name: "Alice", age: 28, city: "Chicago" },
  ];

  describe("buildReport", () => {
    it("should build report with all data", () => {
      const result = service.buildReport(mockData, mockColumns);

      expect(result.title).toBe("Relatório");
      expect(result.columns).toEqual(mockColumns);
      expect(result.rows).toHaveLength(4);
    });

    it("should apply filters correctly", () => {
      const options: ReportBuilderOptions = {
        filters: [{ field: "city", operator: "eq", value: "New York" }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(2);
      expect(result.rows.every((r: Record<string, unknown>) => r.city === "New York")).toBe(true);
    });

    it("should apply multiple filters with AND logic", () => {
      const options: ReportBuilderOptions = {
        filters: [
          { field: "city", operator: "eq", value: "New York" },
          { field: "age", operator: "gt", value: 30 },
        ],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(1);
      expect((result.rows[0] as Record<string, unknown>).name).toBe("Bob");
    });

    it("should apply ne (not equal) filter", () => {
      const options: ReportBuilderOptions = {
        filters: [{ field: "city", operator: "ne", value: "New York" }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(2);
    });

    it("should apply gt (greater than) filter", () => {
      const options: ReportBuilderOptions = {
        filters: [{ field: "age", operator: "gt", value: 28 }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(2);
      expect(result.rows.every((r: Record<string, unknown>) => (r.age as number) > 28)).toBe(true);
    });

    it("should apply gte (greater than or equal) filter", () => {
      const options: ReportBuilderOptions = {
        filters: [{ field: "age", operator: "gte", value: 30 }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(2);
    });

    it("should apply lt (less than) filter", () => {
      const options: ReportBuilderOptions = {
        filters: [{ field: "age", operator: "lt", value: 30 }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(2);
    });

    it("should apply lte (less than or equal) filter", () => {
      const options: ReportBuilderOptions = {
        filters: [{ field: "age", operator: "lte", value: 30 }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(3);
    });

    it("should apply contains filter", () => {
      const options: ReportBuilderOptions = {
        filters: [{ field: "name", operator: "contains", value: "a" }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(
        result.rows.every((r: Record<string, unknown>) =>
          String(r.name).toLowerCase().includes("a"),
        ),
      ).toBe(true);
    });

    it("should apply in filter", () => {
      const options: ReportBuilderOptions = {
        filters: [{ field: "city", operator: "in", value: ["New York", "Boston"] }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(3);
    });

    it("should apply between filter", () => {
      const options: ReportBuilderOptions = {
        filters: [{ field: "age", operator: "between", value: 25, valueTo: 30 }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(3);
    });

    it("should apply sorting ascending", () => {
      const options: ReportBuilderOptions = {
        sort: [{ field: "age", direction: "asc" }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect((result.rows[0] as Record<string, unknown>).age).toBe(25);
      expect((result.rows[3] as Record<string, unknown>).age).toBe(35);
    });

    it("should apply sorting descending", () => {
      const options: ReportBuilderOptions = {
        sort: [{ field: "age", direction: "desc" }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect((result.rows[0] as Record<string, unknown>).age).toBe(35);
      expect((result.rows[3] as Record<string, unknown>).age).toBe(25);
    });

    it("should apply multiple sort criteria", () => {
      const data = [
        { name: "John", age: 30, city: "Boston" },
        { name: "Jane", age: 30, city: "Atlanta" },
      ];

      const options: ReportBuilderOptions = {
        sort: [
          { field: "age", direction: "asc" },
          { field: "city", direction: "asc" },
        ],
      };

      const result = service.buildReport(data, mockColumns, options);

      expect((result.rows[0] as Record<string, unknown>).city).toBe("Atlanta");
      expect((result.rows[1] as Record<string, unknown>).city).toBe("Boston");
    });

    it("should apply limit", () => {
      const options: ReportBuilderOptions = {
        limit: 2,
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(2);
    });

    it("should apply offset", () => {
      const options: ReportBuilderOptions = {
        offset: 2,
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(2);
      expect((result.rows[0] as Record<string, unknown>).name).toBe("Bob");
    });

    it("should apply limit and offset together", () => {
      const options: ReportBuilderOptions = {
        offset: 1,
        limit: 2,
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(2);
      expect((result.rows[0] as Record<string, unknown>).name).toBe("Jane");
    });

    it("should handle grouping with sum aggregation", () => {
      const options: ReportBuilderOptions = {
        groupBy: ["city"],
        aggregations: [{ field: "age", type: "sum", alias: "totalAge" }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("should handle grouping with count aggregation", () => {
      const options: ReportBuilderOptions = {
        groupBy: ["city"],
        aggregations: [{ field: "age", type: "count", alias: "count" }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("should handle grouping with avg aggregation", () => {
      const options: ReportBuilderOptions = {
        groupBy: ["city"],
        aggregations: [{ field: "age", type: "avg", alias: "avgAge" }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("should handle grouping with min/max aggregation", () => {
      const options: ReportBuilderOptions = {
        groupBy: ["city"],
        aggregations: [
          { field: "age", type: "min", alias: "minAge" },
          { field: "age", type: "max", alias: "maxAge" },
        ],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("should handle empty data", () => {
      const result = service.buildReport([], mockColumns);

      expect(result.rows).toHaveLength(0);
    });

    it("should handle null values in filters", () => {
      const data = [
        { name: "John", age: null, city: "New York" },
        { name: "Jane", age: 25, city: "Boston" },
      ];

      const options: ReportBuilderOptions = {
        filters: [{ field: "age", operator: "gt", value: 20 }],
      };

      const result = service.buildReport(data, mockColumns, options);

      expect(result.rows).toHaveLength(1);
      expect((result.rows[0] as Record<string, unknown>).name).toBe("Jane");
    });

    it("should apply between filter", () => {
      const options: ReportBuilderOptions = {
        filters: [{ field: "age", operator: "between", value: 26, valueTo: 32 }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(2);
      expect(
        result.rows.every((r: Record<string, unknown>) => {
          const age = r.age as number;
          return age >= 26 && age <= 32;
        }),
      ).toBe(true);
    });

    it("should apply between filter with null values", () => {
      const data = [
        { name: "John", age: null, city: "New York" },
        { name: "Jane", age: 25, city: "Boston" },
      ];

      const options: ReportBuilderOptions = {
        filters: [{ field: "age", operator: "between", value: 20, valueTo: 30 }],
      };

      const result = service.buildReport(data, mockColumns, options);

      expect(result.rows).toHaveLength(1);
    });

    it("should apply in filter with array", () => {
      const options: ReportBuilderOptions = {
        filters: [{ field: "city", operator: "in", value: ["New York", "Chicago"] }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(3);
    });

    it("should apply in filter with single value", () => {
      const options: ReportBuilderOptions = {
        filters: [{ field: "city", operator: "in", value: "New York" }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(2);
    });

    it("should apply contains filter", () => {
      const options: ReportBuilderOptions = {
        filters: [{ field: "name", operator: "contains", value: "J" }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      expect(result.rows).toHaveLength(2);
      expect(
        result.rows.every((r: Record<string, unknown>) =>
          (r.name as string).toLowerCase().includes("j"),
        ),
      ).toBe(true);
    });

    it("should handle sorting with null values", () => {
      const data = [
        { name: "John", age: 30, city: "New York" },
        { name: "Jane", age: null, city: "Boston" },
        { name: "Bob", age: 35, city: "Chicago" },
      ];

      const options: ReportBuilderOptions = {
        sort: [{ field: "age", direction: "asc" }],
      };

      const result = service.buildReport(data, mockColumns, options);

      // Null values should be at the end when sorting ascending
      expect((result.rows[result.rows.length - 1] as Record<string, unknown>).name).toBe("Jane");
    });

    it("should handle sorting with undefined values", () => {
      const data = [
        { name: "John", age: 30, city: "New York" },
        { name: "Jane", age: undefined, city: "Boston" },
        { name: "Bob", age: 35, city: "Chicago" },
      ];

      const options: ReportBuilderOptions = {
        sort: [{ field: "age", direction: "desc" }],
      };

      const result = service.buildReport(data, mockColumns, options);

      expect(result.rows).toHaveLength(3);
    });

    it("should handle sorting with date values", () => {
      const data = [
        { name: "John", date: new Date("2024-01-15"), city: "New York" },
        { name: "Jane", date: new Date("2024-01-10"), city: "Boston" },
        { name: "Bob", date: new Date("2024-01-20"), city: "Chicago" },
      ];

      const columns: ReportColumn[] = [
        { header: "Name", key: "name" },
        { header: "Date", key: "date" },
        { header: "City", key: "city" },
      ];

      const options: ReportBuilderOptions = {
        sort: [{ field: "date", direction: "asc" }],
      };

      const result = service.buildReport(data, columns, options);

      expect((result.rows[0] as Record<string, unknown>).name).toBe("Jane");
      expect((result.rows[2] as Record<string, unknown>).name).toBe("Bob");
    });

    it("should handle unknown filter operator", () => {
      const options: ReportBuilderOptions = {
        filters: [{ field: "city", operator: "unknown" as "eq", value: "New York" }],
      };

      const result = service.buildReport(mockData, mockColumns, options);

      // Unknown operator should return all data
      expect(result.rows).toHaveLength(4);
    });
  });

  describe("addSummaryColumn", () => {
    it("should add a calculated column", () => {
      const reportData = {
        title: "Test",
        columns: mockColumns,
        rows: mockData,
      };

      const newColumn: ReportColumn = { header: "Category", key: "category" };
      const result = service.addSummaryColumn(reportData, newColumn, (row) => {
        return (row.age as number) > 30 ? "Senior" : "Junior";
      });

      expect(result.columns).toHaveLength(4);
      expect(result.rows[2]).toHaveProperty("category", "Senior");
    });
  });

  describe("addTotalRow", () => {
    it("should add a total row", () => {
      const reportData = {
        title: "Test",
        columns: mockColumns,
        rows: mockData,
      };

      const result = service.addTotalRow(reportData, {
        name: "TOTAL",
        age: 118,
        city: "-",
      });

      expect(result.rows).toHaveLength(5);
      expect((result.rows[4] as Record<string, unknown>).name).toBe("TOTAL");
    });
  });

  describe("inferColumnsFromData", () => {
    it("should infer columns from sample data", () => {
      const sampleRow = { name: "John", age: 30, email: "john@test.com" };
      const columns = service.inferColumnsFromData(sampleRow);

      expect(columns).toHaveLength(3);
      expect(columns.map((c) => c.key)).toContain("name");
      expect(columns.map((c) => c.key)).toContain("age");
      expect(columns.map((c) => c.key)).toContain("email");
    });

    it("should use custom headers when provided", () => {
      const sampleRow = { name: "John", age: 30 };
      const customHeaders = { name: "Nome", age: "Idade" };
      const columns = service.inferColumnsFromData(sampleRow, customHeaders);

      expect(columns.find((c) => c.key === "name")?.header).toBe("Nome");
      expect(columns.find((c) => c.key === "age")?.header).toBe("Idade");
    });

    it("should format header names properly", () => {
      const sampleRow = { firstName: "John", user_age: 30 };
      const columns = service.inferColumnsFromData(sampleRow);

      expect(columns.find((c) => c.key === "firstName")?.header).toBe("First Name");
      expect(columns.find((c) => c.key === "user_age")?.header).toBe("User age");
    });
  });
});
