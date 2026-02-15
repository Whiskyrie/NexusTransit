import {
  ReportType,
  ReportStatus,
  ReportFormat,
  ReportPeriod,
  isValidReportType,
  isValidReportStatus,
  isValidReportFormat,
  translateReportType,
  translateReportStatus,
  translateReportFormat,
  getAvailableReportTypes,
  getAvailableReportStatuses,
  getAvailableReportFormats,
} from "./report-type.enum";

describe("ReportType Enum", () => {
  it("should have DELIVERIES value", () => {
    expect(ReportType.DELIVERIES).toBe("DELIVERIES");
  });

  it("should have DRIVERS_PERFORMANCE value", () => {
    expect(ReportType.DRIVERS_PERFORMANCE).toBe("DRIVERS_PERFORMANCE");
  });

  it("should have VEHICLES_USAGE value", () => {
    expect(ReportType.VEHICLES_USAGE).toBe("VEHICLES_USAGE");
  });

  it("should have ROUTES value", () => {
    expect(ReportType.ROUTES).toBe("ROUTES");
  });

  it("should have SERVICE_ORDERS value", () => {
    expect(ReportType.SERVICE_ORDERS).toBe("SERVICE_ORDERS");
  });

  it("should have CUSTOMERS value", () => {
    expect(ReportType.CUSTOMERS).toBe("CUSTOMERS");
  });

  it("should have FINANCIAL value", () => {
    expect(ReportType.FINANCIAL).toBe("FINANCIAL");
  });

  it("should have INCIDENTS value", () => {
    expect(ReportType.INCIDENTS).toBe("INCIDENTS");
  });

  it("should have CUSTOM value", () => {
    expect(ReportType.CUSTOM).toBe("CUSTOM");
  });
});

describe("ReportStatus Enum", () => {
  it("should have PENDING value", () => {
    expect(ReportStatus.PENDING).toBe("PENDING");
  });

  it("should have PROCESSING value", () => {
    expect(ReportStatus.PROCESSING).toBe("PROCESSING");
  });

  it("should have COMPLETED value", () => {
    expect(ReportStatus.COMPLETED).toBe("COMPLETED");
  });

  it("should have FAILED value", () => {
    expect(ReportStatus.FAILED).toBe("FAILED");
  });

  it("should have CANCELLED value", () => {
    expect(ReportStatus.CANCELLED).toBe("CANCELLED");
  });

  it("should have EXPIRED value", () => {
    expect(ReportStatus.EXPIRED).toBe("EXPIRED");
  });
});

describe("ReportFormat Enum", () => {
  it("should have PDF value", () => {
    expect(ReportFormat.PDF).toBe("PDF");
  });

  it("should have EXCEL value", () => {
    expect(ReportFormat.EXCEL).toBe("EXCEL");
  });

  it("should have CSV value", () => {
    expect(ReportFormat.CSV).toBe("CSV");
  });

  it("should have JSON value", () => {
    expect(ReportFormat.JSON).toBe("JSON");
  });
});

describe("ReportPeriod Enum", () => {
  it("should have TODAY value", () => {
    expect(ReportPeriod.TODAY).toBe("TODAY");
  });

  it("should have THIS_WEEK value", () => {
    expect(ReportPeriod.THIS_WEEK).toBe("THIS_WEEK");
  });

  it("should have THIS_MONTH value", () => {
    expect(ReportPeriod.THIS_MONTH).toBe("THIS_MONTH");
  });

  it("should have LAST_7_DAYS value", () => {
    expect(ReportPeriod.LAST_7_DAYS).toBe("LAST_7_DAYS");
  });

  it("should have LAST_30_DAYS value", () => {
    expect(ReportPeriod.LAST_30_DAYS).toBe("LAST_30_DAYS");
  });

  it("should have LAST_90_DAYS value", () => {
    expect(ReportPeriod.LAST_90_DAYS).toBe("LAST_90_DAYS");
  });

  it("should have CUSTOM value", () => {
    expect(ReportPeriod.CUSTOM).toBe("CUSTOM");
  });
});

describe("getAvailableReportTypes", () => {
  it("should return all report types", () => {
    const types = getAvailableReportTypes();
    expect(types).toContain(ReportType.DELIVERIES);
    expect(types).toContain(ReportType.DRIVERS_PERFORMANCE);
    expect(types).toContain(ReportType.VEHICLES_USAGE);
    expect(types).toContain(ReportType.ROUTES);
    expect(types).toContain(ReportType.SERVICE_ORDERS);
    expect(types).toContain(ReportType.CUSTOMERS);
    expect(types).toContain(ReportType.FINANCIAL);
    expect(types).toContain(ReportType.INCIDENTS);
    expect(types).toContain(ReportType.CUSTOM);
  });
});

describe("getAvailableReportStatuses", () => {
  it("should return all report statuses", () => {
    const statuses = getAvailableReportStatuses();
    expect(statuses).toContain(ReportStatus.PENDING);
    expect(statuses).toContain(ReportStatus.PROCESSING);
    expect(statuses).toContain(ReportStatus.COMPLETED);
    expect(statuses).toContain(ReportStatus.FAILED);
    expect(statuses).toContain(ReportStatus.CANCELLED);
    expect(statuses).toContain(ReportStatus.EXPIRED);
  });
});

