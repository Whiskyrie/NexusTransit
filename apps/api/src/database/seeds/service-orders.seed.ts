import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Seed para criar dados de teste de Service Orders
 *
 * Execução:
 *   ts-node --project tsconfig.migration.json -r tsconfig-paths/register src/database/seeds/service-orders.seed.ts
 */

async function seedServiceOrders() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'nexustransit_dev',
    username: process.env.POSTGRES_USER || 'nexus_user',
    password: process.env.POSTGRES_PASSWORD || 'nexus_password_123',
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    // Buscar veículos e motoristas existentes
    const vehicles = await dataSource.query('SELECT id FROM vehicles LIMIT 3');
    const drivers = await dataSource.query('SELECT id FROM drivers LIMIT 3');

    console.log(`📦 Encontrados ${vehicles.length} veículos e ${drivers.length} motoristas`);

    if (vehicles.length === 0) {
      console.log('⚠️  Nenhum veículo encontrado. Criando veículos de teste...');

      await dataSource.query(`
        INSERT INTO vehicles (
          plate, brand, model, year, status, type, fuel_type,
          capacity_kg, capacity_m3, current_mileage
        ) VALUES
          ('ABC1234', 'Mercedes-Benz', 'Sprinter 313 CDI', 2022, 'AVAILABLE', 'VAN', 'DIESEL', 1500.00, 12.00, 45000),
          ('DEF5678', 'Volkswagen', 'Delivery Express', 2021, 'AVAILABLE', 'TRUCK', 'DIESEL', 3000.00, 20.00, 78000),
          ('GHI9012', 'Fiat', 'Ducato Cargo', 2023, 'AVAILABLE', 'VAN', 'DIESEL', 1200.00, 10.00, 12000)
      `);

      const newVehicles = await dataSource.query('SELECT id FROM vehicles LIMIT 3');
      vehicles.push(...newVehicles);
      console.log('✅ Veículos de teste criados');
    }

    if (drivers.length === 0) {
      console.log('⚠️  Nenhum motorista encontrado. Criando motoristas de teste...');

      await dataSource.query(`
        INSERT INTO drivers (
          name, cpf, email, phone, status
        ) VALUES
          ('João Silva', '12345678901', 'joao.silva@nexustransit.com', '11987654321', 'AVAILABLE'),
          ('Maria Santos', '98765432109', 'maria.santos@nexustransit.com', '11976543210', 'AVAILABLE'),
          ('Carlos Oliveira', '45678912345', 'carlos.oliveira@nexustransit.com', '11965432109', 'AVAILABLE')
      `);

      const newDrivers = await dataSource.query('SELECT id FROM drivers LIMIT 3');
      drivers.push(...newDrivers);
      console.log('✅ Motoristas de teste criados');
    }

    // Criar service orders de teste
    const serviceOrdersData = [
      {
        order_number: 'OS-2024-00001',
        status: 'PENDING',
        priority: 'NORMAL',
        service_type: 'MAINTENANCE',
        title: 'Manutenção Preventiva - Troca de Óleo',
        description: 'Realizar troca de óleo, filtros e verificação geral dos sistemas do veículo',
        vehicle_id: vehicles[0]?.id,
        driver_id: null,
        scheduled_date: new Date(Date.now() + 86400000 * 2), // +2 dias
        estimated_cost: 450.0,
        estimated_duration_minutes: 120,
        service_location: 'Oficina Central - Rua dos Mecânicos, 123',
        latitude: -23.5505199,
        longitude: -46.6333094,
        notes: 'Veículo com 45.000 km rodados, dentro do prazo de manutenção preventiva',
        created_by: 'admin',
      },
      {
        order_number: 'OS-2024-00002',
        status: 'SCHEDULED',
        priority: 'HIGH',
        service_type: 'DELIVERY',
        title: 'Entrega Especial - Carga Frágil',
        description:
          'Transporte de equipamentos eletrônicos delicados com necessidade de motorista experiente',
        vehicle_id: vehicles[1]?.id,
        driver_id: drivers[0]?.id,
        scheduled_date: new Date(Date.now() + 86400000), // +1 dia
        estimated_cost: 850.0,
        estimated_duration_minutes: 240,
        service_location: 'Cliente Premium - Av. Paulista, 1000',
        latitude: -23.561392,
        longitude: -46.6565098,
        notes: 'Cliente VIP - Requer cuidado especial no manuseio',
        created_by: 'logistics_manager',
        metadata: JSON.stringify({
          customer_id: 'CUST-001',
          delivery_type: 'express',
          insurance_required: true,
        }),
        checklist: JSON.stringify([
          { id: '1', description: 'Verificar embalagem', completed: false },
          { id: '2', description: 'Conferir documentação', completed: false },
          { id: '3', description: 'Validar endereço de entrega', completed: false },
        ]),
      },
      {
        order_number: 'OS-2024-00003',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        service_type: 'INSPECTION',
        title: 'Inspeção Técnica Veicular',
        description: 'Inspeção completa para renovação de licenciamento',
        vehicle_id: vehicles[2]?.id,
        driver_id: drivers[1]?.id,
        scheduled_date: new Date(),
        started_at: new Date(Date.now() - 3600000), // Iniciado há 1 hora
        estimated_cost: 250.0,
        estimated_duration_minutes: 90,
        service_location: 'Detran - Centro de Inspeção Veicular',
        latitude: -23.5329384,
        longitude: -46.639555,
        notes: 'Necessário para renovação do licenciamento anual',
        created_by: 'fleet_manager',
      },
      {
        order_number: 'OS-2024-00004',
        status: 'COMPLETED',
        priority: 'NORMAL',
        service_type: 'PICKUP',
        title: 'Coleta de Mercadorias',
        description: 'Coleta de produtos no fornecedor para distribuição',
        vehicle_id: vehicles[0]?.id,
        driver_id: drivers[2]?.id,
        scheduled_date: new Date(Date.now() - 86400000 * 2), // -2 dias
        started_at: new Date(Date.now() - 86400000 * 2 + 3600000),
        completed_at: new Date(Date.now() - 86400000 * 2 + 7200000),
        estimated_cost: 300.0,
        actual_cost: 280.0,
        estimated_duration_minutes: 120,
        actual_duration_minutes: 100,
        service_location: 'Fornecedor ABC - Zona Industrial',
        latitude: -23.6320371,
        longitude: -46.7021267,
        completion_report: 'Coleta realizada com sucesso. Total de 15 volumes coletados.',
        notes: 'Fornecedor solicitou agendamento prévio para próximas coletas',
        created_by: 'operations',
      },
      {
        order_number: 'OS-2024-00005',
        status: 'CANCELLED',
        priority: 'LOW',
        service_type: 'MAINTENANCE',
        title: 'Troca de Pneus',
        description: 'Substituição dos pneus dianteiros',
        vehicle_id: vehicles[1]?.id,
        driver_id: null,
        scheduled_date: new Date(Date.now() - 86400000), // -1 dia
        cancelled_at: new Date(Date.now() - 43200000), // Cancelado há 12h
        estimated_cost: 1200.0,
        estimated_duration_minutes: 60,
        cancellation_reason: 'Pneus ainda em boas condições após inspeção detalhada',
        notes: 'Reagendar para daqui a 3 meses',
        created_by: 'maintenance_team',
      },
      {
        order_number: 'OS-2024-00006',
        status: 'PENDING',
        priority: 'HIGH',
        service_type: 'DELIVERY',
        title: 'Entrega Urgente - Documentos Importantes',
        description: 'Transporte de documentos contratuais para cliente empresarial',
        vehicle_id: vehicles[2]?.id,
        driver_id: drivers[0]?.id,
        scheduled_date: new Date(Date.now() + 3600000 * 4), // +4 horas
        estimated_cost: 150.0,
        estimated_duration_minutes: 45,
        service_location: 'Escritório Cliente - Faria Lima',
        latitude: -23.5783764,
        longitude: -46.6871937,
        notes: 'Documentos confidenciais - requerer assinatura na entrega',
        created_by: 'admin',
        metadata: JSON.stringify({
          requires_signature: true,
          document_type: 'contract',
          confidential: true,
        }),
      },
    ];

    console.log('\n📝 Inserindo service orders...');

    for (const orderData of serviceOrdersData) {
      const fields = Object.keys(orderData);
      const values = Object.values(orderData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const query = `
        INSERT INTO service_orders (${fields.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT (order_number) DO NOTHING
      `;

      await dataSource.query(query, values);
      console.log(`  ✓ ${orderData.order_number} - ${orderData.title}`);
    }

    console.log('\n✅ Seeds de Service Orders criados com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`  • ${serviceOrdersData.length} ordens de serviço`);
    console.log(`  • Status: PENDING(2), SCHEDULED(1), IN_PROGRESS(1), COMPLETED(1), CANCELLED(1)`);
    console.log(`  • Tipos: MAINTENANCE(2), DELIVERY(2), INSPECTION(1), PICKUP(1)`);
    console.log(`  • Prioridades: LOW(1), NORMAL(2), HIGH(2), URGENT(1)`);
  } catch (error) {
    console.error('❌ Erro ao criar seeds:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar seed
seedServiceOrders()
  .then(() => {
    console.log('\n🎉 Seed concluído!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });
