/**
 * Icon Wrapper Component Types
 * Wrapper type-safe para lucide-react icons
 */

import type { LucideProps, LucideIcon } from "lucide-react";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";
export type IconColor =
  | "default"
  | "primary"
  | "secondary"
  | "muted"
  | "success"
  | "warning"
  | "error";

export interface IconProps extends Omit<LucideProps, "size" | "color"> {
  /**
   * Ícone do lucide-react
   */
  icon: LucideIcon;

  /**
   * Tamanho pré-definido do ícone
   * @default 'md'
   */
  size?: IconSize;

  /**
   * Cor semântica do ícone
   * @default 'default'
   */
  color?: IconColor;

  /**
   * Classes CSS adicionais
   */
  className?: string;
}
