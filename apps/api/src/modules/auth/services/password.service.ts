import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * Password Service
 *
 * Serviço responsável por operações relacionadas a senhas:
 * - Hash de senhas
 * - Validação de senhas
 * - Geração de senhas temporárias
 */
@Injectable()
export class PasswordService {
  private readonly saltRounds = 12;

  /**
   * Gera hash bcrypt de uma senha
   *
   * @param password - Senha em texto plano
   * @returns Hash bcrypt da senha
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compara senha em texto plano com hash
   *
   * @param password - Senha em texto plano
   * @param hash - Hash bcrypt para comparar
   * @returns True se a senha corresponde ao hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Valida força da senha
   *
   * Requisitos:
   * - Mínimo 8 caracteres
   * - Pelo menos uma letra maiúscula
   * - Pelo menos uma letra minúscula
   * - Pelo menos um número
   * - Pelo menos um caractere especial
   *
   * @param password - Senha para validar
   * @returns True se a senha atende aos requisitos
   */
  validatePasswordStrength(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&#]/.test(password);

    return (
      password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar
    );
  }

  /**
   * Gera senha aleatória segura
   *
   * @param length - Tamanho da senha (padrão: 16)
   * @returns Senha aleatória
   */
  generateRandomPassword(length = 16): string {
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '@$!%*?&#';
    const allChars = upperCase + lowerCase + numbers + specialChars;

    let password = '';

    // Garante pelo menos um caractere de cada tipo
    password += upperCase[Math.floor(Math.random() * upperCase.length)];
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Preenche o resto aleatoriamente
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Embaralha a senha
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
