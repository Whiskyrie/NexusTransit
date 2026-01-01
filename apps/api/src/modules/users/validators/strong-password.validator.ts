import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { USER_CONSTANTS, PASSWORD_SPECIAL_CHARS } from '../constants/user.constants';

/**
 * Regex para caracteres especiais (escapada para uso seguro)
 */
const SPECIAL_CHARS_REGEX = new RegExp(
  `[${PASSWORD_SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`,
);

/**
 * Padrões de sequências comuns a serem penalizadas
 */
const COMMON_SEQUENCES = [
  // Numéricas
  '012',
  '123',
  '234',
  '345',
  '456',
  '567',
  '678',
  '789',
  '890',
  '987',
  '876',
  '765',
  '654',
  '543',
  '432',
  '321',
  '210',
  // Alfabéticas
  'abc',
  'bcd',
  'cde',
  'def',
  'efg',
  'xyz',
  'zyx',
  // Teclado
  'qwe',
  'wer',
  'ert',
  'rty',
  'asd',
  'sdf',
  'dfg',
  'zxc',
  'xcv',
] as const;

/**
 * Pontuações para cálculo de força da senha
 */
const STRENGTH_SCORES = {
  LENGTH_MULTIPLIER: 2,
  LENGTH_MAX: 30,
  UPPERCASE: 10,
  LOWERCASE: 10,
  NUMBER: 10,
  SPECIAL_CHAR: 15,
  UNIQUE_CHARS_MAX: 15,
  PENALTY_REPEATED: -10,
  PENALTY_SEQUENCE: -10,
} as const;

/**
 * Limiares para descrição da força
 */
const STRENGTH_THRESHOLDS = {
  VERY_WEAK: 30,
  WEAK: 50,
  MEDIUM: 70,
  STRONG: 90,
} as const;

/**
 * Validador customizado para senha forte
 *
 * Implementa validação de complexidade de senha baseada nas constantes do sistema
 *
 * Requisitos:
 * - Mínimo de 8 caracteres
 * - Máximo de 128 caracteres
 * - Pelo menos uma letra maiúscula
 * - Pelo menos uma letra minúscula
 * - Pelo menos um número
 * - Pelo menos um caractere especial
 */
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: unknown): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    return getPasswordValidationErrors(password).length === 0;
  }

  defaultMessage(): string {
    const { MIN_LENGTH, MAX_LENGTH } = USER_CONSTANTS.PASSWORD;
    return (
      `Senha deve ter entre ${MIN_LENGTH} e ${MAX_LENGTH} caracteres, ` +
      `incluindo maiúsculas, minúsculas, números e caracteres especiais`
    );
  }
}

/**
 * Decorator para validação de senha forte
 *
 * Use este decorator em campos de senha para garantir que atendam aos requisitos de segurança
 *
 * @param validationOptions - Opções adicionais de validação
 *
 * @example
 * class CreateUserDto {
 *   @IsStrongPassword()
 *   password: string;
 * }
 *
 * @example
 * class ChangePasswordDto {
 *   @IsStrongPassword({
 *     message: 'Nova senha não atende aos requisitos de segurança'
 *   })
 *   new_password: string;
 * }
 */
