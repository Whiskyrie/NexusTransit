import { DataSource } from 'typeorm';
import type { ConfigService } from '@nestjs/config';
import type { DatabaseConfig } from '../config/database.config';
import path from 'path';

/*
  Cria e configura uma instância de DataSource do TypeORM
*/
export const createDataSource = (configService: ConfigService): DataSource => {
  const dbConfig = configService.get<DatabaseConfig>('database');

  if (!dbConfig) {
    throw new Error('Configuração do banco de dados não encontrada');
  }

  return new DataSource({
    type: 'postgres',
    url: dbConfig.url,
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,

    // Configuração de entidades
    entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    subscribers: [path.join(__dirname, '..', '**', '*.subscriber{.ts,.js}')],

    // Configuração de migrações
    migrations: [path.join(__dirname, 'migrations', '*{.ts,.js}')],
    migrationsTableName: 'nexus_migrations',
    migrationsRun: false, // Migrações devem ser executadas manualmente via CLI
    migrationsTransactionMode: 'each', // Cada migração é executada em uma transação separada

    // Otimizações específicas do PostgreSQL
    extra: {
      // Configurações do pool de conexões
      max: 20, // Máximo de 20 conexões simultâneas conforme requisitos
      min: 5, // Número mínimo de conexões mantidas no pool
      idleTimeoutMillis: 30000, // Fecha conexões ociosas após 30 segundos
      connectionTimeoutMillis: 2000, // Timeout para estabelecer novas conexões (2 segundos)
      acquireTimeoutMillis: 60000, // Timeout para adquirir uma conexão do pool (60 segundos)

      // Configurações específicas do PostgreSQL
      application_name: 'nexus-transit-api',
      statement_timeout: 30000, // Cancela consultas que demoram mais de 30 segundos
    },

    // Performance & Monitoramento
    maxQueryExecutionTime: 1000, // Loga consultas que demoram mais de 1 segundo
    logging:
      process.env.NODE_ENV === 'development' ? ['query', 'error', 'schema', 'warn'] : ['error'],
    logger: 'advanced-console',

    // Gerenciamento de schema
    synchronize: false, // Nunca sincroniza schema automaticamente em produção
    dropSchema: false,

    // Configuração de cache (integração com Redis planejada)
    cache: false, // Será habilitado com cache Redis no futuro

    // Segurança & Performance
    isolateWhereStatements: true, // Melhora a segurança das consultas isolando cláusulas WHERE

    // Extensões do PostgreSQL
    uuidExtension: 'uuid-ossp', // Habilita suporte para geração de UUID
    installExtensions: true, // Instala automaticamente as extensões necessárias do PostgreSQL

    // Configuração SSL para ambiente de produção
    ssl:
      process.env.NODE_ENV === 'production'
        ? {
            rejectUnauthorized: false, // TODO: Configurar adequadamente para produção com certificados válidos
          }
        : false,
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
