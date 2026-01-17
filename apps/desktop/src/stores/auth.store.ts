import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, UserPayload } from "../types/auth.types";

interface AuthState {
  user: UserPayload | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setAuth: (data: AuthResponse) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: Partial<UserPayload>) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
};

/**
 * Zustand store para gerenciamento de autenticação
 *
 * Persiste tokens em localStorage de forma segura
 * Gerencia estado global do usuário autenticado
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      /**
       * Define dados de autenticação após login bem-sucedido
       */
      setAuth: (data: AuthResponse) => {
        // Armazena tokens em localStorage (será usado pelo interceptor do axios)
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);

        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      /**
       * Limpa dados de autenticação (logout)
       */
      clearAuth: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        set(initialState);
      },

      /**
       * Define estado de loading
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      /**
       * Atualiza dados do usuário (ex: após atualização de perfil)
       */
      updateUser: (userData: Partial<UserPayload>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: "nexus-auth-storage",
      partialize: (state) => ({
        // Persiste apenas user e tokens
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

/**
 * Selectors otimizados para evitar re-renders desnecessários
 */
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
