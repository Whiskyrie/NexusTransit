/**
 * NavItem Component Types
 * Item de navegação para sidebar
 */

import type { LucideIcon } from "lucide-react";

export interface NavItemProps {
  /**
   * Ícone do item
   */
  icon: LucideIcon;

  /**
   * Label do item
   */
  label: string;

  /**
   * Rota de navegação
   */
  to?: string;

  /**
   * Badge/contador (opcional)
   */
  badge?: number | string;

  /**
   * Se o item está ativo
   * @default false
   */
  active?: boolean;

  /**
   * Indicador de alerta (!)
   * @default false
   */
  alert?: boolean;

  /**
   * Handler de clique customizado
   */
  onClick?: () => void;

  /**
   * Classes CSS adicionais
   */
  className?: string;

  /**
   * Modo collapsed (apenas ícones)
   * @default false
   */
  collapsed?: boolean;
}
