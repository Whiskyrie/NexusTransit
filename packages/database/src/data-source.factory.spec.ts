import { DataSource } from "typeorm";
import { createDataSourceOptions, createDataSource } from "./data-source.factory";
import { DatabaseConfigOptions } from "./interfaces/database-options.interface";

describe("DataSourceFactory", () => {
  describe("createDataSourceOptions", () => {
    const minimalConfig: DatabaseConfigOptions = {
      host: "localhost",
      port: 5432,
      username: "testuser",
      password: "testpass",
      database: "testdb",
    };

    describe("basic configuration", () => {
      it("should create options with minimal configuration", () => {
        const options = createDataSourceOptions(minimalConfig);

        expect(options.type).toBe("postgres");
        expect(options.host).toBe("localhost");
        expect(options.port).toBe(5432);
        expect(options.username).toBe("testuser");
        expect(options.password).toBe("testpass");
        expect(options.database).toBe("testdb");
      });

      it("should set url when provided", () => {
        const config: DatabaseConfigOptions = {
          ...minimalConfig,
          url: "postgresql://user:pass@host:5432/db",
        };

        const options = createDataSourceOptions(config);

        expect(options.url).toBe("postgresql://user:pass@host:5432/db");
      });

      it("should set schema when provided", () => {
        const config: DatabaseConfigOptions = {
          ...minimalConfig,
          schema: "custom_schema",
        };

        const options = createDataSourceOptions(config);

        expect(options.schema).toBe("custom_schema");
      });
    });

    describe("entities, migrations and subscribers", () => {
      it("should use empty arrays when not provided", () => {
        const options = createDataSourceOptions(minimalConfig);

        expect(options.entities).toEqual([]);
        expect(options.migrations).toEqual([]);
        expect(options.subscribers).toEqual([]);
      });

      it("should use provided arrays", () => {
        const config: DatabaseConfigOptions = {
          ...minimalConfig,
          entities: ["src/**/*.entity.ts"],
          migrations: ["src/migrations/*.ts"],
          subscribers: ["src/**/*.subscriber.ts"],
        };

        const options = createDataSourceOptions(config);

        expect(options.entities).toEqual(["src/**/*.entity.ts"]);
        expect(options.migrations).toEqual(["src/migrations/*.ts"]);
        expect(options.subscribers).toEqual(["src/**/*.subscriber.ts"]);
      });
    });

    describe("default values", () => {
      it("should default synchronize to false", () => {
        const options = createDataSourceOptions(minimalConfig);

        expect(options.synchronize).toBe(false);
      });

      it("should default logging to false", () => {
        const options = createDataSourceOptions(minimalConfig);

        expect(options.logging).toBe(false);
      });

      it("should use provided synchronize value", () => {
        const config: DatabaseConfigOptions = {
          ...minimalConfig,
          synchronize: true,
        };

        const options = createDataSourceOptions(config);

        expect(options.synchronize).toBe(true);
      });

      it("should use provided logging value", () => {
        const config: DatabaseConfigOptions = {
          ...minimalConfig,
          logging: true,
        };

        const options = createDataSourceOptions(config);

        expect(options.logging).toBe(true);
      });
    });

    describe("SSL configuration", () => {
      it("should disable SSL when ssl is false", () => {
        const config: DatabaseConfigOptions = {
          ...minimalConfig,
          ssl: false,
        };

        const options = createDataSourceOptions(config);

        expect(options.ssl).toBe(false);
      });

      it("should disable SSL when ssl is undefined", () => {
        const options = createDataSourceOptions(minimalConfig);

        expect(options.ssl).toBe(false);
      });

      it("should enable SSL with rejectUnauthorized false when ssl is true", () => {
        const config: DatabaseConfigOptions = {
          ...minimalConfig,
          ssl: true,
        };

        const options = createDataSourceOptions(config);

        expect(options.ssl).toEqual({ rejectUnauthorized: false });
      });
    });

    describe("connection pool configuration", () => {
      it("should set default pool options in extra", () => {
        const options = createDataSourceOptions(minimalConfig);

        expect(options.extra).toBeDefined();
        expect(options.extra?.max).toBe(20);
        expect(options.extra?.min).toBe(5);
        expect(options.extra?.idleTimeoutMillis).toBe(30000);
        expect(options.extra?.connectionTimeoutMillis).toBe(2000);
        expect(options.extra?.acquireTimeoutMillis).toBe(60000);
        expect(options.extra?.application_name).toBe("nexus-transit");
        expect(options.extra?.statement_timeout).toBe(30000);
      });

      it("should merge custom extra options with defaults", () => {
        const config: DatabaseConfigOptions = {
          ...minimalConfig,
          extra: {
            max: 50,
            custom_option: "custom_value",
          },
        };

        const options = createDataSourceOptions(config);

        // Custom values should override defaults
        expect(options.extra?.max).toBe(50);
        expect(options.extra?.custom_option).toBe("custom_value");

        // Default values should still be present
        expect(options.extra?.min).toBe(5);
        expect(options.extra?.application_name).toBe("nexus-transit");
      });

      it("should allow overriding all pool options", () => {
        const config: DatabaseConfigOptions = {
          ...minimalConfig,
          extra: {
            max: 100,
            min: 10,
            idleTimeoutMillis: 60000,
            connectionTimeoutMillis: 5000,
            acquireTimeoutMillis: 120000,
            application_name: "custom-app",
            statement_timeout: 60000,
          },
        };

        const options = createDataSourceOptions(config);

        expect(options.extra?.max).toBe(100);
        expect(options.extra?.min).toBe(10);
        expect(options.extra?.idleTimeoutMillis).toBe(60000);
        expect(options.extra?.connectionTimeoutMillis).toBe(5000);
        expect(options.extra?.acquireTimeoutMillis).toBe(120000);
        expect(options.extra?.application_name).toBe("custom-app");
        expect(options.extra?.statement_timeout).toBe(60000);
      });
    });

    describe("full configuration", () => {
      it("should handle complete configuration object", () => {
        const fullConfig: DatabaseConfigOptions = {
          host: "production-host",
          port: 5433,
          username: "prod_user",
          password: "prod_pass",
          database: "prod_db",
          schema: "public",
          url: "postgresql://prod_user:prod_pass@production-host:5433/prod_db",
          synchronize: false,
          logging: true,
          entities: ["dist/**/*.entity.js"],
          migrations: ["dist/migrations/*.js"],
          subscribers: ["dist/**/*.subscriber.js"],
          ssl: true,
          extra: {
            max: 30,
            statement_timeout: 45000,
          },
        };

        const options = createDataSourceOptions(fullConfig);

        expect(options.type).toBe("postgres");
        expect(options.host).toBe("production-host");
        expect(options.port).toBe(5433);
        expect(options.username).toBe("prod_user");
        expect(options.password).toBe("prod_pass");
        expect(options.database).toBe("prod_db");
        expect(options.schema).toBe("public");
        expect(options.url).toBe("postgresql://prod_user:prod_pass@production-host:5433/prod_db");
        expect(options.synchronize).toBe(false);
        expect(options.logging).toBe(true);
        expect(options.entities).toEqual(["dist/**/*.entity.js"]);
        expect(options.migrations).toEqual(["dist/migrations/*.js"]);
        expect(options.subscribers).toEqual(["dist/**/*.subscriber.js"]);
        expect(options.ssl).toEqual({ rejectUnauthorized: false });
        expect(options.extra?.max).toBe(30);
        expect(options.extra?.statement_timeout).toBe(45000);
        expect(options.extra?.min).toBe(5); // default preserved
      });
    });
  });

  describe("createDataSource", () => {
    const testConfig: DatabaseConfigOptions = {
      host: "localhost",
      port: 5432,
      username: "testuser",
      password: "testpass",
      database: "testdb",
    };

    it("should return a DataSource instance", () => {
      const dataSource = createDataSource(testConfig);

      expect(dataSource).toBeInstanceOf(DataSource);
    });

    it("should create DataSource with correct options", () => {
      const dataSource = createDataSource(testConfig);

      expect(dataSource.options.type).toBe("postgres");
      expect(dataSource.options.host).toBe("localhost");
      expect(dataSource.options.port).toBe(5432);
      expect(dataSource.options.username).toBe("testuser");
      expect(dataSource.options.database).toBe("testdb");
    });

    it("should create DataSource with SSL enabled", () => {
      const configWithSsl: DatabaseConfigOptions = {
        ...testConfig,
        ssl: true,
      };

      const dataSource = createDataSource(configWithSsl);

      expect(dataSource.options.ssl).toEqual({ rejectUnauthorized: false });
    });

    it("should not be initialized by default", () => {
      const dataSource = createDataSource(testConfig);

      expect(dataSource.isInitialized).toBe(false);
    });
  });
});
