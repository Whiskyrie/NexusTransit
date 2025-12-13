import { DataSource, DataSourceOptions } from "typeorm";
import { DatabaseConfigOptions } from "./interfaces/database-options.interface";

export const createDataSourceOptions = (config: DatabaseConfigOptions): DataSourceOptions => {
  return {
    type: "postgres",
    url: config.url,
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    schema: config.schema,

    entities: config.entities || [],
    migrations: config.migrations || [],
    subscribers: config.subscribers || [],

    synchronize: config.synchronize ?? false,
    logging: config.logging ?? false,

    ssl: config.ssl ? { rejectUnauthorized: false } : false,

    extra: {
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      acquireTimeoutMillis: 60000,
      application_name: "nexus-transit",
      statement_timeout: 30000,
      ...config.extra,
    },
  };
};

export const createDataSource = (config: DatabaseConfigOptions): DataSource => {
  const options = createDataSourceOptions(config);
  return new DataSource(options);
};
