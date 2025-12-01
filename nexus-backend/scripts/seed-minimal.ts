import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedMinimalData() {
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
    console.log('🌱 Populando banco com dados mínimos...\n');

    // 1. Criar Customers
    console.log('📦 Criando customers...');
    await dataSource.query(`
      INSERT INTO customers (id, tax_id, name, email, phone, type, status, category)
      VALUES 
        (uuid_generate_v4(), '12345678000100', 'Empresa ABC Ltda', 'contato@empresaabc.com', '11987654321', 'corporate', 'active', 'standard'),
        (uuid_generate_v4(), '98765432000199', 'Comércio XYZ SA', 'compras@xyz.com.br', '11912345678', 'corporate', 'active', 'vip'),
        (uuid_generate_v4(), '12312312399', 'João Silva', 'joao.silva@email.com', '11999887766', 'individual', 'active', 'standard')
      ON CONFLICT DO NOTHING
    `);
    console.log('   ✓ 3 customers criados\n');

    // 2. Criar Drivers
    console.log('🚗 Criando drivers...');
    await dataSource.query(`
      INSERT INTO drivers (id, full_name, cpf, birth_date, phone, email, status)
      VALUES 
        (uuid_generate_v4(), 'Carlos Motorista', '11122233344', '1985-05-15', '11987651111', 'carlos@transport.com', 'available'),
        (uuid_generate_v4(), 'Maria Condutora', '22233344455', '1990-08-22', '11987652222', 'maria@transport.com', 'available'),
        (uuid_generate_v4(), 'Pedro Dirigente', '33344455566', '1988-12-10', '11987653333', 'pedro@transport.com', 'available')
      ON CONFLICT DO NOTHING
    `);
    console.log('   ✓ 3 drivers criados\n');

    // 3. Criar Vehicles
    console.log('🚚 Criando vehicles...');
    await dataSource.query(`
      INSERT INTO vehicles (id, license_plate, brand, model, year, vehicle_type, fuel_type, status)
      VALUES 
        (uuid_generate_v4(), 'ABC1234', 'Mercedes', 'Sprinter', 2022, 'van', 'diesel', 'active'),
        (uuid_generate_v4(), 'DEF5678', 'Iveco', 'Daily', 2021, 'truck', 'diesel', 'active'),
        (uuid_generate_v4(), 'GHI9012', 'Fiat', 'Ducato', 2023, 'van', 'diesel', 'active')
      ON CONFLICT DO NOTHING
    `);
    console.log('   ✓ 3 vehicles criados\n');

    // 4. Criar Routes
    console.log('🗺️  Criando routes...');
    const drivers = await dataSource.query('SELECT id FROM drivers LIMIT 3');
    const vehicles = await dataSource.query('SELECT id FROM vehicles LIMIT 3');
    
    for (let i = 0; i < 3; i++) {
      await dataSource.query(`
        INSERT INTO routes (
          id, route_code, name, planned_date, status, type,
          driver_id, vehicle_id,
          origin_address, destination_address,
          estimated_distance_km, estimated_duration_minutes
        )
        VALUES (
          uuid_generate_v4(),
          'RT-${String(1001 + i).padStart(5, '0')}',
          'Rota ${i + 1} - Entregas Centro',
          CURRENT_DATE,
          'active',
          'urban',
          '${drivers[i].id}',
          '${vehicles[i].id}',
          'Rua Central, 100 - Centro',
          'Av. Paulista, 1000 - Bela Vista',
          ${15 + i * 5},
          ${30 + i * 10}
        )
        ON CONFLICT DO NOTHING
      `);
    }
    console.log('   ✓ 3 routes criadas\n');

    // 5. Criar Deliveries
    console.log('📦 Criando deliveries...');
    const customers = await dataSource.query('SELECT id FROM customers LIMIT 3');
    
    const statuses = ['DELIVERED', 'DELIVERED', 'IN_TRANSIT'];
    
    for (let i = 0; i < 3; i++) {
      await dataSource.query(`
        INSERT INTO deliveries (
          id, tracking_code, status, priority,
          customer_id,
          delivery_address,
          scheduled_date
        )
        VALUES (
          uuid_generate_v4(),
          'DEL-${String(10001 + i).padStart(6, '0')}',
          '${statuses[i]}',
          'NORMAL',
          '${customers[i].id}',
          'Av. Paulista, ${1000 + i * 100} - São Paulo, SP',
          CURRENT_DATE
        )
        ON CONFLICT DO NOTHING
      `);
    }
    console.log('   ✓ 3 deliveries criadas\n');

    // 6. Verificar contagem final
    console.log('📊 Contagem final:');
    const counts = await dataSource.query(`
      SELECT 
        'Customers' as tabela, COUNT(*) as total FROM customers
      UNION ALL
      SELECT 'Drivers', COUNT(*) FROM drivers
      UNION ALL
      SELECT 'Vehicles', COUNT(*) FROM vehicles
      UNION ALL
      SELECT 'Routes', COUNT(*) FROM routes
      UNION ALL
      SELECT 'Deliveries', COUNT(*) FROM deliveries
    `);
    
    counts.forEach((row: any) => {
      console.log(`   • ${row.tabela}: ${row.total}`);
    });

    console.log('\n✅ Seed concluído com sucesso!\n');
    console.log('🎯 Próximos passos:');
    console.log('   1. Inicie o servidor: npm run dev');
    console.log('   2. Acesse: http://localhost:3000/api/dashboard/overview');
    console.log('   3. Swagger: http://localhost:3000/api-docs\n');

    await dataSource.destroy();

  } catch (error: any) {
    console.error('\n❌ Erro:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

seedMinimalData();
