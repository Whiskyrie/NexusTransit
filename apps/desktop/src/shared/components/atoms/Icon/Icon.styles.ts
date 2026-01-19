/**
 * Icon Component Styles
 */

import type { IconSize, IconColor } from "./Icon.types";

export const iconSizes: Record<IconSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

export const iconColors: Record<IconColor, string> = {
  default: "text-gray-900",
  primary: "text-orange-600",
  secondary: "text-blue-600",
  muted: "text-gray-500",
  success: "text-green-600",
  warning: "text-yellow-600",
  error: "text-red-600",
};
