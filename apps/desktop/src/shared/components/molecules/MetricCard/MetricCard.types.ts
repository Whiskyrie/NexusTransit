/**
 * MetricCard Component Types
 * Card para exibir métricas e estatísticas
 */

import type { LucideIcon } from "lucide-react";

export type MetricVariant = "primary" | "secondary" | "success" | "warning" | "error" | "info";

export interface MetricTrend {
  /**
   * Valor da tendência (ex: "+12%", "-5%")
   */
  value: string;

  /**
   * Direção da tendência
   */
  direction: "up" | "down" | "neutral";
}

export interface MetricCardProps {
  /**
   * Label/título da métrica
   */
  label: string;

  /**
   * Valor principal da métrica
   */
  value: string | number;

  /**
   * Ícone da métrica
   */
  icon?: LucideIcon;

  /**
   * Variante visual
   * @default 'primary'
   */
  variant?: MetricVariant;

  /**
   * Dados de tendência
   */
  trend?: MetricTrend;

  /**
   * Classes CSS adicionais
   */
  className?: string;

  /**
   * Callback ao clicar no card
   */
  onClick?: () => void;
}
