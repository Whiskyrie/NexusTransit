/**
 * Button Component Types
 * Type definitions seguindo princípios SOLID
 */

import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Variante visual do botão
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * Tamanho do botão
   * @default 'md'
   */
  size?: ButtonSize;

  /**
   * Se o botão está em estado de loading
   * @default false
   */
  isLoading?: boolean;

  /**
   * Se o botão deve ocupar toda a largura disponível
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Ícone à esquerda do texto
   */
  leftIcon?: LucideIcon;

  /**
   * Ícone à direita do texto
   */
  rightIcon?: LucideIcon;
}
