/**
 * useTabNavigation Hook
 * Gerencia navegação por teclado nas tabs (acessibilidade)
 * Implementa padrão WAI-ARIA Tabs
 */

import { useCallback, useMemo } from "react";
import type { TabItem } from "./Tabs.types";

export function useTabNavigation(
  items: TabItem[],
  activeTab: string,
  onChange: (tabId: string) => void,
) {
  // Índice da tab ativa
  const activeIndex = useMemo(
    () => items?.findIndex((item) => item.id === activeTab) ?? -1,
    [items, activeTab],
  );

  // Handler de mudança de tab (valida disabled)
  const handleTabChange = useCallback(
    (tabId: string) => {
      if (!items) return;
      const tab = items.find((item) => item.id === tabId);
      if (tab && !tab.disabled) {
        onChange(tabId);
      }
    },
    [items, onChange],
  );

  // Navegação por setas (ArrowLeft/ArrowRight)
  const handleKeyNavigation = useCallback(
    (event: React.KeyboardEvent, currentId: string) => {
      if (!items || items.length === 0) return;

      const currentIndex = items.findIndex((item) => item.id === currentId);
      let nextIndex = currentIndex;

      switch (event.key) {
        case "ArrowLeft":
          // Volta para a tab anterior (circular)
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          break;
        case "ArrowRight":
          // Avança para próxima tab (circular)
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          break;
        case "Home":
          // Vai para primeira tab
          nextIndex = 0;
          break;
        case "End":
          // Vai para última tab
          nextIndex = items.length - 1;
          break;
        default:
          return; // Não prevenir outras teclas
      }

      event.preventDefault();

      // Encontra próxima tab não-desabilitada
      let attempts = 0;
      while (attempts < items.length) {
        const nextTab = items[nextIndex];
        if (nextTab && !nextTab.disabled) {
          onChange(nextTab.id);
          return;
        }
        // Se desabilitada, tenta próxima
        nextIndex =
          event.key === "ArrowLeft" || event.key === "Home"
            ? (nextIndex - 1 + items.length) % items.length
            : (nextIndex + 1) % items.length;
        attempts++;
      }
    },
    [items, onChange],
  );

  return {
    activeIndex,
    handleTabChange,
    handleKeyNavigation,
  };
}
