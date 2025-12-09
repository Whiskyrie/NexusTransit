/**
 * Tipos de tokens JWT suportados
 *
 * Enumera os diferentes tipos de tokens JWT
 * utilizados no sistema de autenticação.
 */
export enum TokenType {
  /**
   * Access Token
   *
   * Token de acesso de curta duração utilizado
   * para autenticação em requisições API.
   */
  ACCESS = 'ACCESS',

  /**
   * Refresh Token
   *
   * Token de longa duração utilizado para
   * renovar access tokens expirados.
   */
  REFRESH = 'REFRESH',

  /**
   * Token de Recuperação de Senha
   *
   * Token temporário utilizado para
   * redefinir senhas de usuários.
   */
  PASSWORD_RESET = 'PASSWORD_RESET',

  /**
   * Token de Verificação de Email
   *
   * Token utilizado para verificar
   * endereços de email de usuários.
   */
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',

  /**
   * Token de Convite
   *
   * Token utilizado para processos de
   * convite e cadastro de novos usuários.
   */
  INVITE = 'INVITE',
}

/**
 * Verifica se um tipo de token é válido
 *
 * @param tokenType - Tipo de token a ser validado
 * @returns true se o tipo for válido, false caso contrário
 */
export function isValidTokenType(tokenType: string): tokenType is TokenType {
  return Object.values(TokenType).includes(tokenType as TokenType);
}

/**
 * Obtém todos os tipos de tokens disponíveis
 *
 * @returns Array com todos os tipos de tokens
 */
export function getAvailableTokenTypes(): TokenType[] {
  return Object.values(TokenType);
}

/**
 * Traduz o tipo de token para exibição
 *
 * @param tokenType - Tipo de token
 * @returns Nome amigável do tipo de token
 */
export function translateTokenType(tokenType: TokenType): string {
  const translations: Record<TokenType, string> = {
    [TokenType.ACCESS]: 'Access Token',
    [TokenType.REFRESH]: 'Refresh Token',
    [TokenType.PASSWORD_RESET]: 'Token de Recuperação de Senha',
    [TokenType.EMAIL_VERIFICATION]: 'Token de Verificação de Email',
    [TokenType.INVITE]: 'Token de Convite',
  };
  return translations[tokenType] || tokenType;
}

/**
 * Verifica se o token tem expiração curta
 *
 * @param tokenType - Tipo de token
 * @returns true se tem expiração curta, false caso contrário
 */
export function isShortLivedToken(tokenType: TokenType): boolean {
  return tokenType === TokenType.ACCESS;
}

/**
 * Verifica se o token é de recuperação/verificação
 *
 * @param tokenType - Tipo de token
 * @returns true se é token de recuperação/verificação, false caso contrário
 */
export function isRecoveryToken(tokenType: TokenType): boolean {
  return (
    tokenType === TokenType.PASSWORD_RESET ||
    tokenType === TokenType.EMAIL_VERIFICATION ||
    tokenType === TokenType.INVITE
  );
}