describe("getAvailableReportFormats", () => {
  it("should return all report formats", () => {
    const formats = getAvailableReportFormats();
    expect(formats).toContain(ReportFormat.PDF);
    expect(formats).toContain(ReportFormat.EXCEL);
    expect(formats).toContain(ReportFormat.CSV);
    expect(formats).toContain(ReportFormat.JSON);
  });
});

describe("isValidReportType", () => {
  it("should return true for valid report types", () => {
    expect(isValidReportType("DELIVERIES")).toBe(true);
    expect(isValidReportType("ROUTES")).toBe(true);
    expect(isValidReportType("INCIDENTS")).toBe(true);
  });

  it("should return false for invalid report types", () => {
    expect(isValidReportType("INVALID")).toBe(false);
    expect(isValidReportType("")).toBe(false);
    expect(isValidReportType("PDF")).toBe(false);
  });
});

describe("isValidReportStatus", () => {
  it("should return true for valid report statuses", () => {
    expect(isValidReportStatus("PENDING")).toBe(true);
    expect(isValidReportStatus("COMPLETED")).toBe(true);
    expect(isValidReportStatus("FAILED")).toBe(true);
  });

  it("should return false for invalid report statuses", () => {
    expect(isValidReportStatus("INVALID")).toBe(false);
    expect(isValidReportStatus("")).toBe(false);
    expect(isValidReportStatus("DELIVERIES")).toBe(false);
  });
});

describe("isValidReportFormat", () => {
  it("should return true for valid report formats", () => {
    expect(isValidReportFormat("PDF")).toBe(true);
    expect(isValidReportFormat("EXCEL")).toBe(true);
    expect(isValidReportFormat("CSV")).toBe(true);
    expect(isValidReportFormat("JSON")).toBe(true);
    expect(isValidReportFormat("HTML")).toBe(true);
  });

  it("should return false for invalid report formats", () => {
    expect(isValidReportFormat("INVALID")).toBe(false);
    expect(isValidReportFormat("")).toBe(false);
    expect(isValidReportFormat("PENDING")).toBe(false);
    expect(isValidReportFormat("WORD")).toBe(false);
  });
});

describe("translateReportType", () => {
  it("should translate DELIVERIES", () => {
    expect(translateReportType(ReportType.DELIVERIES)).toBe("Entregas");
  });

  it("should translate ROUTES", () => {
    expect(translateReportType(ReportType.ROUTES)).toBe("Rotas");
  });

  it("should translate INCIDENTS", () => {
    expect(translateReportType(ReportType.INCIDENTS)).toBe("Incidentes");
  });

  it("should translate DRIVERS_PERFORMANCE", () => {
    expect(translateReportType(ReportType.DRIVERS_PERFORMANCE)).toBe("Performance de Motoristas");
  });

  it("should translate VEHICLES_USAGE", () => {
    expect(translateReportType(ReportType.VEHICLES_USAGE)).toBe("Uso de Veículos");
  });

  it("should translate SERVICE_ORDERS", () => {
    expect(translateReportType(ReportType.SERVICE_ORDERS)).toBe("Ordens de Serviço");
  });

  it("should translate CUSTOMERS", () => {
    expect(translateReportType(ReportType.CUSTOMERS)).toBe("Clientes");
  });

  it("should translate FINANCIAL", () => {
    expect(translateReportType(ReportType.FINANCIAL)).toBe("Financeiro");
  });

  it("should translate CUSTOM", () => {
    expect(translateReportType(ReportType.CUSTOM)).toBe("Customizado");
  });
});

describe("translateReportStatus", () => {
  it("should translate PENDING", () => {
    expect(translateReportStatus(ReportStatus.PENDING)).toBe("Pendente");
  });

  it("should translate PROCESSING", () => {
    expect(translateReportStatus(ReportStatus.PROCESSING)).toBe("Processando");
  });

  it("should translate COMPLETED", () => {
    expect(translateReportStatus(ReportStatus.COMPLETED)).toBe("Concluído");
  });

  it("should translate FAILED", () => {
    expect(translateReportStatus(ReportStatus.FAILED)).toBe("Falhou");
  });

  it("should translate CANCELLED", () => {
    expect(translateReportStatus(ReportStatus.CANCELLED)).toBe("Cancelado");
  });

  it("should translate EXPIRED", () => {
    expect(translateReportStatus(ReportStatus.EXPIRED)).toBe("Expirado");
  });
});

describe("translateReportFormat", () => {
  it("should translate PDF", () => {
    expect(translateReportFormat(ReportFormat.PDF)).toBe("PDF");
  });

  it("should translate EXCEL", () => {
    expect(translateReportFormat(ReportFormat.EXCEL)).toBe("Excel");
  });

  it("should translate CSV", () => {
    expect(translateReportFormat(ReportFormat.CSV)).toBe("CSV");
  });

  it("should translate JSON", () => {
    expect(translateReportFormat(ReportFormat.JSON)).toBe("JSON");
  });
});
