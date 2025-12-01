import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedDeliveries() {
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

    // Verificar se já existem customers
    const customers = await dataSource.query('SELECT id FROM customers LIMIT 10');
    
    if (customers.length === 0) {
      console.log('❌ Nenhum customer encontrado. Criando customers primeiro...\n');
      
      await dataSource.query(`
        INSERT INTO customers (id, tax_id, name, email, phone, type, status, category)
        VALUES 
          (uuid_generate_v4(), '12345678000100', 'Empresa ABC Ltda', 'contato@empresaabc.com', '11987654321', 'corporate', 'active', 'standard'),
          (uuid_generate_v4(), '98765432000199', 'Comércio XYZ SA', 'compras@xyz.com.br', '11912345678', 'corporate', 'active', 'vip'),
          (uuid_generate_v4(), '12312312399', 'João Silva', 'joao.silva@email.com', '11999887766', 'individual', 'active', 'standard'),
          (uuid_generate_v4(), '45645645600', 'Maria Santos', 'maria.santos@email.com', '11988776655', 'individual', 'active', 'standard'),
          (uuid_generate_v4(), '78978978900', 'Pedro Costa', 'pedro.costa@email.com', '11977665544', 'individual', 'active', 'standard')
        ON CONFLICT DO NOTHING
      `);
      
      console.log('   ✓ 5 customers criados\n');
    }

    // Buscar customers
    const availableCustomers = await dataSource.query('SELECT id FROM customers ORDER BY created_at DESC LIMIT 10');
    console.log(`📦 Encontrados ${availableCustomers.length} customers\n`);

    // Criar deliveries com diferentes status
    const statuses = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERED', 'DELIVERED'];
    const priorities = ['LOW', 'NORMAL', 'NORMAL', 'NORMAL', 'HIGH', 'NORMAL', 'NORMAL', 'CRITICAL'];
    const addresses = [
      'Rua Augusta, 1000 - Consolação, São Paulo - SP',
      'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
      'Rua Oscar Freire, 500 - Jardins, São Paulo - SP',
      'Av. Brigadeiro Faria Lima, 3000 - Itaim Bibi, São Paulo - SP',
      'Rua Haddock Lobo, 595 - Cerqueira César, São Paulo - SP',
      'Av. Rebouças, 3970 - Pinheiros, São Paulo - SP',
      'Rua da Consolação, 3000 - Consolação, São Paulo - SP',
      'Av. Ibirapuera, 2907 - Moema, São Paulo - SP',
      'Rua Teodoro Sampaio, 1000 - Pinheiros, São Paulo - SP',
      'Av. Europa, 158 - Jardim Europa, São Paulo - SP'
    ];

    console.log('🚚 Criando deliveries...\n');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    for (let i = 0; i < 20; i++) {
      const customerIndex = i % availableCustomers.length;
      const statusIndex = i % statuses.length;
      const addressIndex = i % addresses.length;
      
      const pickupAddress = {
        street: "Rua Principal",
        number: "100",
        complement: "Depósito",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        postal_code: "01000-000",
        country: "Brasil"
      };

      const deliveryAddress = {
        street: (addresses[addressIndex] || "Rua Exemplo").split(',')[0],
        number: "S/N",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        postal_code: "01000-000",
        country: "Brasil"
      };

      const productInfo = {
        description: `Entrega de pacote #${i + 1}`,
        quantity: 1,
        category: "Geral",
        value: 100 + i * 50,
        weight: 5.5 + i * 0.5,
        dimensions: {
          length: 30,
          width: 20,
          height: 15
        }
      };

      const deliveryContact = {
        name: "Destinatário " + (i + 1),
        phone: "11999887766",
        email: "destinatario@email.com"
      };
      
      await dataSource.query(`
        INSERT INTO deliveries (
          id, 
          tracking_code, 
          status, 
          priority,
          customer_id,
          pickup_address,
          delivery_address,
          delivery_contact,
          product_info,
          scheduled_pickup_at,
          scheduled_delivery_at
        )
        VALUES (
          uuid_generate_v4(),
          'DEL-${String(10001 + i).padStart(6, '0')}',
          '${statuses[statusIndex]}',
          '${priorities[statusIndex]}',
          '${availableCustomers[customerIndex].id}',
          '${JSON.stringify(pickupAddress)}',
          '${JSON.stringify(deliveryAddress)}',
          '${JSON.stringify(deliveryContact)}',
          '${JSON.stringify(productInfo)}',
          '${now.toISOString()}',
          '${tomorrow.toISOString()}'
        )
        ON CONFLICT DO NOTHING
      `);
      
      console.log(`   ✓ [${i + 1}/20] Delivery ${String(10001 + i).padStart(6, '0')} - Status: ${statuses[statusIndex]}`);
    }

    // Verificar contagem final
    const finalCount = await dataSource.query('SELECT COUNT(*) as total FROM deliveries');
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Seed de deliveries concluído!`);
    console.log(`📊 Total de deliveries no banco: ${finalCount[0].total}`);
    console.log('='.repeat(60) + '\n');
    
    console.log('🎯 Próximos passos:');
    console.log('   1. Inicie o servidor: npm run dev');
    console.log('   2. Acesse o dashboard: http://localhost:3000/api/dashboard/overview');
    console.log('   3. Swagger UI: http://localhost:3000/api-docs\n');

    await dataSource.destroy();

  } catch (error: any) {
    console.error('\n❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

seedDeliveries();
