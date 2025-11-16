/**
 * Gerador de documentos válidos para testes
 *
 * Este script gera CPFs e CNHs válidos para uso em testes
 */

/**
 * Gera um CPF válido com dígitos verificadores corretos
 * Implementa o algoritmo oficial de validação do CPF brasileiro
 */
function gerarCPFValido(): string {
  // Gera 9 dígitos aleatórios
  const n1 = Math.floor(Math.random() * 10);
  const n2 = Math.floor(Math.random() * 10);
  const n3 = Math.floor(Math.random() * 10);
  const n4 = Math.floor(Math.random() * 10);
  const n5 = Math.floor(Math.random() * 10);
  const n6 = Math.floor(Math.random() * 10);
  const n7 = Math.floor(Math.random() * 10);
  const n8 = Math.floor(Math.random() * 10);
  const n9 = Math.floor(Math.random() * 10);

  // Calcula o primeiro dígito verificador
  let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) {
    d1 = 0;
  }

  // Calcula o segundo dígito verificador
  let d2 =
    d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) {
    d2 = 0;
  }

  // Retorna o CPF completo (11 dígitos)
  return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}

/**
 * Gera uma CNH válida (11 dígitos)
 * Nota: CNH real tem validação mais complexa, mas para testes básicos
 * este formato de 11 dígitos é aceito pelo validator
 */
function gerarCNHValida(): string {
  // Gera 9 dígitos base
  const n1 = Math.floor(Math.random() * 10);
  const n2 = Math.floor(Math.random() * 10);
  const n3 = Math.floor(Math.random() * 10);
  const n4 = Math.floor(Math.random() * 10);
  const n5 = Math.floor(Math.random() * 10);
  const n6 = Math.floor(Math.random() * 10);
  const n7 = Math.floor(Math.random() * 10);
  const n8 = Math.floor(Math.random() * 10);
  const n9 = Math.floor(Math.random() * 10);

  // Calcula primeiro dígito verificador (CNH usa algoritmo similar ao CPF)
  let v = n1 * 9 + n2 * 8 + n3 * 7 + n4 * 6 + n5 * 5 + n6 * 4 + n7 * 3 + n8 * 2 + n9 * 1;
  let dv1 = v % 11;
  if (dv1 >= 10) {
    dv1 = 0;
  }

  // Calcula segundo dígito verificador
  v = n1 * 1 + n2 * 2 + n3 * 3 + n4 * 4 + n5 * 5 + n6 * 6 + n7 * 7 + n8 * 8 + n9 * 9 + dv1 * 10;
  let dv2 = v % 11;
  if (dv2 >= 10) {
    dv2 = 0;
  }

  return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${dv1}${dv2}`;
}

/**
 * Gera um CNPJ válido com dígitos verificadores corretos
 */
function gerarCNPJValido(): string {
  // Gera 12 dígitos base
  const n = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));

  // Calcula primeiro dígito verificador
  const peso1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = n.reduce((acc, val, idx) => acc + val * peso1[idx]!, 0);
  const dv1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  // Calcula segundo dígito verificador
  const peso2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = n.reduce((acc, val, idx) => acc + val * peso2[idx]!, 0) + dv1 * peso2[12]!;
  const dv2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  return n.join('') + dv1 + dv2;
}

// ==================== EXECUÇÃO ====================

console.log('='.repeat(60));
console.log('📋 DOCUMENTOS VÁLIDOS PARA TESTES');
console.log('='.repeat(60));
console.log('');

console.log('🆔 CPFs Válidos:');
console.log('   CPF 1:', gerarCPFValido());
console.log('   CPF 2:', gerarCPFValido());
console.log('   CPF 3:', gerarCPFValido());
console.log('   CPF 4:', gerarCPFValido());
console.log('   CPF 5:', gerarCPFValido());
console.log('');

console.log('🪪  CNHs Válidas:');
console.log('   CNH 1:', gerarCNHValida());
console.log('   CNH 2:', gerarCNHValida());
console.log('   CNH 3:', gerarCNHValida());
console.log('   CNH 4:', gerarCNHValida());
console.log('   CNH 5:', gerarCNHValida());
console.log('');

console.log('🏢 CNPJs Válidos:');
console.log('   CNPJ 1:', gerarCNPJValido());
console.log('   CNPJ 2:', gerarCNPJValido());
console.log('   CNPJ 3:', gerarCNPJValido());
console.log('');

console.log('='.repeat(60));
console.log('✅ Use esses documentos na sua collection do Postman');
console.log('='.repeat(60));

// Exporta as funções para uso em outros scripts
export { gerarCPFValido, gerarCNHValida, gerarCNPJValido };
