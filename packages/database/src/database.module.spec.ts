import { DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DatabaseModule } from "./database.module";
import { DatabaseConfigOptions } from "./interfaces/database-options.interface";

// Mock TypeOrmModule
jest.mock("@nestjs/typeorm", () => ({
  TypeOrmModule: {
    forRootAsync: jest.fn().mockReturnValue({
      module: class MockTypeOrmModule {},
      providers: [],
      exports: [],
    }),
  },
}));

describe("DatabaseModule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("forRootAsync", () => {
    const mockConfig: DatabaseConfigOptions = {
      host: "localhost",
      port: 5432,
      username: "testuser",
      password: "testpass",
      database: "testdb",
    };

    it("should return a DynamicModule", () => {
      const result = DatabaseModule.forRootAsync({
        useFactory: () => mockConfig,
      });

      expect(result).toBeDefined();
      expect(result.module).toBe(DatabaseModule);
    });

    it("should have imports array with TypeOrmModule", () => {
      const result = DatabaseModule.forRootAsync({
        useFactory: () => mockConfig,
      });

      expect(result.imports).toBeDefined();
      expect(Array.isArray(result.imports)).toBe(true);
      expect(result.imports?.length).toBeGreaterThan(0);
    });

    it("should export TypeOrmModule", () => {
      const result = DatabaseModule.forRootAsync({
        useFactory: () => mockConfig,
      });

      expect(result.exports).toBeDefined();
      expect(result.exports).toContain(TypeOrmModule);
    });

    it("should call TypeOrmModule.forRootAsync with correct structure", () => {
      DatabaseModule.forRootAsync({
        useFactory: () => mockConfig,
      });

      expect(TypeOrmModule.forRootAsync).toHaveBeenCalledTimes(1);
      expect(TypeOrmModule.forRootAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          imports: expect.any(Array),
          useFactory: expect.any(Function),
          inject: expect.any(Array),
        }),
      );
    });

    it("should pass empty imports when not provided", () => {
      DatabaseModule.forRootAsync({
        useFactory: () => mockConfig,
      });

      expect(TypeOrmModule.forRootAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          imports: [],
        }),
      );
    });

    it("should pass provided imports", () => {
      const mockImport = class MockModule {};

      DatabaseModule.forRootAsync({
        imports: [mockImport],
        useFactory: () => mockConfig,
      });

      expect(TypeOrmModule.forRootAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          imports: [mockImport],
        }),
      );
    });

    it("should pass empty inject when not provided", () => {
      DatabaseModule.forRootAsync({
        useFactory: () => mockConfig,
      });

      expect(TypeOrmModule.forRootAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          inject: [],
        }),
      );
    });

    it("should pass provided inject tokens", () => {
      const mockToken = "CONFIG_SERVICE";

      DatabaseModule.forRootAsync({
        inject: [mockToken],
        useFactory: () => mockConfig,
      });

      expect(TypeOrmModule.forRootAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          inject: [mockToken],
        }),
      );
    });

    describe("useFactory execution", () => {
      it("should execute synchronous useFactory correctly", async () => {
        DatabaseModule.forRootAsync({
          useFactory: () => mockConfig,
        });

        // Get the useFactory that was passed to TypeOrmModule.forRootAsync
        const call = (TypeOrmModule.forRootAsync as jest.Mock).mock.calls[0][0];
        const result = await call.useFactory();

        expect(result).toBeDefined();
        expect(result.type).toBe("postgres");
        expect(result.host).toBe("localhost");
      });

      it("should execute asynchronous useFactory correctly", async () => {
        DatabaseModule.forRootAsync({
          useFactory: async () => {
            return Promise.resolve(mockConfig);
          },
        });

        const call = (TypeOrmModule.forRootAsync as jest.Mock).mock.calls[0][0];
        const result = await call.useFactory();

        expect(result).toBeDefined();
        expect(result.type).toBe("postgres");
        expect(result.host).toBe("localhost");
      });

      it("should pass arguments to useFactory", async () => {
        const mockConfigService = { get: jest.fn().mockReturnValue("value") };

        DatabaseModule.forRootAsync({
          inject: ["ConfigService"],
          useFactory: (configService: typeof mockConfigService) => {
            configService.get("DB_HOST");
            return mockConfig;
          },
        });

        const call = (TypeOrmModule.forRootAsync as jest.Mock).mock.calls[0][0];
        await call.useFactory(mockConfigService);

        expect(mockConfigService.get).toHaveBeenCalledWith("DB_HOST");
      });

      it("should include autoLoadEntities in the result when provided", async () => {
        const configWithAutoLoad: DatabaseConfigOptions = {
          ...mockConfig,
          autoLoadEntities: true,
        };

        DatabaseModule.forRootAsync({
          useFactory: () => configWithAutoLoad,
        });

        const call = (TypeOrmModule.forRootAsync as jest.Mock).mock.calls[0][0];
        const result = await call.useFactory();

        expect(result.autoLoadEntities).toBe(true);
      });

      it("should apply createDataSourceOptions transformation", async () => {
        const configWithSsl: DatabaseConfigOptions = {
          ...mockConfig,
          ssl: true,
          extra: { max: 50 },
        };

        DatabaseModule.forRootAsync({
          useFactory: () => configWithSsl,
        });

        const call = (TypeOrmModule.forRootAsync as jest.Mock).mock.calls[0][0];
        const result = await call.useFactory();

        // Verify SSL transformation
        expect(result.ssl).toEqual({ rejectUnauthorized: false });

        // Verify extra options merging
        expect(result.extra.max).toBe(50);
        expect(result.extra.min).toBe(5); // default value
        expect(result.extra.application_name).toBe("nexus-transit");
      });
    });

    describe("module structure validation", () => {
      it("should have correct module structure", () => {
        const result: DynamicModule = DatabaseModule.forRootAsync({
          useFactory: () => mockConfig,
        });

        // Check module property
        expect(result.module).toBe(DatabaseModule);

        // Check imports is an array
        expect(Array.isArray(result.imports)).toBe(true);

        // Check exports contains TypeOrmModule
        expect(result.exports).toContain(TypeOrmModule);
      });

      it("should work with multiple inject tokens", () => {
        const tokens = ["ConfigService", "LoggerService", "CacheService"];

        DatabaseModule.forRootAsync({
          inject: tokens,
          useFactory: () => mockConfig,
        });

        expect(TypeOrmModule.forRootAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            inject: tokens,
          }),
        );
      });

      it("should work with multiple imports", () => {
        const imports = [class ConfigModule {}, class LoggerModule {}];

        DatabaseModule.forRootAsync({
          imports,
          useFactory: () => mockConfig,
        });

        expect(TypeOrmModule.forRootAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            imports,
          }),
        );
      });
    });
  });
});
