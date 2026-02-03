import { Test, TestingModule } from "@nestjs/testing";
import { PerformanceInterceptor } from "../interceptors/performance.interceptor";
import { ExecutionContext, CallHandler, HttpException, HttpStatus } from "@nestjs/common";
import { of, throwError } from "rxjs";
import { PinoLogger } from "nestjs-pino";
import { MetricsService } from "../services/metrics.service";

describe("PerformanceInterceptor", () => {
  let interceptor: PerformanceInterceptor;
  let mockPinoLogger: PinoLogger;
  let mockMetricsService: MetricsService;

  beforeEach(async () => {
    mockPinoLogger = {
      logger: {
        child: jest.fn().mockReturnValue({
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
        }),
      },
    } as unknown as PinoLogger;

    mockMetricsService = {
      recordHttpRequest: jest.fn(),
      recordError: jest.fn(),
      recordSlowRequest: jest.fn(),
    } as unknown as MetricsService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceInterceptor,
        {
          provide: PinoLogger,
          useValue: mockPinoLogger,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    interceptor = module.get<PerformanceInterceptor>(PerformanceInterceptor);
  });

  it("deve ser definido", () => {
    expect(interceptor).toBeDefined();
  });

  describe("intercept - requisição bem-sucedida", () => {
    it("deve medir o tempo de resposta e registrar métricas HTTP", (done) => {
      const mockRequest = {
        method: "GET",
        url: "/test",
        user: { id: "user-123" },
        correlationId: "corr-123",
      };

      const mockResponse = {
        statusCode: 200,
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of({ data: "test" })),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockCallHandler.handle).toHaveBeenCalled();
          expect(mockMetricsService.recordHttpRequest).toHaveBeenCalledWith({
            method: "GET",
            route: "/test",
            statusCode: 200,
            duration: expect.any(Number),
            userId: "user-123",
            timestamp: expect.any(Date),
          });
          done();
        },
      });
    });

    it("deve logar conclusão da requisição", (done) => {
      const mockRequest = {
        method: "POST",
        url: "/users",
        user: { id: "user-456" },
        correlationId: "corr-456",
      };

      const mockResponse = {
        statusCode: 201,
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of({ data: "created" })),
      };

      const childLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      (mockPinoLogger.logger.child as jest.Mock).mockReturnValue(childLogger);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockPinoLogger.logger.child).toHaveBeenCalledWith({
            correlationId: "corr-456",
            userId: "user-456",
            method: "POST",
            url: "/users",
          });
          expect(childLogger.info).toHaveBeenCalledWith(
            {
              duration: expect.any(Number),
              statusCode: 201,
            },
            "Request completed",
          );
          done();
        },
      });
    });

    it("deve converter userId number para string", (done) => {
      const mockRequest = {
        method: "GET",
        url: "/test",
        user: { id: 123 },
        correlationId: "corr-123",
      };

      const mockResponse = {
        statusCode: 200,
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of({ data: "test" })),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockMetricsService.recordHttpRequest).toHaveBeenCalledWith(
            expect.objectContaining({
              userId: "123",
            }),
          );
          done();
        },
      });
    });

    it("deve lidar com userId undefined", (done) => {
      const mockRequest = {
        method: "GET",
        url: "/test",
        correlationId: "corr-123",
      };

      const mockResponse = {
        statusCode: 200,
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of({ data: "test" })),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockMetricsService.recordHttpRequest).toHaveBeenCalledWith(
            expect.objectContaining({
              userId: undefined,
            }),
          );
          done();
        },
      });
    });
  });

  describe("intercept - requisições lentas", () => {
    it("deve detectar e registrar requisições lentas (> 2000ms)", (done) => {
      const mockRequest = {
        method: "GET",
        url: "/slow-endpoint",
        user: { id: "user-789" },
        correlationId: "corr-789",
      };

      const mockResponse = {
        statusCode: 200,
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of({ data: "slow" })),
      };

      const childLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      (mockPinoLogger.logger.child as jest.Mock).mockReturnValue(childLogger);

      // Mockar Date.now para simular tempo lento
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => {
        callCount++;
        if (callCount === 1) return 1000; // startTime
        return 3500; // endTime (2500ms depois)
      });

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockMetricsService.recordSlowRequest).toHaveBeenCalledWith({
            method: "GET",
            route: "/slow-endpoint",
            duration: 2500,
            userId: "user-789",
            timestamp: expect.any(Date),
          });
          expect(childLogger.warn).toHaveBeenCalledWith(
            {
              duration: 2500,
              threshold: 2000,
            },
            "Slow request detected",
          );
          Date.now = originalDateNow;
          done();
        },
      });
    });

    it("não deve registrar requisição rápida como lenta", (done) => {
      const mockRequest = {
        method: "GET",
        url: "/fast-endpoint",
        user: { id: "user-999" },
        correlationId: "corr-999",
      };

      const mockResponse = {
        statusCode: 200,
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of({ data: "fast" })),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockMetricsService.recordSlowRequest).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe("intercept - tratamento de erros", () => {
    it("deve registrar erro nas métricas quando a requisição falha", (done) => {
      const mockRequest = {
        method: "POST",
        url: "/users",
        user: { id: "user-error" },
        correlationId: "corr-error",
      };

      const mockResponse = {
        statusCode: 500,
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      const error = new Error("Test error");
      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(throwError(() => error)),
      };

      const childLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      (mockPinoLogger.logger.child as jest.Mock).mockReturnValue(childLogger);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          expect(mockMetricsService.recordError).toHaveBeenCalledWith({
            method: "POST",
            route: "/users",
            error: "Error",
            statusCode: 500,
            duration: expect.any(Number),
            userId: "user-error",
            timestamp: expect.any(Date),
          });
          expect(childLogger.error).toHaveBeenCalledWith(
            {
              err: error,
              duration: expect.any(Number),
              statusCode: 500,
            },
            "Request failed",
          );
          done();
        },
      });
    });

    it("deve lidar com HttpException corretamente", (done) => {
      const mockRequest = {
        method: "GET",
        url: "/not-found",
        user: { id: "user-404" },
        correlationId: "corr-404",
      };

      const mockResponse = {
        statusCode: 404,
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      const httpError = new HttpException("Not Found", HttpStatus.NOT_FOUND);
      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(throwError(() => httpError)),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          expect(mockMetricsService.recordError).toHaveBeenCalledWith(
            expect.objectContaining({
              statusCode: 404,
              error: "HttpException",
            }),
          );
          done();
        },
      });
    });

    it("deve lidar com erro desconhecido", (done) => {
      const mockRequest = {
        method: "POST",
        url: "/error",
        user: { id: "user-unknown" },
        correlationId: "corr-unknown",
      };

      const mockResponse = {
        statusCode: 500,
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      const unknownError = "string error";
      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(throwError(() => unknownError)),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          expect(mockMetricsService.recordError).toHaveBeenCalledWith(
            expect.objectContaining({
              statusCode: 500,
              error: "UnknownError",
            }),
          );
          done();
        },
      });
    });
  });

  describe("intercept - criação de child logger", () => {
    it("deve criar child logger com contexto da request", (done) => {
      const mockRequest = {
        method: "GET",
        url: "/test",
        user: { id: "user-ctx" },
        correlationId: "corr-ctx",
      };

      const mockResponse = {
        statusCode: 200,
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of({ data: "test" })),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockPinoLogger.logger.child).toHaveBeenCalledWith({
            correlationId: "corr-ctx",
            userId: "user-ctx",
            method: "GET",
            url: "/test",
          });
          done();
        },
      });
    });
  });
});
