import { Test, TestingModule } from "@nestjs/testing";
import { CorrelationIdInterceptor } from "../interceptors/correlation-id.interceptor";
import { ExecutionContext, CallHandler } from "@nestjs/common";
import { of } from "rxjs";

// Mock do uuid
jest.mock("uuid", () => ({
  v4: jest.fn(() => "generated-uuid-123"),
}));

describe("CorrelationIdInterceptor", () => {
  let interceptor: CorrelationIdInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorrelationIdInterceptor],
    }).compile();

    interceptor = module.get<CorrelationIdInterceptor>(CorrelationIdInterceptor);
  });

  it("deve ser definido", () => {
    expect(interceptor).toBeDefined();
  });

  describe("intercept", () => {
    it("deve gerar um novo correlation ID quando não existe no header", () => {
      const mockRequest: { headers: Record<string, string | string[]>; correlationId?: string } = {
        headers: {},
      };

      const mockResponse = {
        setHeader: jest.fn(),
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of({})),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockRequest.correlationId).toBe("generated-uuid-123");
      expect(mockRequest.headers["x-correlation-id"]).toBe("generated-uuid-123");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("X-Correlation-Id", "generated-uuid-123");
    });

    it("deve usar o correlation ID existente do header", () => {
      const existingId = "existing-correlation-id-456";
      const mockRequest: { headers: Record<string, string | string[]>; correlationId?: string } = {
        headers: {
          "x-correlation-id": existingId,
        },
      };

      const mockResponse = {
        setHeader: jest.fn(),
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of({})),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockRequest.correlationId).toBe(existingId);
      expect(mockRequest.headers["x-correlation-id"]).toBe(existingId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith("X-Correlation-Id", existingId);
    });

    it("deve usar o primeiro correlation ID quando header é um array", () => {
      const existingIds = ["first-id", "second-id"];
      const mockRequest: { headers: Record<string, string | string[]>; correlationId?: string } = {
        headers: {
          "x-correlation-id": existingIds,
        },
      };

      const mockResponse = {
        setHeader: jest.fn(),
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of({})),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockRequest.correlationId).toBe("first-id");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("X-Correlation-Id", "first-id");
    });

    it("deve chamar o próximo handler", () => {
      const mockRequest: { headers: Record<string, string | string[]>; correlationId?: string } = {
        headers: {},
      };

      const mockResponse = {
        setHeader: jest.fn(),
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

      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
      result.subscribe((data) => {
        expect(data).toEqual({ data: "test" });
      });
    });

    it("deve preservar o correlation ID no header do request", () => {
      const existingId = "existing-id-789";
      const mockRequest: { headers: Record<string, string | string[]>; correlationId?: string } = {
        headers: {
          "x-correlation-id": existingId,
          "content-type": "application/json",
        },
      };

      const mockResponse = {
        setHeader: jest.fn(),
      };

      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler: CallHandler = {
        handle: jest.fn().mockReturnValue(of({})),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockRequest.headers["content-type"]).toBe("application/json");
      expect(mockRequest.headers["x-correlation-id"]).toBe(existingId);
    });
  });
});
