/**
 * Badge Component Types
 * Type definitions seguindo princípios SOLID
 */

import type { PropsWithChildren } from "react";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "error" | "info";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends PropsWithChildren {
  /**
   * Variante visual do badge
   * @default 'default'
   */
  variant?: BadgeVariant;

  /**
   * Tamanho do badge
   * @default 'md'
   */
  size?: BadgeSize;

  /**
   * Classes CSS adicionais
   */
  className?: string;

  /**
   * Se deve renderizar como pill (arredondado completo)
   * @default false
   */
  pill?: boolean;

  /**
   * Se deve ter borda
   * @default false
   */
  outlined?: boolean;
}
