/**
 * Navigation Service
 * Lógica de negócio da navegação (Clean Architecture - Use Cases)
 */

import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import { navigationConfig } from "./navigation.config";
import type { NavItemConfig } from "./navigation.config";

/**
 * Hook para detectar rota ativa
 */
export function useActiveRoute(): string {
  const location = useLocation();
  return location.pathname;
}

/**
 * Hook para encontrar item de navegação ativo
 */
export function useActiveNavItem(): NavItemConfig | null {
  const activePath = useActiveRoute();

  return useMemo(() => {
    for (const section of navigationConfig) {
      const activeItem = section.items.find((item) => item.to === activePath);
      if (activeItem) return activeItem;
    }
    return null;
  }, [activePath]);
}

/**
 * Valida se uma rota está ativa
 */
export function isRouteActive(routePath: string, currentPath: string): boolean {
  return currentPath === routePath;
}
