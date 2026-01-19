/**
 * TabsWithContent Component Types
 * Tabs com gerenciamento de estado e conteúdo
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { TabVariant } from "./Tabs.types";

export interface TabWithContent {
  /**
   * ID único da tab
   */
  id: string;

  /**
   * Label exibido
   */
  label: string;

  /**
   * Conteúdo da tab
   */
  content: ReactNode;

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

export interface TabsWithContentProps {
  /**
   * Array de tabs com conteúdo
   */
  tabs: TabWithContent[];

  /**
   * ID da tab ativa inicial
   */
  defaultTab?: string;

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
