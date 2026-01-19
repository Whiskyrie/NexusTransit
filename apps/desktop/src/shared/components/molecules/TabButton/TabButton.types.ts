/**
 * TabButton Component Types
 * Botão individual de tab
 */

import type { LucideIcon } from "lucide-react";

export interface TabButtonProps {
  /**
   * ID único da tab
   */
  id: string;

  /**
   * Label da tab
   */
  label: string;

  /**
   * Ícone opcional
   */
  icon?: LucideIcon;

  /**
   * Badge/contador opcional
   */
  badge?: number | string;

  /**
   * Se a tab está ativa
   */
  active: boolean;

  /**
   * Se a tab está desabilitada
   * @default false
   */
  disabled?: boolean;

  /**
   * Handler de clique
   */
  onClick: () => void;

  /**
   * Handler de navegação por teclado
   */
  onKeyDown?: (event: React.KeyboardEvent) => void;

  /**
   * Classes CSS adicionais
   */
  className?: string;
}
