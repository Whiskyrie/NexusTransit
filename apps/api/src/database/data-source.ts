import { DataSource } from 'typeorm';
import type { ConfigService } from '@nestjs/config';
import type { DatabaseConfig } from '../config/database.config';
import { createDataSource as createNexusDataSource } from '@nexus/database';
import path from 'path';

/*
  Cria e configura uma instância de DataSource do TypeORM
*/
export const createDataSource = (configService: ConfigService): DataSource => {
  const dbConfig = configService.get<DatabaseConfig>('database');

  if (!dbConfig) {
    throw new Error('Configuração do banco de dados não encontrada');
  }

  return createNexusDataSource({
    ...dbConfig,
    entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    subscribers: [path.join(__dirname, '..', '**', '*.subscriber{.ts,.js}')],
    migrations: [path.join(__dirname, 'migrations', '*{.ts,.js}')],
    extra: {
      application_name: 'nexus-transit-api',
      migrationsTableName: 'nexus_migrations',
      migrationsRun: false,
      migrationsTransactionMode: 'each',
    },
  });
};

/**
 * Instância padrão do DataSource para operações CLI do TypeORM
 * Esta instância é necessária para executar comandos CLI como migrações
 */
const AppDataSource = createDataSource({
  get: (key: string) => {
    // Configuração de fallback quando ConfigService não está disponível (contexto CLI)
    const configs: Record<string, DatabaseConfig> = {
      database: {
        url:
          process.env.DATABASE_URL ??
          `postgresql://${process.env.POSTGRES_USER ?? 'nexus_user'}:${process.env.POSTGRES_PASSWORD ?? 'nexus_password_123'}@${process.env.POSTGRES_HOST ?? 'localhost'}:${process.env.POSTGRES_PORT ?? '5432'}/${process.env.POSTGRES_DB ?? 'nexustransit_dev'}?schema=public`,
        host: process.env.POSTGRES_HOST ?? 'localhost',
        port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
        username: process.env.POSTGRES_USER ?? 'nexus_user',
        password: process.env.POSTGRES_PASSWORD ?? 'nexus_password_123',
        database: process.env.POSTGRES_DB ?? 'nexustransit_dev',
      },
    };
    return configs[key];
  },
} as ConfigService);

export default AppDataSource;
