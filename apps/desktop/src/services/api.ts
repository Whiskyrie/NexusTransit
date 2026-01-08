import axios, { AxiosInstance, AxiosError } from "axios";
import { useAuthStore } from "../stores/auth.store";

/**
 * Configuração base da API
 * Obtém URL do ambiente (VITE_API_URL)
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3033";

/**
 * Flag para evitar múltiplos redirecionamentos
 */
let isRedirecting = false;

/**
 * Instância do Axios configurada
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Interceptor de Request - Adiciona token JWT
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Interceptor de Response - Trata erros globalmente
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;

      // Limpar tokens do localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      // Limpar estado do Zustand
      const { clearAuth } = useAuthStore.getState();
      clearAuth();

      // Redirecionar para login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

/**
 * Interface genérica para respostas paginadas
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_previous: boolean;
    has_next: boolean;
  };
}

/**
 * Helper para construir query strings
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}
