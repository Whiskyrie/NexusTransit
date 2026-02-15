import { ReportResponseDto } from "./report-response.dto";
import { ReportType, ReportStatus, ReportFormat, ReportPeriod } from "../enums";

describe("ReportResponseDto", () => {
  let dto: ReportResponseDto;

  beforeEach(() => {
    dto = new ReportResponseDto();
    // Required fields
    dto.id = "123e4567-e89b-12d3-a456-426614174000";
    dto.name = "Test Report";
    dto.type = ReportType.DELIVERIES;
    dto.status = ReportStatus.COMPLETED;
    dto.format = ReportFormat.PDF;
    dto.requested_by = "123e4567-e89b-12d3-a456-426614174001";
    dto.records_count = 100;
    dto.is_scheduled = false;
    dto.is_active = true;
    dto.download_count = 5;
    dto.created_at = new Date();
    dto.updated_at = new Date();
  });

  it("should be defined", () => {
    expect(dto).toBeDefined();
  });

  describe("required fields", () => {
    it("should have id", () => {
      expect(dto.id).toBe("123e4567-e89b-12d3-a456-426614174000");
    });

    it("should have name", () => {
      expect(dto.name).toBe("Test Report");
    });

    it("should have type", () => {
      expect(dto.type).toBe(ReportType.DELIVERIES);
    });

    it("should have status", () => {
      expect(dto.status).toBe(ReportStatus.COMPLETED);
    });

    it("should have format", () => {
      expect(dto.format).toBe(ReportFormat.PDF);
    });

    it("should have requested_by", () => {
      expect(dto.requested_by).toBe("123e4567-e89b-12d3-a456-426614174001");
    });

    it("should have records_count", () => {
      expect(dto.records_count).toBe(100);
    });

    it("should have is_scheduled", () => {
      expect(dto.is_scheduled).toBe(false);
    });

    it("should have is_active", () => {
      expect(dto.is_active).toBe(true);
    });

    it("should have download_count", () => {
      expect(dto.download_count).toBe(5);
    });

    it("should have created_at", () => {
      expect(dto.created_at).toBeInstanceOf(Date);
    });

    it("should have updated_at", () => {
      expect(dto.updated_at).toBeInstanceOf(Date);
    });
  });

  describe("optional fields", () => {
    it("should accept period", () => {
      dto.period = ReportPeriod.LAST_30_DAYS;
      expect(dto.period).toBe(ReportPeriod.LAST_30_DAYS);
    });

    it("should accept start_date", () => {
      const date = new Date("2025-01-01");
      dto.start_date = date;
      expect(dto.start_date).toBe(date);
    });

    it("should accept end_date", () => {
      const date = new Date("2025-12-31");
      dto.end_date = date;
      expect(dto.end_date).toBe(date);
    });

    it("should accept requested_by_name", () => {
      dto.requested_by_name = "John Doe";
      expect(dto.requested_by_name).toBe("John Doe");
    });

    it("should accept description", () => {
      dto.description = "Test description";
      expect(dto.description).toBe("Test description");
    });

    it("should accept filters", () => {
      const filters = { status: "DELIVERED" };
      dto.filters = filters;
      expect(dto.filters).toEqual(filters);
    });

    it("should accept settings", () => {
      const settings = { include_charts: true };
      dto.settings = settings;
      expect(dto.settings).toEqual(settings);
    });

    it("should accept file_url", () => {
      dto.file_url = "https://storage.example.com/report.pdf";
      expect(dto.file_url).toBe("https://storage.example.com/report.pdf");
    });

    it("should accept file_name", () => {
      dto.file_name = "report.pdf";
      expect(dto.file_name).toBe("report.pdf");
    });

    it("should accept file_size", () => {
      dto.file_size = 1048576;
      expect(dto.file_size).toBe(1048576);
    });

    it("should accept processing_started_at", () => {
      const date = new Date();
      dto.processing_started_at = date;
      expect(dto.processing_started_at).toBe(date);
    });

    it("should accept processing_completed_at", () => {
      const date = new Date();
      dto.processing_completed_at = date;
      expect(dto.processing_completed_at).toBe(date);
    });

    it("should accept processing_duration_ms", () => {
      dto.processing_duration_ms = 330000;
      expect(dto.processing_duration_ms).toBe(330000);
    });

    it("should accept error_message", () => {
      dto.error_message = "Error occurred";
      expect(dto.error_message).toBe("Error occurred");
    });

    it("should accept error_details", () => {
      const details = { code: "TIMEOUT", stack: "..." };
      dto.error_details = details;
      expect(dto.error_details).toEqual(details);
    });

    it("should accept schedule_cron", () => {
      dto.schedule_cron = "0 0 * * 1";
      expect(dto.schedule_cron).toBe("0 0 * * 1");
    });

    it("should accept next_execution", () => {
      const date = new Date();
      dto.next_execution = date;
      expect(dto.next_execution).toBe(date);
    });

    it("should accept expires_at", () => {
      const date = new Date();
      dto.expires_at = date;
      expect(dto.expires_at).toBe(date);
    });

    it("should accept last_downloaded_at", () => {
      const date = new Date();
      dto.last_downloaded_at = date;
      expect(dto.last_downloaded_at).toBe(date);
    });

    it("should accept deleted_at", () => {
      const date = new Date();
      dto.deleted_at = date;
      expect(dto.deleted_at).toBe(date);
    });
  });

  describe("different report types", () => {
    it("should work with INCIDENTS type", () => {
      dto.type = ReportType.INCIDENTS;
      expect(dto.type).toBe(ReportType.INCIDENTS);
    });

    it("should work with ROUTES type", () => {
      dto.type = ReportType.ROUTES;
      expect(dto.type).toBe(ReportType.ROUTES);
    });

    it("should work with DRIVERS_PERFORMANCE type", () => {
      dto.type = ReportType.DRIVERS_PERFORMANCE;
      expect(dto.type).toBe(ReportType.DRIVERS_PERFORMANCE);
    });
  });

  describe("different statuses", () => {
    it("should work with PENDING status", () => {
      dto.status = ReportStatus.PENDING;
      expect(dto.status).toBe(ReportStatus.PENDING);
    });

    it("should work with PROCESSING status", () => {
      dto.status = ReportStatus.PROCESSING;
      expect(dto.status).toBe(ReportStatus.PROCESSING);
    });

    it("should work with FAILED status", () => {
      dto.status = ReportStatus.FAILED;
      expect(dto.status).toBe(ReportStatus.FAILED);
    });
  });

  describe("different formats", () => {
    it("should work with EXCEL format", () => {
      dto.format = ReportFormat.EXCEL;
      expect(dto.format).toBe(ReportFormat.EXCEL);
    });

    it("should work with CSV format", () => {
      dto.format = ReportFormat.CSV;
      expect(dto.format).toBe(ReportFormat.CSV);
    });
  });

  describe("different periods", () => {
    it("should work with TODAY period", () => {
      dto.period = ReportPeriod.TODAY;
      expect(dto.period).toBe(ReportPeriod.TODAY);
    });

    it("should work with YESTERDAY period", () => {
      dto.period = ReportPeriod.YESTERDAY;
      expect(dto.period).toBe(ReportPeriod.YESTERDAY);
    });

    it("should work with LAST_7_DAYS period", () => {
      dto.period = ReportPeriod.LAST_7_DAYS;
      expect(dto.period).toBe(ReportPeriod.LAST_7_DAYS);
    });

    it("should work with CUSTOM period", () => {
      dto.period = ReportPeriod.CUSTOM;
      expect(dto.period).toBe(ReportPeriod.CUSTOM);
    });
  });

  describe("report with errors", () => {
    it("should handle failed report with error details", () => {
      dto.status = ReportStatus.FAILED;
      dto.error_message = "Processing timeout";
      dto.error_details = { code: "TIMEOUT", retry: false };

      expect(dto.status).toBe(ReportStatus.FAILED);
      expect(dto.error_message).toBe("Processing timeout");
      expect(dto.error_details).toEqual({ code: "TIMEOUT", retry: false });
    });
  });

  describe("scheduled reports", () => {
    it("should handle scheduled report", () => {
      dto.is_scheduled = true;
      dto.schedule_cron = "0 0 * * 1";
      dto.next_execution = new Date("2025-01-13T00:00:00Z");

      expect(dto.is_scheduled).toBe(true);
      expect(dto.schedule_cron).toBe("0 0 * * 1");
      expect(dto.next_execution).toBeInstanceOf(Date);
    });
  });

  describe("report with file", () => {
    it("should handle completed report with file", () => {
      dto.status = ReportStatus.COMPLETED;
      dto.file_url = "https://storage.example.com/reports/123.pdf";
      dto.file_name = "relatorio-dezembro-2025.pdf";
      dto.file_size = 1048576;

      expect(dto.file_url).toBe("https://storage.example.com/reports/123.pdf");
      expect(dto.file_name).toBe("relatorio-dezembro-2025.pdf");
      expect(dto.file_size).toBe(1048576);
    });
  });

  describe("processing timing", () => {
    it("should handle processing timestamps", () => {
      const started = new Date("2025-01-01T10:00:00Z");
      const completed = new Date("2025-01-01T10:05:30Z");

      dto.processing_started_at = started;
      dto.processing_completed_at = completed;
      dto.processing_duration_ms = 330000;

      expect(dto.processing_started_at).toBe(started);
      expect(dto.processing_completed_at).toBe(completed);
      expect(dto.processing_duration_ms).toBe(330000);
    });
  });
});
