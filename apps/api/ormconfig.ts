import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'nexustransit_dev',
  username: process.env.POSTGRES_USER || 'nexus_user',
  password: process.env.POSTGRES_PASSWORD || 'nexus_password_123',

  // Entity configuration para CLI
  entities: ['src/**/*.entity.ts'],

  // Migration configuration
  migrations: ['src/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'nexus_migrations',
  migrationsRun: false,
  migrationsTransactionMode: 'each',

  // CLI specific settings
  synchronize: false,
  dropSchema: false,
  logging: ['error', 'migration'],
  logger: 'advanced-console',

  // PostgreSQL specific optimizations
  extra: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    acquireTimeoutMillis: 60000,
    application_name: 'nexus-transit-cli',
    statement_timeout: 30000,
  },
});
