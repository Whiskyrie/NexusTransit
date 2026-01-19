/**
 * Card Component Styles
 */

import type { CardVariant, CardPadding } from "./Card.types";

export const cardStyles = {
  base: `
    bg-white rounded-xl
    transition-all duration-200
  `,

  variants: {
    default: "border border-gray-100",
    bordered: "border border-gray-200",
    elevated: "shadow-card border border-gray-100",
  } as Record<CardVariant, string>,

  padding: {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  } as Record<CardPadding, string>,

  hoverable: "hover:shadow-lg hover:border-gray-200",
  clickable: "cursor-pointer",
} as const;

export const cardHeaderStyles = {
  base: "flex items-start justify-between gap-4",
  titleContainer: "flex-1 min-w-0",
  title: "text-lg font-semibold text-gray-900",
  subtitle: "text-sm text-gray-500 mt-1",
  actions: "flex items-center gap-2 shrink-0",
} as const;

export const cardBodyStyles = {
  base: "",
} as const;

export const cardFooterStyles = {
  base: "flex items-center justify-between gap-4 pt-4 border-t border-gray-100",
} as const;
