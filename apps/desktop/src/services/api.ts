import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
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
 * Flag para controlar o estado de refresh
 */
let isRefreshing = false;

/**
 * Fila de requisições falhas aguardando refresh
 */
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

/**
 * Processa a fila de requisições após refresh
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

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
 * Interceptor de Response - Trata erros globalmente e realiza Refresh Token
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Ignora erros que não sejam 401 ou se já estiver redirecionando
    if (error.response?.status !== 401 || isRedirecting) {
      return Promise.reject(error);
    }

    // Se o erro for na própria rota de refresh ou login, faz logout direto
    if (originalRequest.url?.includes("/auth/refresh") || originalRequest.url?.includes("/auth/login")) {
      return handleLogout(error);
    }

    // Se já houve tentativa de retry, falha (evita loop infinito)
    if (originalRequest._retry) {
      return handleLogout(error);
    }

    // Se já está rolando um refresh, coloca na fila
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      return handleLogout(error);
    }

    try {
      // Faz a chamada de refresh usando axios puro para não passar pelos interceptors da instância `api`
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: newRefreshToken } = response.data;

      // Salva novos tokens
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", newRefreshToken);

      // Atualiza o store
      // Precisamos garantir que estamos chamando a action correta.
      // Como setAuth espera a resposta completa, passamos data.
      useAuthStore.getState().setAuth(response.data);

      // Atualiza headers padrão (opcional, já que o request interceptor pega do localStorage)
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
      }

      // Processa a fila com sucesso
      processQueue(null, access_token);
      isRefreshing = false;

      // Re-executa a requisição original
      return api(originalRequest);
    } catch (refreshError) {
      // Se falhar o refresh, processa fila com erro e desloga
      processQueue(refreshError, null);
      isRefreshing = false;
      return handleLogout(error);
    }
  },
);

/**
 * Helper para realizar logout e redirecionar
 */
const handleLogout = (error: any) => {
  if (!isRedirecting) {
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
};

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

