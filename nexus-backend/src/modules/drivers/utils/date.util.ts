/**
 * Utilitários para manipulação de datas no módulo de motoristas
 */

/**
 * Converte data do formato DD-MM-YYYY para YYYY-MM-DD
 * @param dateString Data no formato DD-MM-YYYY
 * @returns Data no formato YYYY-MM-DD ou a string original se não for DD-MM-YYYY
 */
export function convertDateFormat(dateString: string): string {
  if (typeof dateString !== 'string') {
    return dateString;
  }

  // Verifica se está no formato DD-MM-YYYY
  const ddmmyyyyPattern = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
  const match = ddmmyyyyPattern.exec(dateString);

  if (match?.[1] && match[2] && match[3]) {
    const day = match[1];
    const month = match[2];
    const year = match[3];
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Se não está no formato DD-MM-YYYY, retorna a string original
  return dateString;
}

/**
 * Calcula a idade baseada na data de nascimento
 * @param birthDate Data de nascimento
 * @returns Idade em anos
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Valida se a idade mínima é atendida
 * @param birthDate Data de nascimento
 * @param minAge Idade mínima requerida
 * @returns true se atende a idade mínima
 */
export function validateMinimumAge(birthDate: Date, minAge: number): boolean {
  return calculateAge(birthDate) >= minAge;
}

/**
 * Formata data para string no formato brasileiro (DD/MM/YYYY)
 * @param date Data a ser formatada
 * @returns String no formato DD/MM/YYYY
 */
export function formatDateToBrazilian(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
