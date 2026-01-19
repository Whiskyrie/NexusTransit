/**
 * Tabs Component Types
 * Sistema de tabs com acessibilidade completa
 */

import type { LucideIcon } from "lucide-react";

export interface TabItem {
  /**
   * ID único da tab
   */
  id: string;

  /**
   * Label exibido
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
   * Se a tab está desabilitada
   * @default false
   */
  disabled?: boolean;
}

export type TabVariant = "default" | "pills";

export interface TabsProps {
  /**
   * Array de tabs
   */
  items: TabItem[];

  /**
   * ID da tab ativa
   */
  activeTab: string;

  /**
   * Callback quando a tab muda
   */
  onChange: (tabId: string) => void;

  /**
   * Variante visual
   * @default 'default'
   */
  variant?: TabVariant;

  /**
   * Classes CSS adicionais
   */
  className?: string;
}
