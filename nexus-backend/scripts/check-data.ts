import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkDataAndSummary() {
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

    // Verificar contagem em cada tabela principal
    const tables = [
      'customers',
      'drivers',
      'vehicles',
      'routes',
      'deliveries',
      'delivery_attempts'
    ];

    console.log('📊 Status das Tabelas:\n');

    for (const table of tables) {
      const result = await dataSource.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = parseInt(result[0].count);
      const status = count > 0 ? '✅' : '⚠️';
      console.log(`${status} ${table.padEnd(20)} ${count} registros`);
    }

    console.log('\n' + '='.repeat(50));
    
    const totalCustomers = await dataSource.query('SELECT COUNT(*) as count FROM customers');
    const totalDrivers = await dataSource.query('SELECT COUNT(*) as count FROM drivers');
    const totalVehicles = await dataSource.query('SELECT COUNT(*) as count FROM vehicles');
    //const totalRoutes = await dataSource.query('SELECT COUNT(*) as count FROM routes');
    //const totalDeliveries = await dataSource.query('SELECT COUNT(*) as count FROM deliveries');
    
    const hasData = parseInt(totalCustomers[0].count) > 0 || 
                    parseInt(totalDrivers[0].count) > 0 ||
                    parseInt(totalVehicles[0].count) > 0;

    if (!hasData) {
      console.log('\n⚠️  BANCO VAZIO - É necessário popular com dados de teste\n');
      console.log('💡 Você pode:\n');
      console.log('1. Usar a interface do Swagger para criar registros manualmente');
      console.log('2. Executar o seed SQL diretamente no banco:');
      console.log('   psql -U postgres -d nexustransit -f scripts/seed-dashboard-data.sql');
      console.log('3. Usar uma ferramenta como DBeaver ou pgAdmin para executar o SQL\n');
    } else {
      console.log('\n✅ Banco de dados contém dados!\n');
      console.log('📋 Você pode testar o dashboard em:');
      console.log('   http://localhost:3000/api/dashboard/overview');
      console.log('   http://localhost:3000/api-docs (Swagger UI)\n');
    }

    await dataSource.destroy();

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkDataAndSummary();
