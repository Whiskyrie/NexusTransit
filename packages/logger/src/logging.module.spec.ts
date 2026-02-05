import { MetricsService } from "./services/metrics.service";
import { CorrelationIdInterceptor } from "./interceptors/correlation-id.interceptor";
import { PerformanceInterceptor } from "./interceptors/performance.interceptor";
import { AllExceptionsFilter } from "./filters/all-exceptions.filter";
import { MetricsController } from "./controllers/metrics.controller";
import { PinoLogger } from "nestjs-pino";

describe("LoggingModule", () => {
  describe("MetricsService", () => {
    it("deve ser definido", () => {
      const service = new MetricsService();
      expect(service).toBeDefined();
    });

    it("deve inicializar arrays vazios", () => {
      const service = new MetricsService();
      expect((service as any).httpRequests).toEqual([]);
      expect((service as any).errors).toEqual([]);
      expect((service as any).slowRequests).toEqual([]);
    });
  });

  describe("CorrelationIdInterceptor", () => {
    it("deve ser definido", () => {
      const interceptor = new CorrelationIdInterceptor();
      expect(interceptor).toBeDefined();
    });
  });

  describe("PerformanceInterceptor", () => {
    it("deve ser definido", () => {
      const mockLogger = {} as PinoLogger;
      const mockMetricsService = {} as MetricsService;
      const interceptor = new PerformanceInterceptor(mockLogger, mockMetricsService);
      expect(interceptor).toBeDefined();
    });

    it("deve ter threshold padrão de 2000ms", () => {
      const mockLogger = {} as PinoLogger;
      const mockMetricsService = {} as MetricsService;
      const interceptor = new PerformanceInterceptor(mockLogger, mockMetricsService);
      expect((interceptor as any).SLOW_REQUEST_THRESHOLD).toBe(2000);
    });
  });

  describe("AllExceptionsFilter", () => {
    it("deve ser definido", () => {
      const mockLogger = {} as PinoLogger;
      const filter = new AllExceptionsFilter(mockLogger);
      expect(filter).toBeDefined();
    });
  });

  describe("MetricsController", () => {
    it("deve ser definido", () => {
      const mockMetricsService = {
        getAllMetrics: jest.fn(),
        getHttpMetrics: jest.fn(),
        getErrorMetrics: jest.fn(),
        getSlowRequestMetrics: jest.fn(),
        getSystemMetrics: jest.fn(),
      };
      const controller = new MetricsController(mockMetricsService as any);
      expect(controller).toBeDefined();
    });
  });

  describe("exportação de componentes", () => {
    it("MetricsService deve ter métodos públicos", () => {
      const service = new MetricsService();
      expect(typeof service.recordHttpRequest).toBe("function");
      expect(typeof service.recordError).toBe("function");
      expect(typeof service.recordSlowRequest).toBe("function");
      expect(typeof service.getHttpMetrics).toBe("function");
      expect(typeof service.getErrorMetrics).toBe("function");
      expect(typeof service.getSlowRequestMetrics).toBe("function");
      expect(typeof service.getSystemMetrics).toBe("function");
      expect(typeof service.getAllMetrics).toBe("function");
      expect(typeof service.clearMetrics).toBe("function");
    });

    it("CorrelationIdInterceptor deve implementar NestInterceptor", () => {
      const interceptor = new CorrelationIdInterceptor();
      expect(typeof interceptor.intercept).toBe("function");
    });

    it("PerformanceInterceptor deve implementar NestInterceptor", () => {
      const mockLogger = {} as PinoLogger;
      const mockMetricsService = {} as MetricsService;
      const interceptor = new PerformanceInterceptor(mockLogger, mockMetricsService);
      expect(typeof interceptor.intercept).toBe("function");
    });

    it("AllExceptionsFilter deve implementar ExceptionFilter", () => {
      const mockLogger = {} as PinoLogger;
      const filter = new AllExceptionsFilter(mockLogger);
      expect(typeof filter.catch).toBe("function");
    });
  });
});
