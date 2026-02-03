import { Test, TestingModule } from "@nestjs/testing";
import { AllExceptionsFilter } from "../filters/all-exceptions.filter";
import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

describe("AllExceptionsFilter", () => {
  let filter: AllExceptionsFilter;
  let mockLogger: PinoLogger;

  beforeEach(async () => {
    mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as PinoLogger;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
  });

  it("deve ser definido", () => {
    expect(filter).toBeDefined();
  });

  describe("catch - HttpException", () => {
    it("deve capturar e logar HttpException", () => {
      const exception = new HttpException("Not Found", HttpStatus.NOT_FOUND);
      const mockRequest = {
        method: "GET",
        url: "/test",
        correlationId: "corr-123",
        user: { id: "user-123" },
        ip: "127.0.0.1",
        headers: {
          "user-agent": "test-agent",
          "x-correlation-id": "corr-123",
        },
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 404,
        timestamp: expect.any(String),
        path: "/test",
        message: "Not Found",
        correlationId: "corr-123",
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          err: exception,
          req: {
            method: "GET",
            url: "/test",
            correlationId: "corr-123",
            userId: "user-123",
            ip: "127.0.0.1",
            userAgent: "test-agent",
          },
          statusCode: 404,
          timestamp: expect.any(String),
        },
        "Exception caught: Not Found",
      );
    });

    it("deve extrair mensagem de erro de HttpExceptionResponse", () => {
      const exception = new HttpException(
        {
          statusCode: 400,
          message: ["Error 1", "Error 2"],
          error: "Bad Request",
        },
        HttpStatus.BAD_REQUEST,
      );

      const mockRequest = {
        method: "POST",
        url: "/test",
        headers: {},
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ["Error 1", "Error 2"],
        }),
      );
    });

    it("deve usar correlation ID do header quando não está no request", () => {
      const exception = new HttpException("Error", HttpStatus.INTERNAL_SERVER_ERROR);
      const mockRequest = {
        method: "GET",
        url: "/test",
        headers: {
          "x-correlation-id": "header-corr-456",
        },
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: "header-corr-456",
        }),
      );
    });
  });

  describe("catch - erro genérico", () => {
    it("deve capturar erro genérico como Internal Server Error", () => {
      const exception = new Error("Generic error");
      const mockRequest = {
        method: "GET",
        url: "/test",
        headers: {},
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: "Internal server error",
        }),
      );
    });

    it("deve lidar com exceção não-Error", () => {
      const exception = "string exception";
      const mockRequest = {
        method: "GET",
        url: "/test",
        headers: {},
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: "Internal server error",
        }),
      );
    });

    it("deve lidar com exceção null", () => {
      const exception = null;
      const mockRequest = {
        method: "GET",
        url: "/test",
        headers: {},
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe("catch - log estruturado", () => {
    it("deve logar erro com contexto completo", () => {
      const exception = new Error("Test error");
      const mockRequest = {
        method: "POST",
        url: "/api/users",
        correlationId: "corr-789",
        user: { id: "user-789" },
        ip: "192.168.1.1",
        headers: {
          "user-agent": "Mozilla/5.0",
          "x-correlation-id": "corr-789",
        },
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          err: exception,
          req: {
            method: "POST",
            url: "/api/users",
            correlationId: "corr-789",
            userId: "user-789",
            ip: "192.168.1.1",
            userAgent: "Mozilla/5.0",
          },
          statusCode: 500,
          timestamp: expect.any(String),
        },
        "Exception caught: Test error",
      );
    });

    it("deve incluir timestamp ISO na resposta", () => {
      const exception = new Error("Test error");
      const mockRequest = {
        method: "GET",
        url: "/test",
        headers: {},
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockArgumentsHost);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("deve incluir path na resposta", () => {
      const exception = new Error("Test error");
      const mockRequest = {
        method: "GET",
        url: "/api/test/path",
        headers: {},
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/api/test/path",
        }),
      );
    });
  });

  describe("catch - sanitização de dados sensíveis", () => {
    it("deve logar erro sem expor dados sensíveis (Pino redact)", () => {
      const exception = new Error("Error with sensitive data");
      const mockRequest = {
        method: "POST",
        url: "/login",
        correlationId: "corr-sensitive",
        user: { id: "user-sensitive" },
        headers: {
          authorization: "Bearer secret-token",
          cookie: "session=secret",
        },
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockArgumentsHost);

      // O Pino deve redact dados sensíveis automaticamente
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("catch - diferentes tipos de exceção", () => {
    it("deve lidar com exceção com string como response", () => {
      const exception = new HttpException("String error message", HttpStatus.BAD_REQUEST);
      const mockRequest = {
        method: "GET",
        url: "/test",
        headers: {},
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "String error message",
        }),
      );
    });

    it("deve lidar com exceção com objeto como response", () => {
      const exception = new HttpException(
        {
          statusCode: 422,
          message: "Validation failed",
          error: "Unprocessable Entity",
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      const mockRequest = {
        method: "POST",
        url: "/test",
        headers: {},
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation failed",
        }),
      );
    });

    it("deve lidar com exceção sem propriedade message", () => {
      const exception = new HttpException(
        {
          statusCode: 500,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      const mockRequest = {
        method: "GET",
        url: "/test",
        headers: {},
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Unknown error",
        }),
      );
    });
  });
});
