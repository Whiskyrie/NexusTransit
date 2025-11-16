/**
 * Constantes do módulo de autenticação
 *
 * Define valores constantes utilizados nas operações de autenticação
 * e autorização do sistema NexusTransit.
 */
export const AUTH_CONSTANTS = {
  /**
   * Tempo de expiração do access token (segundos)
   * Equivale a 1 hora
   */
  ACCESS_TOKEN_EXPIRATION: 3600,

  /**
   * Tempo de expiração do refresh token (segundos)
   * Equivale a 7 dias
   */
  REFRESH_TOKEN_EXPIRATION: 604800,

  /**
   * Salt rounds para bcrypt
   * Número de rounds para hash de senhas - equilíbrio entre segurança e performance
   */
  BCRYPT_ROUNDS: 10,

  /**
   * Prefixo do token no header de autorização
   */
  TOKEN_PREFIX: 'Bearer',

  /**
   * Nome do header de autorização HTTP
   */
  AUTH_HEADER: 'Authorization',

  /**
   * Nome do header para refresh token
   */
  REFRESH_TOKEN_HEADER: 'X-Refresh-Token',

  /**
   * Tempo máximo para validade de tokens em cache (segundos)
   * Equivale a 1 dia
   */
  TOKEN_CACHE_TTL: 86400,

  /**
   * Tentativas máximas de login antes do bloqueio
   */
  MAX_LOGIN_ATTEMPTS: 5,

  /**
   * Tempo de bloqueio por tentativas excessivas (segundos)
   * Equivale a 15 minutos
   */
  BLOCK_DURATION: 900,

  /**
   * Tempo mínimo entre tentativas de login (segundos)
   * Equivale a 2 segundos
   */
  MIN_TIME_BETWEEN_ATTEMPTS: 2,

  /**
   * Comprimento mínimo da senha
   */
  MIN_PASSWORD_LENGTH: 8,

  /**
   * Comprimento máximo da senha
   */
  MAX_PASSWORD_LENGTH: 128,

  /**
   * Tempo de expiração do token de recuperação de senha (segundos)
   * Equivale a 1 hora
   */
  PASSWORD_RESET_TOKEN_EXPIRATION: 3600,

  /**
   * Tempo de expiração do token de verificação de email (segundos)
   * Equivale a 24 horas
   */
  EMAIL_VERIFICATION_TOKEN_EXPIRATION: 86400,

  /**
   * Quantidade de tokens por página na listagem
   */
  TOKENS_PER_PAGE: 20,

  /**
   * Quantidade máxima de refresh tokens por usuário
   */
  MAX_REFRESH_TOKENS_PER_USER: 5,

  /**
   * Prefixo para chaves de cache de tentativas de login
   */
  LOGIN_ATTEMPTS_CACHE_PREFIX: 'login_attempts:',

  /**
   * Prefixo para chaves de cache de tokens bloqueados
   */
  BLOCKED_TOKENS_CACHE_PREFIX: 'blocked_tokens:',

  /**
   * Prefixo para chaves de cache de refresh tokens
   */
  REFRESH_TOKENS_CACHE_PREFIX: 'refresh_tokens:',

  /**
   * Nome da política de autorização para rotas administrativas
   */
  ADMIN_POLICY: 'admin',

  /**
   * Nome da política de autorização para rotas de usuário
   */
  USER_POLICY: 'user',

  /**
   * Nome da política de autorização para rotas públicas
   */
  PUBLIC_POLICY: 'public',
} as const;

/**
 * Tipos de tokens suportados
 */
export type TokenType = 'access' | 'refresh' | 'password_reset' | 'email_verification';

/**
 * Configurações de expiração por tipo de token
 */
export const TOKEN_EXPIRATION_CONFIG: Record<TokenType, number> = {
  access: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRATION,
  refresh: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRATION,
  password_reset: AUTH_CONSTANTS.PASSWORD_RESET_TOKEN_EXPIRATION,
  email_verification: AUTH_CONSTANTS.EMAIL_VERIFICATION_TOKEN_EXPIRATION,
};
