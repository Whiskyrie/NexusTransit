import { EMAIL_REGEX, PHONE_REGEX } from '../constants/user.constants';

/**
 * Formata nome completo do usuário
 *
 * @param firstName - Primeiro nome
 * @param lastName - Sobrenome
 * @returns Nome completo formatado
 *
 * @example
 * formatFullName('João', 'Silva') // 'João Silva'
 * formatFullName('João', '') // 'João'
 */
export function formatFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const first = firstName?.trim() ?? '';
  const last = lastName?.trim() ?? '';
  return `${first} ${last}`.trim();
}

/**
 * Normaliza email (lowercase e trim)
 *
 * @param email - Email a ser normalizado
 * @returns Email normalizado ou string vazia
 *
 * @example
 * normalizeEmail('  Usuario@EMPRESA.com  ') // 'usuario@empresa.com'
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email) {
    return '';
  }
  return email.trim().toLowerCase();
}

/**
 * Mascara email para exibição pública
 *
 * @param email - Email a ser mascarado
 * @returns Email mascarado
 *
 * @example
 * maskEmail('usuario@empresa.com') // 'u*****o@empresa.com'
 * maskEmail('ab@test.com') // 'ab@test.com'
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) {
    return '';
  }

  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    return email;
  }

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  if (!local || !domain) {
    return email;
  }

  if (local.length <= 2) {
    return email;
  }

  const firstChar = local.charAt(0);
  const lastChar = local.charAt(local.length - 1);
  const maskedLocal = `${firstChar}${'*'.repeat(local.length - 2)}${lastChar}`;

  return `${maskedLocal}@${domain}`;
}

/**
 * Gera username a partir do email
 *
 * @param email - Email do usuário
 * @returns Username gerado
 *
 * @example
 * generateUsername('joao.silva@empresa.com') // 'joaosilva'
 */
export function generateUsername(email: string | null | undefined): string {
  if (!email) {
    return '';
  }

  const atIndex = email.indexOf('@');
  const localPart = atIndex !== -1 ? email.slice(0, atIndex) : email;

  return localPart.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Valida formato de email
 *
 * @param email - Email a ser validado
 * @returns True se email é válido
 *
 * @example
 * isValidEmailFormat('usuario@empresa.com') // true
 * isValidEmailFormat('email_invalido') // false
 */
export function isValidEmailFormat(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return EMAIL_REGEX.test(email);
}

/**
 * Formata telefone removendo caracteres especiais
 *
 * @param phone - Telefone a ser formatado
 * @returns Telefone apenas com números
 *
 * @example
 * normalizePhone('(11) 99999-9999') // '11999999999'
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) {
    return '';
  }
  return phone.replace(/\D/g, '');
}

/**
 * Formata telefone no padrão brasileiro
 *
 * @param phone - Telefone a ser formatado
 * @returns Telefone formatado
 *
 * @example
 * formatPhone('11999999999') // '(11) 99999-9999'
 * formatPhone('1133334444') // '(11) 3333-4444'
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) {
    return '';
  }

  const cleaned = normalizePhone(phone);

  if (cleaned.length === 11) {
    // Celular: (XX) 9XXXX-XXXX
    const ddd = cleaned.slice(0, 2);
    const firstPart = cleaned.slice(2, 7);
    const secondPart = cleaned.slice(7);
    return `(${ddd}) ${firstPart}-${secondPart}`;
  }

  if (cleaned.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    const ddd = cleaned.slice(0, 2);
    const firstPart = cleaned.slice(2, 6);
    const secondPart = cleaned.slice(6);
    return `(${ddd}) ${firstPart}-${secondPart}`;
  }

  return phone;
}

/**
 * Extrai iniciais do nome
 *
 * @param firstName - Primeiro nome
 * @param lastName - Sobrenome
 * @returns Iniciais em maiúsculo
 *
 * @example
 * getInitials('João', 'Silva') // 'JS'
 * getInitials('João', null) // 'J'
 */
export function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${firstInitial}${lastInitial}`;
}

/**
 * Constantes de tempo em milissegundos
 */
const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;
const MS_PER_MONTH = MS_PER_DAY * 30;
const MS_PER_YEAR = MS_PER_DAY * 365;

/**
 * Calcula tempo desde último login
 *
 * @param lastLoginAt - Data do último login
 * @returns Descrição do tempo decorrido
 *
 * @example
 * getTimeSinceLastLogin(new Date('2024-01-01')) // 'há 5 dias'
 */
export function getTimeSinceLastLogin(lastLoginAt: Date | string | null | undefined): string {
  if (!lastLoginAt) {
    return 'Nunca';
  }

  const lastLogin = lastLoginAt instanceof Date ? lastLoginAt : new Date(lastLoginAt);

  // Verifica se a data é válida
  if (Number.isNaN(lastLogin.getTime())) {
    return 'Nunca';
  }

  const now = Date.now();
  const diffMs = now - lastLogin.getTime();

  // Retorno antecipado para cada faixa de tempo
  if (diffMs < MS_PER_MINUTE) {
    return 'Agora mesmo';
  }

  if (diffMs < MS_PER_HOUR) {
    const diffMins = Math.floor(diffMs / MS_PER_MINUTE);
    return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  }

  if (diffMs < MS_PER_DAY) {
    const diffHours = Math.floor(diffMs / MS_PER_HOUR);
    return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  }

  if (diffMs < MS_PER_MONTH) {
    const diffDays = Math.floor(diffMs / MS_PER_DAY);
    return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  }

  if (diffMs < MS_PER_YEAR) {
    const diffMonths = Math.floor(diffMs / MS_PER_MONTH);
    return `há ${diffMonths} ${diffMonths > 1 ? 'meses' : 'mês'}`;
  }

  const diffYears = Math.floor(diffMs / MS_PER_YEAR);
  return `há ${diffYears} ano${diffYears > 1 ? 's' : ''}`;
}

/**
 * Valida se telefone tem formato válido
 *
 * @param phone - Telefone a ser validado
 * @returns True se telefone é válido
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) {
    return false;
  }
  return PHONE_REGEX.test(phone);
}
