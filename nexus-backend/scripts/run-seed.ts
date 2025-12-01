import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function runSeedScript() {
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

    // Ler arquivo SQL
    const sqlPath = path.join(__dirname, 'seed-dashboard-data.sql');
    console.log(`📁 Lendo arquivo: ${sqlPath}`);
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ Arquivo não encontrado: ${sqlPath}`);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    console.log(`📄 Arquivo lido: ${sqlContent.length} caracteres\n`);

    // Remover comentários
    let cleanedContent = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Remover blocos de comentários /* */
    cleanedContent = cleanedContent.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Dividir em statements (separados por ponto-e-vírgula)
    const statements = cleanedContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 20); // Filtrar statements muito pequenos

    console.log(`📝 Executando ${statements.length} comandos SQL...\n`);

    let executedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length < 20) continue; // Skip statements muito curtos
      
      try {
        await dataSource.query(statement);
        executedCount++;
        
        // Log de progresso
        if (statement.toUpperCase().startsWith('INSERT')) {
          const match = statement.match(/INSERT INTO (\w+)/i);
          if (match) {
            console.log(`   ✓ [${i + 1}/${statements.length}] Inserção em ${match[1]}`);
          }
        } else if (statement.toUpperCase().startsWith('UPDATE')) {
          console.log(`   ✓ [${i + 1}/${statements.length}] Update executado`);
        } else if (statement.toUpperCase().startsWith('SELECT')) {
          const result = await dataSource.query(statement);
          if (Array.isArray(result) && result.length > 0) {
            console.log('\n📊 Resumo dos dados:');
            result.forEach((row: any) => {
              console.log(`   - ${row.tabela || 'Item'}: ${row.total || row.count || JSON.stringify(row)}`);
            });
            console.log('');
          }
        } else if (statement.toUpperCase().startsWith('WITH')) {
          console.log(`   ✓ [${i + 1}/${statements.length}] CTE executado`);
        } else {
          console.log(`   ✓ [${i + 1}/${statements.length}] Comando executado`);
        }
      } catch (error: any) {
        errorCount++;
        const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
        console.error(`   ❌ [${i + 1}/${statements.length}] Erro: ${preview}...`);
        console.error(`      ${error.message}`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Seed concluído!`);
    console.log(`   • ${executedCount} comandos executados com sucesso`);
    console.log(`   • ${errorCount} erros encontrados`);
    console.log(`${'='.repeat(60)}\n`);

    await dataSource.destroy();

  } catch (error: any) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  }
}

runSeedScript();
