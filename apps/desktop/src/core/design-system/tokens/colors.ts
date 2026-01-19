/**
 * Design Tokens - Colors
 * Definição centralizada de todas as cores do design system
 * Baseado em tema claro com inspiração Linear/Inter
 */

export const colors = {
  // Background Colors
  background: {
    primary: "#FFFFFF",
    secondary: "#F9FAFB",
    tertiary: "#F3F4F6",
    card: "#FFFFFF",
    hover: "#F9FAFB",
    active: "#F3F4F6",
  },

  // Text Colors
  text: {
    primary: "#1A1A1A",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    muted: "#D1D5DB",
    inverse: "#FFFFFF",
    link: "#1E3A8A",
  },

  // Border Colors
  border: {
    light: "#F3F4F6",
    default: "#E5E7EB",
    strong: "#D1D5DB",
    focus: "#1E3A8A",
  },

  // Brand Colors
  brand: {
    primary: "#1E3A8A", // Navy Blue
    secondary: "#3B82F6", // Blue
    tertiary: "#8B5CF6", // Purple
  },

  // Status Colors
  status: {
    success: {
      default: "#22C55E",
      light: "#DCFCE7",
      dark: "#15803D",
    },
    warning: {
      default: "#EAB308",
      light: "#FEF3C7",
      dark: "#A16207",
    },
    error: {
      default: "#EF4444",
      light: "#FEE2E2",
      dark: "#B91C1C",
    },
    info: {
      default: "#3B82F6",
      light: "#DBEAFE",
      dark: "#1E40AF",
    },
  },

  // Severity Colors (Incidents)
  severity: {
    low: {
      background: "#DBEAFE",
      text: "#1E40AF",
      border: "#93C5FD",
    },
    medium: {
      background: "#FEF3C7",
      text: "#A16207",
      border: "#FCD34D",
    },
    high: {
      background: "#FED7AA",
      text: "#C2410C",
      border: "#FB923C",
    },
    critical: {
      background: "#FEE2E2",
      text: "#B91C1C",
      border: "#FCA5A5",
    },
  },

  // Gray Scale
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
    950: "#0D0D0D",
  },

  // Sidebar Specific
  sidebar: {
    background: "#FAFAFA",
    border: "#E5E7EB",
    hover: "#F3F4F6",
    active: "#F97316",
    activeBackground: "#FFF7ED",
    text: "#6B7280",
    textActive: "#F97316",
  },
} as const;

export type ColorToken = typeof colors;
export type BackgroundColor = keyof typeof colors.background;
export type TextColor = keyof typeof colors.text;
export type BorderColor = keyof typeof colors.border;
export type BrandColor = keyof typeof colors.brand;
export type StatusColor = keyof typeof colors.status;
