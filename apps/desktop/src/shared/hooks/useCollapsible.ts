/**
 * useCollapsible Hook
 * Gerencia estado de componentes colapsáveis
 * Segue SRP (Single Responsibility Principle)
 *
 * @example
 * const { isOpen, toggle } = useCollapsible(true);
 */

import { useState, useCallback } from "react";

export interface UseCollapsibleReturn {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export function useCollapsible(defaultOpen = true): UseCollapsibleReturn {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, toggle, open, close };
}
