/**
 * Badge Component Styles
 * Estilos isolados seguindo SRP (Single Responsibility Principle)
 */

import type { BadgeVariant, BadgeSize } from "./Badge.types";

export const badgeStyles = {
  base: `
    inline-flex items-center justify-center
    font-medium transition-colors
    whitespace-nowrap
  `,

  variants: {
    default: "bg-gray-100 text-gray-700",
    primary: "bg-orange-50 text-orange-700 border-orange-200",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  } as Record<BadgeVariant, string>,

  sizes: {
    sm: "text-[0.6875rem] px-2 py-0.5 h-5",
    md: "text-[0.75rem] px-2.5 py-1 h-6",
    lg: "text-[0.875rem] px-3 py-1.5 h-7",
  } as Record<BadgeSize, string>,

  pill: "rounded-full",
  square: "rounded-md",
  outlined: "border bg-transparent",
} as const;
