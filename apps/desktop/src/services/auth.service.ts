import { api } from "./api";
import type { AuthResponse, LoginCredentials } from "../types/auth.types";

/**
 * Serviço de autenticação
 *
 * Gerencia todas as operações relacionadas à autenticação
 */
export const authService = {
  /**
   * Realiza login com email e senha
   *
   * @param credentials - Email e senha do usuário
   * @returns Dados de autenticação (tokens + user)
   * @throws Erro se credenciais inválidas
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  },

  /**
   * Realiza logout (revoga tokens no backend)
   */
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Ignora erros no logout (ex: token já expirado)
      console.warn("Erro ao fazer logout no servidor:", error);
    }
  },

  /**
   * Renova access token usando refresh token
   *
   * @param refreshToken - Token de refresh
   * @returns Novos tokens
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  /**
   * Valida se o token atual ainda é válido
   *
   * @returns True se autenticado
   */
  async validateToken(): Promise<boolean> {
    try {
      await api.get("/auth/validate");
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Solicita redefinição de senha
   *
   * @param email - Email do usuário
   */
  async forgotPassword(email: string): Promise<void> {
    await api.post("/auth/forgot-password", { email });
  },

  /**
   * Redefine senha usando token recebido por email
   *
   * @param token - Token de reset
   * @param newPassword - Nova senha
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post("/auth/reset-password", {
      token,
      password: newPassword,
    });
  },
};
