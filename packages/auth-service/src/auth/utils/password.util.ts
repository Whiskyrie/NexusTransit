import * as bcrypt from 'bcrypt';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * Utilitários para manipulação de senhas
 *
 * Funções auxiliares para hash, comparação e validação de senhas
 * seguindo as melhores práticas de segurança.
 */

/**
 * Gera hash de uma senha usando bcrypt
 *
 * @param password - Senha em texto plano
 * @param saltRounds - Número de rounds (opcional, usa padrão do sistema)
 * @returns Promise<string> - Hash da senha
 *
 * @example
 * ```typescript
 * const hash = await hashPassword('senha123');
 * console.log(hash); // $2b$10$...
 * ```
 */
export async function hashPassword(
  password: string,
  saltRounds: number = AUTH_CONSTANTS.BCRYPT_ROUNDS,
): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compara uma senha em texto plano com um hash
 *
 * @param password - Senha em texto plano
 * @param hashedPassword - Hash da senha armazenado
 * @returns Promise<boolean> - true se coincidir, false caso contrário
 *
 * @example
 * ```typescript
 * const isValid = await comparePassword('senha123', '$2b$10$...');
 * console.log(isValid); // true
 * ```
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Gera uma senha aleatória forte
 *
 * @param length - Comprimento da senha (padrão: 12)
 * @returns string - Senha aleatória forte
 *
 * @example
 * ```typescript
 * const password = generateRandomPassword();
 * console.log(password); // 'Kj8#mN2$pQ'
 * ```
 */
export function generateRandomPassword(length = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = lowercase + uppercase + numbers + symbols;
  let password = '';

  // Garante pelo menos um caractere de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Preenche o restante
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Embaralha os caracteres
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Verifica se uma senha atende aos requisitos mínimos
 *
 * @param password - Senha a ser validada
 * @returns boolean - true se atende aos requisitos, false caso contrário
 *
 * @example
 * ```typescript
 * const isValid = isPasswordValid('Senha123!');
 * console.log(isValid); // true
 * ```
 */
export function isPasswordValid(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  const hasMinLength = password.length >= AUTH_CONSTANTS.MIN_PASSWORD_LENGTH;
  const hasMaxLength = password.length <= AUTH_CONSTANTS.MAX_PASSWORD_LENGTH;
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    hasMinLength && hasMaxLength && hasLowerCase && hasUpperCase && hasNumber && hasSpecialChar
  );
}

/**
 * Calcula a força de uma senha (0-4)
 *
 * @param password - Senha a ser analisada
 * @returns number - Pontuação de força (0 = muito fraca, 4 = muito forte)
 *
 * @example
 * ```typescript
 * const strength = calculatePasswordStrength('SenhaForte123!');
 * console.log(strength); // 4
 * ```
 */
export function calculatePasswordStrength(password: string): number {
  if (!password || typeof password !== 'string') {
    return 0;
  }

  let score = 0;

  // Comprimento
  if (password.length >= 8) {
    score++;
  }
  if (password.length >= 12) {
    score++;
  }

  // Complexidade
  if (/[a-z]/.test(password)) {
    score++;
  }
  if (/[A-Z]/.test(password)) {
    score++;
  }
  if (/[0-9]/.test(password)) {
    score++;
  }
  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  }

  return Math.min(score, 4);
}
