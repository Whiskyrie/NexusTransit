import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function setupDatabase() {
  // Conectar ao banco 'postgres' (padrão) para criar o nexustransit
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // Conectar ao banco padrão
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL\n');

    // Verificar se o banco já existe
    const checkDb = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = 'nexustransit'
    `);

    if (checkDb.rows.length > 0) {
      console.log('ℹ️  Banco "nexustransit" já existe');
      
      // Encerrar conexões existentes
      console.log('🔄 Encerrando conexões existentes...');
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = 'nexustransit'
          AND pid <> pg_backend_pid()
      `);

      // Dropar e recriar
      console.log('🗑️  Removendo banco antigo...');
      await client.query('DROP DATABASE IF EXISTS nexustransit');
    }

    // Criar banco
    console.log('📦 Criando banco "nexustransit"...');
    await client.query('CREATE DATABASE nexustransit');

    console.log('✅ Banco "nexustransit" criado com sucesso!\n');

    // Conectar ao novo banco para criar extensões
    await client.end();
    
    const nexusClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'nexustransit',
    });

    await nexusClient.connect();
    console.log('✅ Conectado ao banco "nexustransit"');

    // Criar extensões necessárias
    console.log('🔧 Criando extensões...');
    await nexusClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('   - uuid-ossp ✓');

    await nexusClient.end();

    console.log('\n✅ Setup do banco concluído com sucesso!\n');
    console.log('📋 Próximos passos:');
    console.log('1. Execute as migrations: npm run migration:run');
    console.log('2. Verifique as tabelas criadas');
    console.log('3. Popule com dados de teste usando os scripts SQL\n');

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

setupDatabase();
