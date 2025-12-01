import { DataSource } from 'typeorm';
import { configDotenv } from 'dotenv';

configDotenv();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'nexustransit',
});

async function checkDashboardData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco de dados\n');

    // Verificar entregas
    const deliveriesCount = await AppDataSource.query(
      `SELECT 
        COUNT(*) as total,
        status,
        COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'IN_TRANSIT') as in_transit
      FROM deliveries 
      WHERE deleted_at IS NULL
      GROUP BY status`
    );
    
    const totalDeliveries = await AppDataSource.query(
      'SELECT COUNT(*) as count FROM deliveries WHERE deleted_at IS NULL'
    );

    console.log('📦 ENTREGAS:');
    console.log(`   Total: ${totalDeliveries[0]?.count || 0}`);
    console.log('   Por Status:');
    deliveriesCount.forEach((row: any) => {
      console.log(`   - ${row.status}: ${row.total}`);
    });
    console.log('');

    // Verificar motoristas
    const driversCount = await AppDataSource.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE status = 'available') as available,
        COUNT(*) FILTER (WHERE status = 'on_route') as on_route
      FROM drivers
      WHERE deleted_at IS NULL`
    );

    console.log('🚗 MOTORISTAS:');
    console.log(`   Total: ${driversCount[0]?.total || 0}`);
    console.log(`   Ativos: ${driversCount[0]?.active || 0}`);
    console.log(`   Disponíveis: ${driversCount[0]?.available || 0}`);
    console.log(`   Em Rota: ${driversCount[0]?.on_route || 0}`);
    console.log('');

    // Verificar veículos
    const vehiclesCount = await AppDataSource.query(
      `SELECT 
        COUNT(*) as total,
        status,
        COUNT(*) as count
      FROM vehicles
      WHERE deleted_at IS NULL
      GROUP BY status`
    );

    const totalVehicles = await AppDataSource.query(
      'SELECT COUNT(*) as count FROM vehicles WHERE deleted_at IS NULL'
    );

    console.log('🚚 VEÍCULOS:');
    console.log(`   Total: ${totalVehicles[0]?.count || 0}`);
    console.log('   Por Status:');
    vehiclesCount.forEach((row: any) => {
      console.log(`   - ${row.status}: ${row.count}`);
    });
    console.log('');

    // Verificar rotas
    const routesCount = await AppDataSource.query(
      `SELECT 
        COUNT(*) as total,
        status,
        COUNT(*) as count
      FROM routes
      WHERE deleted_at IS NULL
      GROUP BY status`
    );

    const totalRoutes = await AppDataSource.query(
      'SELECT COUNT(*) as count FROM routes WHERE deleted_at IS NULL'
    );

    console.log('🗺️  ROTAS:');
    console.log(`   Total: ${totalRoutes[0]?.count || 0}`);
    console.log('   Por Status:');
    routesCount.forEach((row: any) => {
      console.log(`   - ${row.status}: ${row.count}`);
    });
    console.log('');

    // Verificar dados financeiros
    const financialData = await AppDataSource.query(
      `SELECT 
        COUNT(*) as total_deliveries,
        SUM(delivery_fee) as total_revenue,
        SUM(total_cost) as total_cost,
        AVG(delivery_fee) as avg_fee
      FROM deliveries
      WHERE deleted_at IS NULL AND status = 'DELIVERED'`
    );

    console.log('💰 DADOS FINANCEIROS (Entregas Concluídas):');
    console.log(`   Total de Entregas: ${financialData[0]?.total_deliveries || 0}`);
    console.log(`   Receita Total: R$ ${parseFloat(financialData[0]?.total_revenue || 0).toFixed(2)}`);
    console.log(`   Custo Total: R$ ${parseFloat(financialData[0]?.total_cost || 0).toFixed(2)}`);
    console.log(`   Taxa Média: R$ ${parseFloat(financialData[0]?.avg_fee || 0).toFixed(2)}`);
    console.log('');

    // Verificar datas
    const dateRanges = await AppDataSource.query(
      `SELECT 
        MIN(created_at) as primeira_entrega,
        MAX(created_at) as ultima_entrega
      FROM deliveries
      WHERE deleted_at IS NULL`
    );

    console.log('📅 PERÍODO DOS DADOS:');
    console.log(`   Primeira Entrega: ${dateRanges[0]?.primeira_entrega || 'N/A'}`);
    console.log(`   Última Entrega: ${dateRanges[0]?.ultima_entrega || 'N/A'}`);
    console.log('');

    // Verificar últimos 30 dias
    const last30Days = await AppDataSource.query(
      `SELECT COUNT(*) as count 
       FROM deliveries 
       WHERE deleted_at IS NULL 
       AND created_at >= NOW() - INTERVAL '30 days'`
    );

    console.log('📊 ÚLTIMOS 30 DIAS:');
    console.log(`   Entregas: ${last30Days[0]?.count || 0}`);
    console.log('');

    if (totalDeliveries[0]?.count === '0' || totalDeliveries[0]?.count === 0) {
      console.log('⚠️  AVISO: Não há dados no banco de dados!');
      console.log('   Execute um dos scripts de seed para popular o banco:');
      console.log('   - pnpm run seed:minimal');
      console.log('   - pnpm run seed:simple');
      console.log('   - pnpm run seed:deliveries');
    } else {
      console.log('✅ Banco de dados contém dados!');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

checkDashboardData();
