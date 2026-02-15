import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ReportFilterDto } from "./report-filter.dto";
import { ReportType, ReportStatus, ReportFormat } from "../enums";

describe("ReportFilterDto", () => {
  let dto: ReportFilterDto;

  beforeEach(() => {
    dto = new ReportFilterDto();
  });

  it("should be defined", () => {
    expect(dto).toBeDefined();
  });

  describe("type", () => {
    it("should accept valid ReportType", async () => {
      dto.type = ReportType.DELIVERIES;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "type")).toHaveLength(0);
    });

    it("should accept valid ReportType - INCIDENTS", async () => {
      dto.type = ReportType.INCIDENTS;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "type")).toHaveLength(0);
    });

    it("should accept valid ReportType - ROUTES", async () => {
      dto.type = ReportType.ROUTES;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "type")).toHaveLength(0);
    });

    it("should accept valid ReportType - DRIVERS_PERFORMANCE", async () => {
      dto.type = ReportType.DRIVERS_PERFORMANCE;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "type")).toHaveLength(0);
    });

    it("should be optional", async () => {
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "type")).toHaveLength(0);
    });

    it("should reject invalid type", async () => {
      (dto as unknown as Record<string, unknown>).type = "INVALID_TYPE";
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "type")).toHaveLength(1);
    });
  });

  describe("status", () => {
    it("should accept valid ReportStatus - PENDING", async () => {
      dto.status = ReportStatus.PENDING;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "status")).toHaveLength(0);
    });

    it("should accept valid ReportStatus - PROCESSING", async () => {
      dto.status = ReportStatus.PROCESSING;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "status")).toHaveLength(0);
    });

    it("should accept valid ReportStatus - COMPLETED", async () => {
      dto.status = ReportStatus.COMPLETED;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "status")).toHaveLength(0);
    });

    it("should accept valid ReportStatus - FAILED", async () => {
      dto.status = ReportStatus.FAILED;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "status")).toHaveLength(0);
    });

    it("should be optional", async () => {
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "status")).toHaveLength(0);
    });

    it("should reject invalid status", async () => {
      (dto as unknown as Record<string, unknown>).status = "INVALID_STATUS";
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "status")).toHaveLength(1);
    });
  });

  describe("format", () => {
    it("should accept valid ReportFormat - PDF", async () => {
      dto.format = ReportFormat.PDF;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "format")).toHaveLength(0);
    });

    it("should accept valid ReportFormat - EXCEL", async () => {
      dto.format = ReportFormat.EXCEL;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "format")).toHaveLength(0);
    });

    it("should accept valid ReportFormat - CSV", async () => {
      dto.format = ReportFormat.CSV;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "format")).toHaveLength(0);
    });

    it("should be optional", async () => {
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "format")).toHaveLength(0);
    });

    it("should reject invalid format", async () => {
      (dto as unknown as Record<string, unknown>).format = "INVALID_FORMAT";
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "format")).toHaveLength(1);
    });
  });

  describe("requested_by", () => {
    it("should accept valid UUID", async () => {
      dto.requested_by = "123e4567-e89b-12d3-a456-426614174000";
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "requested_by")).toHaveLength(0);
    });

    it("should be optional", async () => {
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "requested_by")).toHaveLength(0);
    });

    it("should reject invalid UUID format", async () => {
      dto.requested_by = "invalid-uuid";
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "requested_by")).toHaveLength(1);
    });
  });

  describe("is_scheduled", () => {
    it("should accept boolean true", async () => {
      dto.is_scheduled = true;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "is_scheduled")).toHaveLength(0);
    });

    it("should accept boolean false", async () => {
      dto.is_scheduled = false;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "is_scheduled")).toHaveLength(0);
    });

    it("should be optional", async () => {
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "is_scheduled")).toHaveLength(0);
    });

    it("should reject non-boolean values", async () => {
      (dto as unknown as Record<string, unknown>).is_scheduled = "true";
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "is_scheduled")).toHaveLength(1);
    });
  });

  describe("is_active", () => {
    it("should accept boolean true", async () => {
      dto.is_active = true;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "is_active")).toHaveLength(0);
    });

    it("should accept boolean false", async () => {
      dto.is_active = false;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "is_active")).toHaveLength(0);
    });

    it("should be optional", async () => {
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "is_active")).toHaveLength(0);
    });

    it("should reject non-boolean values", async () => {
      (dto as unknown as Record<string, unknown>).is_active = "false";
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "is_active")).toHaveLength(1);
    });
  });

  describe("is_expired", () => {
    it("should accept boolean true", async () => {
      dto.is_expired = true;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "is_expired")).toHaveLength(0);
    });

    it("should accept boolean false", async () => {
      dto.is_expired = false;
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "is_expired")).toHaveLength(0);
    });

    it("should be optional", async () => {
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "is_expired")).toHaveLength(0);
    });

    it("should reject non-boolean values", async () => {
      (dto as unknown as Record<string, unknown>).is_expired = "false";
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === "is_expired")).toHaveLength(1);
    });
  });

  describe("complete validation", () => {
    it("should validate complete dto with all fields", async () => {
      dto.type = ReportType.DELIVERIES;
      dto.status = ReportStatus.COMPLETED;
      dto.format = ReportFormat.PDF;
      dto.requested_by = "123e4567-e89b-12d3-a456-426614174000";
      dto.is_scheduled = false;
      dto.is_active = true;
      dto.is_expired = false;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should transform plain object to dto", async () => {
      const plain = {
        type: "DELIVERIES",
        status: "COMPLETED",
        format: "PDF",
        requested_by: "123e4567-e89b-12d3-a456-426614174000",
        is_scheduled: false,
        is_active: true,
        is_expired: false,
      };

      const transformed = plainToInstance(ReportFilterDto, plain);
      expect(transformed).toBeInstanceOf(ReportFilterDto);
      expect(transformed.type).toBe(ReportType.DELIVERIES);
    });
  });
});
