import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config();

/**
 * TypeORM DataSource for Auth Service
 * Uses isolated 'auth' schema in PostgreSQL
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'nexustransit_dev',
  
  // ISOLATED SCHEMA - All tables in 'auth' schema (NOT public)
  schema: 'auth',
  
  // Entities
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  
  // Migrations
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  
  // Migration settings
  migrationsTableName: 'migrations',
  migrationsRun: false, // Run manually with npm run migration:run
  
  // Logging
  logging: process.env.DATABASE_LOGGING === 'true',
  
  // Connection pool
  extra: {
    max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10),
    min: parseInt(process.env.DATABASE_MIN_CONNECTIONS || '2', 10),
    // Force new connection for every query
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 5000,
  },
  
  // Sync settings (NEVER use synchronize: true in production)
  synchronize: false,
  
  // Cache settings - DISABLE to prevent stale data
  cache: false,
  
  // Disable entity result caching
  entitySkipConstructor: false,
  
  // SSL settings
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

/**
 * DataSource instance for TypeORM CLI
 */
const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
