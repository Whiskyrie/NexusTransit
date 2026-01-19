/**
 * Card Component Types
 */

import type { HTMLAttributes, ReactNode } from "react";

export type CardVariant = "default" | "bordered" | "elevated";

export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Variante visual do card
   * @default 'default'
   */
  variant?: CardVariant;

  /**
   * Padding interno do card
   * @default 'md'
   */
  padding?: CardPadding;

  /**
   * Se o card deve ter efeito hover
   * @default false
   */
  hoverable?: boolean;

  /**
   * Se o card é clicável (adiciona cursor pointer)
   * @default false
   */
  clickable?: boolean;

  /**
   * Conteúdo do card
   */
  children: ReactNode;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Título do card
   */
  title: string;

  /**
   * Subtítulo opcional
   */
  subtitle?: string;

  /**
   * Ações do header (botões, etc)
   */
  actions?: ReactNode;
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Conteúdo do body
   */
  children: ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Conteúdo do footer
   */
  children: ReactNode;
}
