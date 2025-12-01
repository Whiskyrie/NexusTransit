import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';

/**
 * Database Configuration - PostgreSQL dedicado do microsserviço
 * Mantém compatibilidade com estrutura do monólito
 */
export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    username: process.env.DB_USERNAME || 'nexustransit_users',
    password: process.env.DB_PASSWORD || 'nexustransit_users_pass',
    database: process.env.DB_DATABASE || 'nexustransit_users_db',
    entities: [User],
    synchronize: false, // Sempre false em produção - usar migrations
    logging: process.env.NODE_ENV === 'development',
    migrations: ['dist/database/migrations/*.js'],
    migrationsTableName: 'migrations',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  }),
);
