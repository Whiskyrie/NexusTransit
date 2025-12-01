import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function checkTables() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'nexustransit',
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados\n');

    const queryRunner = dataSource.createQueryRunner();
    
    // Listar todas as tabelas
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('📋 Tabelas existentes no banco:\n');
    tables.forEach((row: any, index: number) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });

    console.log(`\n📊 Total: ${tables.length} tabelas\n`);

    // Verificar tabelas necessárias para o seed
    const requiredTables = [
      'customers',
      'drivers', 
      'vehicles',
      'routes',
      'deliveries',
      'delivery_attempts'
    ];

    const existingTableNames = tables.map((t: any) => t.table_name);
    const missingTables = requiredTables.filter(t => !existingTableNames.includes(t));

    if (missingTables.length > 0) {
      console.log('❌ Tabelas faltando para o seed:');
      missingTables.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log('\n⚠️  PROBLEMA: As migrations principais não foram executadas!\n');
    } else {
      console.log('✅ Todas as tabelas necessárias existem!\n');
    }

    await queryRunner.release();
    await dataSource.destroy();

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkTables();
