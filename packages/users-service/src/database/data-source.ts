import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

/**
 * TypeORM Data Source Configuration
 * Usado para executar migrations via CLI
 * 
 * Comandos:
 * - npm run migration:generate -- src/database/migrations/MigrationName
 * - npm run migration:run
 * - npm run migration:revert
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'nexustransit_users',
  password: process.env.DB_PASSWORD || 'nexustransit_users_pass',
  database: process.env.DB_DATABASE || 'nexustransit_users_db',
  entities: [User],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
