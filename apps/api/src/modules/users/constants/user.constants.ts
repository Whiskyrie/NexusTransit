/**
 * Constantes para o módulo de usuários
 */

/**
 * Caracteres especiais permitidos em senhas
 */
export const PASSWORD_SPECIAL_CHARS = '!@#$%^&*(),.?":{}|<>' as const;

/**
 * Regex para validação de email (RFC 5322 simplificado)
 */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Regex para validação de telefone
 */
export const PHONE_REGEX = /^[0-9\s\-+()]+$/;

/**
 * Configurações de senha e segurança
 */
export const USER_CONSTANTS = {
  /**
   * Requisitos de senha
   */
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: true,
    SPECIAL_CHARS: PASSWORD_SPECIAL_CHARS,
  },

  /**
   * Configurações de segurança
   */
  SECURITY: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 30,
    SESSION_TIMEOUT_MINUTES: 120,
    PASSWORD_RESET_TOKEN_EXPIRY_HOURS: 24,
    EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS: 48,
    BCRYPT_SALT_ROUNDS: 10,
  },

  /**
   * Limites do sistema
   */
  LIMITS: {
    MAX_ACTIVE_SESSIONS: 3,
    MAX_FAILED_ATTEMPTS_BEFORE_CAPTCHA: 3,
    MAX_PASSWORD_HISTORY: 5,
  },

  /**
   * Validações de email
   */
  EMAIL: {
    MAX_LENGTH: 255,
  },

  /**
   * Validações de nome
   */
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },

  /**
   * Validações de telefone
   */
  PHONE: {
    MAX_LENGTH: 20,
  },
} as const;

/**
 * Mensagens de erro padronizadas
 */
export const USER_ERROR_MESSAGES = {
  NOT_FOUND: 'Usuário não encontrado',
  ALREADY_EXISTS: 'Email já está em uso',
  INVALID_CREDENTIALS: 'Email ou senha inválidos',
  BLOCKED: 'Usuário bloqueado. Contate o administrador',
  INACTIVE: 'Usuário inativo. Contate o administrador',
  EMAIL_NOT_VERIFIED: 'Email não verificado. Verifique sua caixa de entrada',
  WEAK_PASSWORD: 'Senha não atende aos requisitos de segurança',
  ACCOUNT_LOCKED: 'Conta temporariamente bloqueada por múltiplas tentativas de login',
  INVALID_TOKEN: 'Token inválido ou expirado',
  PASSWORD_RESET_EXPIRED: 'Token de recuperação de senha expirado',
  EMAIL_VERIFICATION_EXPIRED: 'Token de verificação de email expirado',
  SAME_PASSWORD: 'Nova senha não pode ser igual à senha atual',
  PASSWORD_IN_HISTORY: 'Esta senha já foi utilizada recentemente',
} as const;

/**
 * Mensagens de sucesso
 */
export const USER_SUCCESS_MESSAGES = {
  CREATED: 'Usuário criado com sucesso',
  UPDATED: 'Usuário atualizado com sucesso',
  DELETED: 'Usuário removido com sucesso',
  PASSWORD_CHANGED: 'Senha alterada com sucesso',
  EMAIL_VERIFIED: 'Email verificado com sucesso',
  PASSWORD_RESET_SENT: 'Email de recuperação de senha enviado',
  VERIFICATION_EMAIL_SENT: 'Email de verificação enviado',
} as const;

/**
 * Chaves para metadados e cache
 */
export const USER_METADATA_KEYS = {
  TRACK_ACTIVITY: 'track_user_activity',
  AUDIT_OPERATIONS: 'audit_user_operations',
  VALIDATE_EMAIL_UNIQUE: 'validate_email_unique',
  VALIDATE_PASSWORD_STRENGTH: 'validate_password_strength',
} as const;

/**
 * Prefixos para cache
 */
export const USER_CACHE_PREFIXES = {
  USER_BY_ID: 'user:id:',
  USER_BY_EMAIL: 'user:email:',
  USER_SESSIONS: 'user:sessions:',
  USER_LOGIN_ATTEMPTS: 'user:login_attempts:',
} as const;

/**
 * TTL de cache (em segundos)
 */
export const USER_CACHE_TTL = {
  USER_DATA: 300, // 5 minutos
  USER_SESSIONS: 7200, // 2 horas
  LOGIN_ATTEMPTS: 1800, // 30 minutos
} as const;

/**
 * Tipos derivados das constantes
 */
export type UserErrorMessage = (typeof USER_ERROR_MESSAGES)[keyof typeof USER_ERROR_MESSAGES];
export type UserSuccessMessage = (typeof USER_SUCCESS_MESSAGES)[keyof typeof USER_SUCCESS_MESSAGES];
export type UserCachePrefix = (typeof USER_CACHE_PREFIXES)[keyof typeof USER_CACHE_PREFIXES];
