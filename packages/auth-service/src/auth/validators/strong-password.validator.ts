import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validador de senha forte
 *
 * Implementa validação de senhas seguindo requisitos de segurança:
 * - Mínimo 8 caracteres
 * - Pelo menos uma letra maiúscula
 * - Pelo menos uma letra minúscula
 * - Pelo menos um número
 * - Pelo menos um caractere especial
 */
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  }

  defaultMessage(): string {
    return 'Senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial';
  }
}

/**
 * Decorator para validação de senha forte
 *
 * @param validationOptions - Opções de validação do class-validator
 * @returns Decorator function
 *
 * @example
 * ```typescript
 * class CreateUserDto {
 *   @IsStrongPassword()
 *   password: string;
 * }
 * ```
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

/**
 * Normaliza uma senha removendo espaços extras
 *
 * @param password - Senha a ser normalizada
 * @returns Senha normalizada
 */
export function normalizePassword(password: string): string {
  if (!password) {
    return '';
  }
  return password.trim();
}

/**
 * Verifica se a senha contém caracteres inseguros
 *
 * @param password - Senha a ser verificada
 * @returns true se contém caracteres inseguros, false caso contrário
 */
export function hasInsecureCharacters(password: string): boolean {
  // Verifica por caracteres que podem causar problemas em sistemas
  const insecurePatterns = [
    /\s{2,}/, // Múltiplos espaços
    /['`]/, // Aspas simples e acentos graves
    /[<>]/, // Sinais de menor e maior (XSS)
  ];

  return insecurePatterns.some(pattern => pattern.test(password));
}

/**
 * Verifica a força da senha (0-4)
 *
 * @param password - Senha a ser analisada
 * @returns Pontuação de força (0 = muito fraca, 4 = muito forte)
 */
export function getPasswordStrength(password: string): number {
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
