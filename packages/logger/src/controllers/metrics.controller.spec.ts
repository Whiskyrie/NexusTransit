import { Test, TestingModule } from "@nestjs/testing";
import { MetricsController } from "../controllers/metrics.controller";
import { MetricsService } from "../services/metrics.service";
import { HttpMetric, ErrorMetric, SlowRequestMetric } from "../interfaces/metrics.interface";

describe("MetricsController", () => {
  let controller: MetricsController;
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: {
            getAllMetrics: jest.fn(),
            getHttpMetrics: jest.fn(),
            getErrorMetrics: jest.fn(),
            getSlowRequestMetrics: jest.fn(),
            getSystemMetrics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    service = module.get<MetricsService>(MetricsService);
  });

  it("deve ser definido", () => {
    expect(controller).toBeDefined();
  });

  describe("getAllMetrics", () => {
    it("deve retornar todas as métricas", () => {
      const mockMetrics = {
        http: {
          totalRequests: 100,
          successfulRequests: 95,
          errorRequests: 5,
          avgDuration: 150,
          p95Duration: 300,
          p99Duration: 500,
          requestsPerMinute: 10,
          errorRate: "5.00",
        },
        errors: {
          totalErrors: 5,
          errorsByType: { ValidationError: 3, NotFoundError: 2 },
          errorsByRoute: { "/users": 3, "/posts": 2 },
          recentErrors: [],
        },
        slowRequests: {
          totalSlowRequests: 2,
          slowRequests: [],
        },
        system: {
          memoryUsage: {
            heapUsed: 100,
            heapTotal: 200,
            external: 10,
            rss: 150,
          },
          uptime: 3600,
          nodeVersion: "v18.0.0",
          platform: "linux",
        },
        timestamp: new Date().toISOString(),
      };

      jest.spyOn(service, "getAllMetrics").mockReturnValue(mockMetrics);

      const result = controller.getAllMetrics();

      expect(service.getAllMetrics).toHaveBeenCalled();
      expect(result).toEqual(mockMetrics);
    });
  });

  describe("getHttpMetrics", () => {
    it("deve retornar métricas HTTP", () => {
      const mockHttpMetrics = {
        totalRequests: 100,
        successfulRequests: 95,
        errorRequests: 5,
        avgDuration: 150,
        p95Duration: 300,
        p99Duration: 500,
        requestsPerMinute: 10,
        errorRate: "5.00",
      };

      jest.spyOn(service, "getHttpMetrics").mockReturnValue(mockHttpMetrics);

      const result = controller.getHttpMetrics();

      expect(service.getHttpMetrics).toHaveBeenCalled();
      expect(result).toEqual(mockHttpMetrics);
    });
  });

  describe("getErrorMetrics", () => {
    it("deve retornar métricas de erro", () => {
      const mockErrorMetrics = {
        totalErrors: 5,
        errorsByType: { ValidationError: 3, NotFoundError: 2 },
        errorsByRoute: { "/users": 3, "/posts": 2 },
        recentErrors: [],
      };

      jest.spyOn(service, "getErrorMetrics").mockReturnValue(mockErrorMetrics);

      const result = controller.getErrorMetrics();

      expect(service.getErrorMetrics).toHaveBeenCalled();
      expect(result).toEqual(mockErrorMetrics);
    });
  });

  describe("getSlowRequestMetrics", () => {
    it("deve retornar métricas de requisições lentas", () => {
      const mockSlowMetrics = {
        totalSlowRequests: 2,
        slowRequests: [
          {
            method: "GET",
            route: "/slow-endpoint",
            duration: 3000,
            timestamp: new Date(),
          },
        ],
      };

      jest.spyOn(service, "getSlowRequestMetrics").mockReturnValue(mockSlowMetrics);

      const result = controller.getSlowRequestMetrics();

      expect(service.getSlowRequestMetrics).toHaveBeenCalled();
      expect(result).toEqual(mockSlowMetrics);
    });
  });

  describe("getSystemMetrics", () => {
    it("deve retornar métricas do sistema", () => {
      const mockSystemMetrics = {
        memoryUsage: {
          heapUsed: 100,
          heapTotal: 200,
          external: 10,
          rss: 150,
        },
        uptime: 3600,
        nodeVersion: "v18.0.0",
        platform: "linux",
      };

      jest.spyOn(service, "getSystemMetrics").mockReturnValue(mockSystemMetrics);

      const result = controller.getSystemMetrics();

      expect(service.getSystemMetrics).toHaveBeenCalled();
      expect(result).toEqual(mockSystemMetrics);
    });
  });
});
