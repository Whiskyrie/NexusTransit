import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function listEnumValues() {
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
    
    // Listar valores de cada enum
    const enums = ['route_status_enum', 'route_type_enum', 'delivery_status_enum', 'delivery_priority_enum'];
    
    for (const enumName of enums) {
      const result = await dataSource.query(`
        SELECT e.enumlabel 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname = '${enumName}'
        ORDER BY e.enumsortorder
      `);
      
      console.log(`\n${enumName}:`);
      result.forEach((row: any) => console.log(`  - '${row.enumlabel}'`));
    }
    
    await dataSource.destroy();

  } catch (error: any) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
}

listEnumValues();
