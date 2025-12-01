import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkMigrations() {
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
    
    // Verificar migrations executadas
    const migrations = await dataSource.query(`
      SELECT * FROM nexus_migrations ORDER BY id ASC
    `);

    console.log(`\n📋 Migrations registradas: ${migrations.length}\n`);
    
    if (migrations.length > 0) {
      migrations.forEach((m: any, i: number) => {
        console.log(`${i + 1}. ${m.name} (${new Date(m.timestamp).toLocaleString()})`);
      });
    }

    // Verificar tabelas criadas
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != 'nexus_migrations'
      ORDER BY table_name
    `);

    console.log(`\n📊 Tabelas criadas: ${tables.length}\n`);
    
    if (tables.length > 0) {
      tables.forEach((t: any, i: number) => {
        console.log(`${i + 1}. ${t.table_name}`);
      });
    } else {
      console.log('❌ Nenhuma tabela foi criada pelas migrations!\n');
    }

    await dataSource.destroy();

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkMigrations();
