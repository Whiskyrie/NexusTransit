/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Font Family
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Monaco", "Cascadia Code", "monospace"],
      },

      // Colors (baseado nos design tokens)
      colors: {
        // Brand Colors
        brand: {
          primary: "#F97316",
          secondary: "#3B82F6",
          tertiary: "#8B5CF6",
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

      // Border Radius
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },

      // Shadows
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        dropdown: "0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
        modal: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
      },

      // Animation
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-from-top": {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-in-from-top": "slide-in-from-top 200ms ease-out",
      },
    },
  },
  plugins: [],
};
