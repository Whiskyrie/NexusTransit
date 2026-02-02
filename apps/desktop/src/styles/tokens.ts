/**
 * Design Tokens - Sistema de Design NexusTransit
 *
 * Tokens centralizados para garantir consistência visual em toda aplicação
 */

export const tokens = {
  // ========================================
  // COLORS
  // ========================================
  colors: {
    // Brand
    brand: {
      primary: "#F97316", // Orange 500
      secondary: "#3B82F6", // Blue 500
      tertiary: "#8B5CF6", // Purple 500
    },

    // Backgrounds
    background: {
      primary: "#FFFFFF",
      secondary: "#FAFAFA",
      tertiary: "#F5F5F5",
      card: "#FFFFFF",
      hover: "#F3F4F6",
      active: "#FFF7ED",
    },

    // Text
    text: {
      primary: "#1A1A1A", // Gray 900
      secondary: "#6B6B6B", // Gray 600
      tertiary: "#9CA3AF", // Gray 400
      inverse: "#FFFFFF",
      muted: "#6B7280",
    },

    // Borders
    border: {
      default: "#E5E7EB", // Gray 200
      light: "#F3F4F6", // Gray 100
      dark: "#D1D5DB", // Gray 300
    },

    // Status
    status: {
      success: {
        main: "#10B981", // Green 500
        light: "#ECFDF5", // Green 50
        dark: "#059669", // Green 600
      },
      warning: {
        main: "#F59E0B", // Amber 500
        light: "#FEF3C7", // Amber 100
        dark: "#D97706", // Amber 600
      },
      error: {
        main: "#EF4444", // Red 500
        light: "#FEE2E2", // Red 100
        dark: "#DC2626", // Red 600
      },
      info: {
        main: "#3B82F6", // Blue 500
        light: "#DBEAFE", // Blue 100
        dark: "#2563EB", // Blue 600
      },
    },

    // Charts
    chart: {
      primary: "#3B82F6", // Blue 500
      secondary: "#F59E0B", // Amber 500
      tertiary: "#10B981", // Green 500
      grid: "#E5E7EB", // Gray 200
      tooltip: {
        background: "#1F2937", // Gray 800
        text: "#FFFFFF",
      },
    },

    // Metric Card Variants
    metric: {
      primary: {
        bg: "#1A1A1A",
        text: "#FFFFFF",
      },
      secondary: {
        bg: "#F5F5F0",
        text: "#1A1A1A",
      },
      success: {
        bg: "#ECFDF5",
        text: "#10B981",
      },
      warning: {
        bg: "#FEF3C7",
        text: "#F59E0B",
      },
    },

    // Sidebar
    sidebar: {
      background: "#FAFAFA",
      border: "#E5E7EB",
      hover: "#F3F4F6",
      active: "#F97316",
      activeBackground: "#FFF7ED",
      text: "#6B7280",
      textActive: "#F97316",
    },
  },

  // ========================================
  // SPACING
  // ========================================
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "0.75rem", // 12px
    lg: "1rem", // 16px
    xl: "1.5rem", // 24px
    "2xl": "2rem", // 32px
    "3xl": "3rem", // 48px
    "4xl": "4rem", // 64px
  },

  // ========================================
  // BORDER RADIUS
  // ========================================
  borderRadius: {
    sm: "0.375rem", // 6px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
    "2xl": "1.5rem", // 24px
    full: "9999px",
  },

  // ========================================
  // SHADOWS
  // ========================================
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 2px 8px rgba(0, 0, 0, 0.04)",
    lg: "0 4px 12px rgba(0, 0, 0, 0.08)",
    xl: "0 8px 16px rgba(0, 0, 0, 0.12)",
    card: "0 2px 8px rgba(0, 0, 0, 0.04)",
    dropdown: "0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
    modal: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
    tooltip: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },

  // ========================================
  // TYPOGRAPHY
  // ========================================
  typography: {
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.813rem", // 13px
      base: "0.875rem", // 14px
      md: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // ========================================
  // TRANSITIONS
  // ========================================
  transitions: {
    fast: "150ms ease-in-out",
    normal: "200ms ease-in-out",
    slow: "300ms ease-in-out",
  },

  // ========================================
  // BREAKPOINTS
  // ========================================
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
} as const;

export type Tokens = typeof tokens;

// Helper type for color access
export type ColorPath =
  | keyof typeof tokens.colors.brand
  | keyof typeof tokens.colors.background
  | keyof typeof tokens.colors.text
  | keyof typeof tokens.colors.border;
