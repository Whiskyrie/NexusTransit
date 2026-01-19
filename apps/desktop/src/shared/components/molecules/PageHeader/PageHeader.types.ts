/**
 * PageHeader Component Types
 */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface PageHeaderProps {
  /**
   * Título da página
   */
  title: string;

  /**
   * Descrição opcional
   */
  description?: string;

  /**
   * Subtítulo opcional (alias para description)
   */
  subtitle?: string;

  /**
   * Ícone opcional
   */
  icon?: LucideIcon;

  /**
   * Cor do ícone
   * @default 'primary'
   */
  iconColor?: "primary" | "success" | "warning" | "error" | "info";

  /**
   * Ações do header (botões, etc)
   */
  actions?: ReactNode;

  /**
   * Breadcrumbs de navegação
   */
  breadcrumbs?: Array<{
    label: string;
    to?: string;
  }>;
}
