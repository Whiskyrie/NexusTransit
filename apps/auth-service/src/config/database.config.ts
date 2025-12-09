import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  url: string;
}

/**
 * Database configuration factory for TypeOrmModule
 * Uses isolated 'auth' schema
 */
export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'nexus_transit',
  
  // ISOLATED SCHEMA - All tables in 'auth' schema
  schema: 'auth',
  
  // Entities
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  
  // Sync settings (NEVER use synchronize: true in production)
  synchronize: false,
  
  // Logging
  logging: process.env.DATABASE_LOGGING === 'true',
  
  // Connection pool
  extra: {
    max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10),
    min: parseInt(process.env.DATABASE_MIN_CONNECTIONS || '2', 10),
  },
  
  // SSL settings
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    database: process.env.POSTGRES_DB ?? 'nexustransit_dev',
    username: process.env.POSTGRES_USER ?? 'nexus_user',
    password: process.env.POSTGRES_PASSWORD ?? 'nexus_password_123',
    url:
      process.env.DATABASE_URL ??
      `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}?schema=auth`,
  }),
);
