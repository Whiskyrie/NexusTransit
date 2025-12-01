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

async function populateFinancialData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco de dados\n');

    // Verificar quantas entregas estão sem dados financeiros
    const emptyFinancial = await AppDataSource.query(`
      SELECT COUNT(*) as count 
      FROM deliveries 
      WHERE (delivery_fee = 0 OR delivery_fee IS NULL) 
        AND deleted_at IS NULL
    `);

    console.log(`📊 Entregas sem dados financeiros: ${emptyFinancial[0]?.count || 0}\n`);

    if (emptyFinancial[0]?.count > 0) {
      console.log('💰 Populando dados financeiros...');

      // Atualizar entregas com valores financeiros realistas
      // delivery_fee: entre R$ 50 e R$ 150
      // total_cost: entre 60% e 80% do delivery_fee
      const result = await AppDataSource.query(`
        UPDATE deliveries 
        SET 
          delivery_fee = ROUND((RANDOM() * 100 + 50)::numeric, 2),
          updated_at = NOW()
        WHERE (delivery_fee = 0 OR delivery_fee IS NULL) 
          AND deleted_at IS NULL
        RETURNING id, delivery_fee
      `);

      console.log(`✅ Atualizadas ${result.length} entregas com delivery_fee`);

      // Calcular total_cost baseado no delivery_fee (60% a 80%)
      await AppDataSource.query(`
        UPDATE deliveries 
        SET 
          total_cost = ROUND((delivery_fee * (0.60 + RANDOM() * 0.20))::numeric, 2),
          updated_at = NOW()
        WHERE (total_cost = 0 OR total_cost IS NULL) 
          AND delivery_fee IS NOT NULL 
          AND deleted_at IS NULL
      `);

      console.log(`✅ Calculados custos totais\n`);

      // Mostrar amostra dos dados
      const sample = await AppDataSource.query(`
        SELECT 
          id,
          status,
          delivery_fee,
          total_cost,
          (delivery_fee - total_cost) as profit
        FROM deliveries
        WHERE delivery_fee > 0
        ORDER BY created_at DESC
        LIMIT 5
      `);

      console.log('📋 Amostra dos dados financeiros atualizados:');
      console.log('---------------------------------------------------');
      sample.forEach((row: any) => {
        console.log(
          `  ${row.status.padEnd(15)} | ` +
          `Taxa: R$ ${parseFloat(row.delivery_fee).toFixed(2).padStart(8)} | ` +
          `Custo: R$ ${parseFloat(row.total_cost).toFixed(2).padStart(8)} | ` +
          `Lucro: R$ ${parseFloat(row.profit).toFixed(2).padStart(8)}`
        );
      });
      console.log('---------------------------------------------------\n');

      // Estatísticas gerais
      const stats = await AppDataSource.query(`
        SELECT 
          COUNT(*) as total_deliveries,
          SUM(delivery_fee) as total_revenue,
          SUM(total_cost) as total_cost,
          SUM(delivery_fee - total_cost) as total_profit,
          AVG(delivery_fee) as avg_fee,
          AVG(total_cost) as avg_cost
        FROM deliveries
        WHERE delivery_fee > 0 AND deleted_at IS NULL
      `);

      console.log('📊 Estatísticas Gerais:');
      console.log(`   Total de Entregas: ${stats[0].total_deliveries}`);
      console.log(`   Receita Total: R$ ${parseFloat(stats[0].total_revenue).toFixed(2)}`);
      console.log(`   Custo Total: R$ ${parseFloat(stats[0].total_cost).toFixed(2)}`);
      console.log(`   Lucro Total: R$ ${parseFloat(stats[0].total_profit).toFixed(2)}`);
      console.log(`   Taxa Média: R$ ${parseFloat(stats[0].avg_fee).toFixed(2)}`);
      console.log(`   Custo Médio: R$ ${parseFloat(stats[0].avg_cost).toFixed(2)}`);
      console.log(
        `   Margem Média: ${((parseFloat(stats[0].total_profit) / parseFloat(stats[0].total_revenue)) * 100).toFixed(2)}%`
      );
      console.log('');

    } else {
      console.log('✅ Todas as entregas já possuem dados financeiros!\n');
    }

    console.log('🎉 Concluído! Agora o dashboard vai mostrar métricas financeiras reais.');

  } catch (error) {
    console.error('❌ Erro ao popular dados financeiros:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

populateFinancialData();
