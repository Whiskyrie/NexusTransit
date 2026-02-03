import { Logger } from "@nestjs/common";

// Mock do console para evitar poluição nos testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock do Pino Logger
jest.mock("nestjs-pino", () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    silent: jest.fn(),
    logger: {
      child: jest.fn().mockReturnThis(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  })),
  PinoLogger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    logger: {
      child: jest.fn().mockReturnThis(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  })),
  LoggerModule: {
    forRoot: jest.fn().mockReturnValue({
      module: jest.fn(),
      imports: [],
      providers: [],
      exports: [],
    }),
    forRootAsync: jest.fn().mockReturnValue({
      module: jest.fn(),
      imports: [],
      providers: [],
      exports: [],
    }),
  },
}));

// Mock do pino com stdSerializers
jest.mock("pino", () => ({
  default: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  }),
  stdSerializers: {
    req: jest.fn(),
    res: jest.fn(),
    err: jest.fn(),
  },
  stdTimeFunctions: {
    isoTime: jest.fn(),
  },
}));

// Mock do pino-http
jest.mock("pino-http", () => ({
  default: jest.fn().mockReturnValue((req: unknown, res: unknown, next: () => void) => {
    next();
  }),
}));

// Mock do uuid
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-correlation-id-123"),
}));

// Mock do process.memoryUsage para testes de métricas
const originalMemoryUsage = process.memoryUsage;
const mockMemoryUsage = () => ({
  heapUsed: 100 * 1024 * 1024,
  heapTotal: 200 * 1024 * 1024,
  external: 10 * 1024 * 1024,
  rss: 150 * 1024 * 1024,
  arrayBuffers: 0,
});
process.memoryUsage = mockMemoryUsage as typeof process.memoryUsage;

// Mock do process.uptime para testes de métricas
const originalUptime = process.uptime;
process.uptime = jest.fn(() => 3600);

// Cleanup após os testes
afterAll(() => {
  process.memoryUsage = originalMemoryUsage;
  process.uptime = originalUptime;
});