export function IsStrongPassword(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol): void {
    registerDecorator({
      target: target.constructor,
      propertyName: String(propertyKey),
      options: validationOptions ?? {},
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

/**
 * Retorna lista de erros de validação da senha
 *
 * @param password - Senha a ser validada
 * @returns Array de mensagens de erro (vazio se válida)
 *
 * @example
 * getPasswordValidationErrors('123') // ['Senha deve ter no mínimo 8 caracteres', ...]
 * getPasswordValidationErrors('Senha@123Forte') // []
 */
export function getPasswordValidationErrors(password: string): string[] {
  const errors: string[] = [];

  if (!password) {
    errors.push('Senha é obrigatória');
    return errors;
  }

  const {
    MIN_LENGTH,
    MAX_LENGTH,
    REQUIRE_UPPERCASE,
    REQUIRE_LOWERCASE,
    REQUIRE_NUMBER,
    REQUIRE_SPECIAL_CHAR,
  } = USER_CONSTANTS.PASSWORD;

  if (password.length < MIN_LENGTH) {
    errors.push(`Senha deve ter no mínimo ${MIN_LENGTH} caracteres`);
  }

  if (password.length > MAX_LENGTH) {
    errors.push(`Senha deve ter no máximo ${MAX_LENGTH} caracteres`);
  }

  if (REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }

  if (REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }

  if (REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }

  if (REQUIRE_SPECIAL_CHAR && !SPECIAL_CHARS_REGEX.test(password)) {
    errors.push(`Senha deve conter pelo menos um caractere especial (${PASSWORD_SPECIAL_CHARS})`);
  }

  return errors;
}

/**
 * Função auxiliar para validar força da senha
 *
 * @param password - Senha a ser validada
 * @returns True se senha é forte
 *
 * @example
 * if (!isPasswordStrong('SenhaFraca')) {
 *   throw new Error('Senha não atende aos requisitos');
 * }
 */
export function isPasswordStrong(password: string): boolean {
  return getPasswordValidationErrors(password).length === 0;
}

/**
 * Verifica se a senha contém sequências comuns
 *
 * @param password - Senha a ser verificada
 * @returns True se contém sequências comuns
 */
function hasCommonSequences(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  return COMMON_SEQUENCES.some(seq => lowerPassword.includes(seq));
}

/**
 * Calcula força da senha (0-100)
 *
 * @param password - Senha a ser analisada
 * @returns Score de 0 a 100
 *
 * @example
 * getPasswordStrength('123') // 20
 * getPasswordStrength('Senha@123') // 80
 * getPasswordStrength('S3nh@F0rt3!Compl3x@') // 100
 */
export function getPasswordStrength(password: string): number {
  if (!password) {
    return 0;
  }

  let score = 0;

  const {
    LENGTH_MULTIPLIER,
    LENGTH_MAX,
    UPPERCASE,
    LOWERCASE,
    NUMBER,
    SPECIAL_CHAR,
    UNIQUE_CHARS_MAX,
    PENALTY_REPEATED,
    PENALTY_SEQUENCE,
  } = STRENGTH_SCORES;

  // Comprimento (max 30 pontos)
  score += Math.min(password.length * LENGTH_MULTIPLIER, LENGTH_MAX);

  // Maiúsculas
  if (/[A-Z]/.test(password)) {
    score += UPPERCASE;
  }

  // Minúsculas
  if (/[a-z]/.test(password)) {
    score += LOWERCASE;
  }

  // Números
  if (/\d/.test(password)) {
    score += NUMBER;
  }

  // Caracteres especiais
  if (SPECIAL_CHARS_REGEX.test(password)) {
    score += SPECIAL_CHAR;
  }

  // Variedade de caracteres únicos
  const uniqueChars = new Set([...password]).size;
  score += Math.min(uniqueChars, UNIQUE_CHARS_MAX);

  // Penalidades

  // Sequências repetidas (aaa, 111)
  if (/(.)\1{2,}/.test(password)) {
    score += PENALTY_REPEATED;
  }

  // Sequências comuns
  if (hasCommonSequences(password)) {
    score += PENALTY_SEQUENCE;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Descrições de força da senha
 */
const STRENGTH_DESCRIPTIONS = {
  VERY_WEAK: 'Muito fraca',
  WEAK: 'Fraca',
  MEDIUM: 'Média',
  STRONG: 'Forte',
  VERY_STRONG: 'Muito forte',
} as const;

/**
 * Retorna descrição da força da senha
 *
 * @param password - Senha a ser analisada
 * @returns Descrição da força
 *
 * @example
 * getPasswordStrengthDescription('123') // 'Muito fraca'
 * getPasswordStrengthDescription('Senha@123') // 'Forte'
 */
export function getPasswordStrengthDescription(password: string): string {
  const strength = getPasswordStrength(password);

  if (strength < STRENGTH_THRESHOLDS.VERY_WEAK) {
    return STRENGTH_DESCRIPTIONS.VERY_WEAK;
  }

  if (strength < STRENGTH_THRESHOLDS.WEAK) {
    return STRENGTH_DESCRIPTIONS.WEAK;
  }

  if (strength < STRENGTH_THRESHOLDS.MEDIUM) {
    return STRENGTH_DESCRIPTIONS.MEDIUM;
  }

  if (strength < STRENGTH_THRESHOLDS.STRONG) {
    return STRENGTH_DESCRIPTIONS.STRONG;
  }

  return STRENGTH_DESCRIPTIONS.VERY_STRONG;
}

/**
 * Tipo para resultado detalhado de validação de senha
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: number;
  strengthDescription: string;
}

/**
 * Valida senha e retorna resultado detalhado
 *
 * @param password - Senha a ser validada
 * @returns Objeto com resultado completo da validação
 *
 * @example
 * const result = validatePassword('Senha@123');
 * // {
 * //   isValid: true,
 * //   errors: [],
 * //   strength: 80,
 * //   strengthDescription: 'Forte'
 * // }
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors = getPasswordValidationErrors(password);
  const strength = getPasswordStrength(password);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    strengthDescription: getPasswordStrengthDescription(password),
  };
}
