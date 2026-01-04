import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "outline" | "ghost";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, children, isLoading, variant = "primary", fullWidth = false, disabled, ...props },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl text-[15px] font-semibold transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70";

    const variants = {
      primary:
        "bg-[#1A1A1A] text-white hover:bg-black hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:translate-y-0 active:shadow-none disabled:bg-[#D1D5DB] disabled:transform-none disabled:shadow-none",
      outline:
        "bg-white text-[#1A1A1A] border border-[#E5E7EB] hover:bg-[#F9FAFB] hover:border-[#D1D5DB]",
      ghost: "bg-transparent text-[#1A1A1A] hover:bg-[#F5F5F0]",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          fullWidth ? "w-full" : "",
          "px-6 py-4", // Default padding from design
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
