/**
 * Button Component Styles
 * Estilos isolados usando design tokens
 */

import type { ButtonVariant, ButtonSize } from "./Button.types";

export const buttonStyles = {
  base: `
    inline-flex items-center justify-center gap-2
    font-semibold rounded-xl
    transition-all duration-200
    focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-60
    cursor-pointer active:scale-95
  `,

  variants: {
    primary: `
      bg-gray-900 text-white
      hover:bg-black hover:-translate-y-0.5 
      hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]
      active:translate-y-0 active:shadow-none
      disabled:bg-gray-300 disabled:transform-none disabled:shadow-none
    `,
    secondary: `
      bg-orange-50 text-orange-700 border border-orange-200
      hover:bg-orange-100 hover:border-orange-300
      active:bg-orange-100
      disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200
    `,
    outline: `
      bg-white text-gray-900 border border-gray-200
      hover:bg-gray-50 hover:border-gray-300
      active:bg-gray-100
      disabled:bg-gray-50 disabled:text-gray-400
    `,
    ghost: `
      bg-transparent text-gray-700
      hover:bg-gray-100
      active:bg-gray-200
      disabled:bg-transparent disabled:text-gray-400
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700 hover:-translate-y-0.5
      hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)]
      active:translate-y-0 active:shadow-none
      disabled:bg-red-300 disabled:transform-none disabled:shadow-none
    `,
    success: `
      bg-green-600 text-white
      hover:bg-green-700 hover:-translate-y-0.5
      hover:shadow-[0_4px_12px_rgba(34,197,94,0.3)]
      active:translate-y-0 active:shadow-none
      disabled:bg-green-300 disabled:transform-none disabled:shadow-none
    `,
  } as Record<ButtonVariant, string>,

  sizes: {
    sm: "text-sm px-3 py-2 h-9",
    md: "text-sm px-4 py-2.5 h-10",
    lg: "text-base px-6 py-3 h-12",
  } as Record<ButtonSize, string>,

  fullWidth: "w-full",
} as const;
