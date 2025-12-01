/**
 * Script para testar os endpoints de KPIs do dashboard
 * 
 * Testa diferentes períodos e verifica as respostas
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001';

interface KPITestResult {
  endpoint: string;
  period: string;
  success: boolean;
  status?: number;
  data?: any;
  error?: string;
}

async function testKPIEndpoint(
  endpoint: string, 
  period: string
): Promise<KPITestResult> {
  const url = `${API_URL}${endpoint}?period=${period}`;
  
  try {
    console.log(`\n🔍 Testando: ${url}`);
    const response = await axios.get(url);
    
    console.log(`✅ Sucesso (${response.status})`);
    console.log(`Período: ${response.data.period}`);
    console.log(`Dados:`, JSON.stringify(response.data.metrics || response.data, null, 2));
    
    return {
      endpoint,
      period,
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error: any) {
    console.log(`❌ Erro (${error.response?.status || 'Network Error'})`);
    console.log(`Mensagem: ${error.response?.data?.message || error.message}`);
    
    return {
      endpoint,
      period,
      success: false,
      status: error.response?.status,
      error: error.response?.data?.message || error.message,
    };
  }
}

async function testAllKPIs() {
  console.log('📊 TESTE DE ENDPOINTS DE KPIs DO DASHBOARD\n');
  console.log('='.repeat(60));
  
  const endpoints = [
    '/dashboard/kpis/deliveries',
    '/dashboard/kpis/financial',
  ];
  
  const periods = [
    'TODAY',
    'LAST_7_DAYS',
    'LAST_30_DAYS',
    'CURRENT_MONTH',
    'LAST_MONTH',
    'LAST_3_MONTHS',
  ];
  
  const results: KPITestResult[] = [];
  
  for (const endpoint of endpoints) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 Endpoint: ${endpoint}`);
    console.log('='.repeat(60));
    
    for (const period of periods) {
      const result = await testKPIEndpoint(endpoint, period);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay entre requests
    }
  }
  
  // Sumário
  console.log('\n\n' + '='.repeat(60));
  console.log('📈 SUMÁRIO DOS TESTES');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const successRate = ((successCount / totalCount) * 100).toFixed(1);
  
  console.log(`\nTotal de testes: ${totalCount}`);
  console.log(`Sucessos: ${successCount} (${successRate}%)`);
  console.log(`Falhas: ${totalCount - successCount}`);
  
  // Falhas detalhadas
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('\n❌ FALHAS:');
    failures.forEach(f => {
      console.log(`  - ${f.endpoint} (${f.period}): ${f.error}`);
    });
  }
  
  // Sucessos por endpoint
  console.log('\n✅ SUCESSOS POR ENDPOINT:');
  endpoints.forEach(endpoint => {
    const endpointResults = results.filter(r => r.endpoint === endpoint);
    const endpointSuccess = endpointResults.filter(r => r.success).length;
    console.log(`  ${endpoint}: ${endpointSuccess}/${endpointResults.length}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TESTE CONCLUÍDO');
  console.log('='.repeat(60) + '\n');
}

// Executar testes
testAllKPIs().catch(error => {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
});
