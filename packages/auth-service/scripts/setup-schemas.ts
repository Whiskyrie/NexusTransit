// @ts-nocheck
/* eslint-disable */
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'nexustransit_dev',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados nexustransit_dev\n');

    // Criar extensões
    console.log('📦 Criando extensões...');
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
    console.log('   ✓ uuid-ossp');
    console.log('   ✓ citext');

    // Definição dos schemas
    const schemas = [
      { name: 'auth', description: 'auth-service' },
      { name: 'customers', description: 'customers-service' },
      { name: 'operations', description: 'operations-service' },
      { name: 'monitoring', description: 'monitoring-service' },
      { name: 'compliance', description: 'compliance-service' },
      { name: 'incidents', description: 'incidents-service' },
      { name: 'reports', description: 'reports-service' },
    ];

    console.log('\n📁 Criando schemas...');
    for (const schema of schemas) {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema.name}`);
      await client.query(`GRANT ALL PRIVILEGES ON SCHEMA ${schema.name} TO postgres`);
      await client.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schema.name} TO postgres`);
      await client.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schema.name} TO postgres`);
      console.log(`   ✓ ${schema.name} (${schema.description})`);
    }

    // Verificar schemas criados
    console.log('\n📋 Schemas no banco de dados:');
    const result = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'public')
      ORDER BY schema_name
    `);

    console.log('');
    result.rows.forEach((row) => {
      console.log(`   • ${row.schema_name}`);
    });

    console.log('\n============================================');
    console.log('  NexusTransit Schemas - Setup Completo!   ');
    console.log('============================================\n');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
