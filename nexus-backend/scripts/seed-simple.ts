import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
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
    console.log('✅ Conectado ao banco\n');

    // Descobrir valores dos enums
    console.log('🔍 Descobrindo valores dos enums...\n');
    
    const customerTypes = await dataSource.query(`
      SELECT unnest(enum_range(NULL::customers_type_enum))::text as value
    `);
    const customerStatuses = await dataSource.query(`
      SELECT unnest(enum_range(NULL::customers_status_enum))::text as value
    `);
    const driverStatuses = await dataSource.query(`
      SELECT unnest(enum_range(NULL::drivers_status_enum))::text as value
    `);
    const vehicleStatuses = await dataSource.query(`
      SELECT unnest(enum_range(NULL::vehicles_status_enum))::text as value
    `);
    const routeTypes = await dataSource.query(`
      SELECT unnest(enum_range(NULL::route_type_enum))::text as value
    `);
    const routeStatuses = await dataSource.query(`
      SELECT unnest(enum_range(NULL::route_status_enum))::text as value
    `);
    const deliveryStatuses = await dataSource.query(`
      SELECT unnest(enum_range(NULL::delivery_status_enum))::text as value
    `);

    console.log(`Customer types: ${customerTypes.map((r: any) => r.value).join(', ')}`);
    console.log(`Driver statuses: ${driverStatuses.map((r: any) => r.value).join(', ')}`);
    console.log(`Vehicle statuses: ${vehicleStatuses.map((r: any) => r.value).join(', ')}`);
    console.log(`Route types: ${routeTypes.map((r: any) => r.value).join(', ')}`);
    console.log(`Route statuses: ${routeStatuses.map((r: any) => r.value).join(', ')}`);
    console.log(`Delivery statuses: ${deliveryStatuses.map((r: any) => r.value).join(', ')}\n`);

    // Usar os primeiros valores válidos
    const customerType = customerTypes[0]?.value || 'individual';
    const customerStatus = customerStatuses[0]?.value || 'active';
    const driverStatus = driverStatuses[0]?.value || 'available';
    const vehicleStatus = vehicleStatuses[0]?.value || 'active';
    const routeType = routeTypes[0]?.value || 'standard';
    const routeStatus = routeStatuses.find((r: any) => r.value.includes('active'))?.value || routeStatuses[0]?.value;
    const deliveryStatus = deliveryStatuses.find((r: any) => r.value === 'DELIVERED')?.value || deliveryStatuses[0]?.value;

    console.log('🌱 Iniciando população do banco...\n');

    // 1. Customers
    console.log('📦 Customers...');
    await dataSource.query(`
      INSERT INTO customers (id, tax_id, name, email, phone, type, status, category)
      VALUES 
        (uuid_generate_v4(), '12345678000100', 'Empresa ABC', 'abc@email.com', '1199999001', '${customerType}', '${customerStatus}', 'standard'),
        (uuid_generate_v4(), '98765432000199', 'Empresa XYZ', 'xyz@email.com', '1199999002', '${customerType}', '${customerStatus}', 'vip'),
        (uuid_generate_v4(), '11111111111', 'João Silva', 'joao@email.com', '1199999003', '${customerType}', '${customerStatus}', 'standard')
      ON CONFLICT DO NOTHING
    `);

    // 2. Drivers
    console.log('🚗 Drivers...');
    await dataSource.query(`
      INSERT INTO drivers (id, full_name, cpf, birth_date, phone, email, status)
      VALUES 
        (uuid_generate_v4(), 'Carlos Motorista', '11122233344', '1985-05-15', '1198888001', 'carlos@email.com', '${driverStatus}'),
        (uuid_generate_v4(), 'Maria Silva', '22233344455', '1990-08-20', '1198888002', 'maria@email.com', '${driverStatus}'),
        (uuid_generate_v4(), 'Pedro Santos', '33344455566', '1988-12-10', '1198888003', 'pedro@email.com', '${driverStatus}')
      ON CONFLICT DO NOTHING
    `);

    // 3. Vehicles
    console.log('🚚 Vehicles...');
    await dataSource.query(`
      INSERT INTO vehicles (id, license_plate, brand, model, year, vehicle_type, fuel_type, status)
      VALUES 
        (uuid_generate_v4(), 'ABC1234', 'Mercedes', 'Sprinter', 2022, 'van', 'diesel', '${vehicleStatus}'),
        (uuid_generate_v4(), 'DEF5678', 'Iveco', 'Daily', 2021, 'truck', 'diesel', '${vehicleStatus}'),
        (uuid_generate_v4(), 'GHI9012', 'Fiat', 'Ducato', 2023, 'van', 'diesel', '${vehicleStatus}')
      ON CONFLICT DO NOTHING
    `);

    // 4. Routes
    console.log('🗺️  Routes...');
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
          'RT${String(1001 + i).padStart(6, '0')}',
          'Rota ${i + 1}',
          CURRENT_DATE - ${i},
          '${routeStatus}',
          '${routeType}',
          '${drivers[i].id}',
          '${vehicles[i].id}',
          'Rua A, 100',
          'Rua B, 200',
          ${15 + i * 5},
          ${30 + i * 10}
        )
        ON CONFLICT DO NOTHING
      `);
    }

    // 5. Deliveries (sem route_id se não existir)
    console.log('📦 Deliveries...');
    const customers = await dataSource.query('SELECT id FROM customers LIMIT 3');
    
    for (let i = 0; i < 10; i++) {
      const statusIndex = i % 3;
      const status = statusIndex === 0 ? deliveryStatus : 
                     statusIndex === 1 ? 'in_transit' : 
                     'pending';
      
      await dataSource.query(`
        INSERT INTO deliveries (
          id, tracking_code, status, priority,
          customer_id,
          origin_address, destination_address,
          scheduled_date
        )
        VALUES (
          uuid_generate_v4(),
          'DEL${String(10001 + i).padStart(6, '0')}',
          '${status}',
          'normal',
          '${customers[i % 3].id}',
          'Origem ${i}',
          'Destino ${i}',
          CURRENT_DATE - ${Math.floor(i / 3)}
        )
        ON CONFLICT DO NOTHING
      `);
    }

    // Resumo
    console.log('\n📊 Contagem final:');
    const summary = await dataSource.query(`
      SELECT 'customers' as tabela, COUNT(*)::int as total FROM customers
      UNION ALL
      SELECT 'drivers', COUNT(*)::int FROM drivers
      UNION ALL
      SELECT 'vehicles', COUNT(*)::int FROM vehicles
      UNION ALL
      SELECT 'routes', COUNT(*)::int FROM routes
      UNION ALL
      SELECT 'deliveries', COUNT(*)::int FROM deliveries
    `);
    
    summary.forEach((row: any) => {
      console.log(`   ${row.tabela}: ${row.total}`);
    });

    console.log('\n✅ Banco populado com sucesso!\n');
    console.log('🎯 Teste o dashboard:');
    console.log('   http://localhost:3000/api/dashboard/overview\n');

    await dataSource.destroy();

  } catch (error: any) {
    console.error('\n❌ Erro:', error.message);
    if (error.detail) console.error('Detalhe:', error.detail);
    process.exit(1);
  }
}

seedDatabase();
