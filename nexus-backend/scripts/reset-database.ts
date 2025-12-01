import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function resetMigrations() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'nexustransit',
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados\n');

    // Dropar tabela de migrations
    console.log('🗑️  Removendo tabela de migrations...');
    await dataSource.query('DROP TABLE IF EXISTS nexus_migrations CASCADE');
    console.log('✅ Tabela removida\n');

    // Dropar todas as tabelas
    console.log('🗑️  Removendo todas as tabelas...');
    const tables = await dataSource.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    for (const table of tables) {
      await dataSource.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
      console.log(`   - ${table.tablename} ✓`);
    }

    // Dropar todos os tipos enum
    console.log('\n🗑️  Removendo tipos enum...');
    const enums = await dataSource.query(`
      SELECT t.typname
      FROM pg_type t 
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
      WHERE n.nspname = 'public' 
        AND t.typtype = 'e'
    `);

    for (const enumType of enums) {
      await dataSource.query(`DROP TYPE IF EXISTS "${enumType.typname}" CASCADE`);
      console.log(`   - ${enumType.typname} ✓`);
    }

    await dataSource.destroy();

    console.log('\n✅ Banco limpo com sucesso!');
    console.log('\n📋 Próximo passo:');
    console.log('Execute: npm run migration:run\n');

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

resetMigrations();
