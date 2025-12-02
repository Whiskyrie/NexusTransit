/**
 * Provedores de autenticação suportados
 *
 * Enumera os diferentes provedores de autenticação
 * que podem ser utilizados no sistema NexusTransit.
 */
export enum AuthProvider {
  /**
   * Autenticação local (email/senha)
   *
   * Autenticação tradicional usando email e senha
   * armazenados localmente no banco de dados.
   */
  LOCAL = 'LOCAL',

  /**
   * Google OAuth
   *
   * Autenticação via Google OAuth 2.0
   * Permite login com conta Google.
   */
  GOOGLE = 'GOOGLE',

  /**
   * Microsoft OAuth
   *
   * Autenticação via Microsoft Azure AD
   * Permite login com conta corporativa Microsoft.
   */
  MICROSOFT = 'MICROSOFT',

  /**
   * SSO Corporativo
   *
   * Autenticação Single Sign-On corporativo
   * Integrado com sistemas de identidade empresarial.
   */
  SSO = 'SSO',
}

/**
 * Verifica se um provedor de autenticação é válido
 *
 * @param provider - Provedor a ser validado
 * @returns true se o provedor for válido, false caso contrário
 */
export function isValidAuthProvider(provider: string): provider is AuthProvider {
  return Object.values(AuthProvider).includes(provider as AuthProvider);
}

/**
 * Obtém todos os provedores de autenticação disponíveis
 *
 * @returns Array com todos os provedores de autenticação
 */
export function getAvailableAuthProviders(): AuthProvider[] {
  return Object.values(AuthProvider);
}

/**
 * Traduz o nome do provedor de autenticação para exibição
 *
 * @param provider - Provedor de autenticação
 * @returns Nome amigável do provedor
 */
export function translateAuthProvider(provider: AuthProvider): string {
  const translations: Record<AuthProvider, string> = {
    [AuthProvider.LOCAL]: 'Autenticação Local',
    [AuthProvider.GOOGLE]: 'Google',
    [AuthProvider.MICROSOFT]: 'Microsoft',
    [AuthProvider.SSO]: 'SSO Corporativo',
  };
  return translations[provider] || provider;
}

/**
 * Verifica se o provedor requer redirecionamento externo
 *
 * @param provider - Provedor de autenticação
 * @returns true se requer redirecionamento, false caso contrário
 */
export function requiresExternalRedirect(provider: AuthProvider): boolean {
  return provider !== AuthProvider.LOCAL;
}
