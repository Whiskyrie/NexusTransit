import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../config/database.config';

/**
 * Factory function to create TypeORM DataSource
 * Follows best practices from TypeORM 0.3.x
 */
export const createDataSource = (configService: ConfigService): DataSource => {
  const dbConfig = configService.get<DatabaseConfig>('database');
  
  if (!dbConfig) {
    throw new Error('Database configuration not found');
  }

  return new DataSource({
    type: 'postgres',
    url: dbConfig.url,
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    
    // Entity configuration
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    
    // Migration configuration
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    migrationsTableName: 'nexus_migrations',
    migrationsRun: false, // Executar manualmente via CLI
    
    // PostgreSQL specific optimizations
    extra: {
      // Connection pool configuration
      max: 20, // Maximum 20 connections as per requirements
      min: 5,  // Minimum connections in pool
      idleTimeoutMillis: 30000, // 30s idle timeout
      connectionTimeoutMillis: 2000, // 2s connection timeout
      acquireTimeoutMillis: 60000, // 60s acquire timeout
      
      // PostgreSQL specific settings
      application_name: 'nexus-transit-api',
      statement_timeout: 30000, // 30s statement timeout
    },
    
    // Performance & Monitoring
    maxQueryExecutionTime: 1000, // Log queries > 1s
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error', 'schema', 'warn'] : ['error'],
    logger: 'advanced-console',
    
    // Schema management
    synchronize: false, // Never use in production
    dropSchema: false,
    
    // Cache configuration (will be setup with Redis later)
    cache: false, // Will enable Redis cache later
    
    // Security & Performance
    isolateWhereStatements: true, // Improve query security
    
    // PostgreSQL extensions
    uuidExtension: 'uuid-ossp', // For UUID generation
    installExtensions: true, // Auto-install required extensions
    
    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false, // Configure properly for production
    } : false,
  });
};

/**
 * Default DataSource instance for CLI operations
 * This is required for TypeORM CLI commands
 */
const AppDataSource = createDataSource({
  get: (key: string) => {
    // Fallback configuration for CLI when ConfigService is not available
    const configs = {
      database: {
        url: process.env.DATABASE_URL || 
             `postgresql://${process.env.POSTGRES_USER || 'nexus_user'}:${process.env.POSTGRES_PASSWORD || 'nexus_password_123'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'nexustransit_dev'}?schema=public`,
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        username: process.env.POSTGRES_USER || 'nexus_user',
        password: process.env.POSTGRES_PASSWORD || 'nexus_password_123',
        database: process.env.POSTGRES_DB || 'nexustransit_dev',
      },
    };
    return configs[key];
  },
} as ConfigService);

export default AppDataSource;
