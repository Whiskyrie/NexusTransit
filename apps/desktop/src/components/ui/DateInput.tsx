import { Calendar } from "lucide-react";
import { InputHTMLAttributes, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  variant?: "date" | "datetime-local" | "time";
}

/**
 * Componente de Input de Data
 * Segue o mesmo padrão visual do Input principal
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, label, error, variant = "date", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-[#1A1A1A] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
            <Calendar size={18} strokeWidth={1.5} />
          </div>

          <input
            ref={ref}
            type={variant}
            className={cn(
              "w-full pl-12 pr-4 py-3.5 text-sm text-[#1A1A1A] bg-white border rounded-xl outline-none transition-all duration-200 placeholder:text-[#9CA3AF]",
              error
                ? "border-[#EF4444] shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                : "border-[#E5E7EB] focus:border-[#1A1A1A] focus:shadow-[0_0_0_3px_rgba(26,26,26,0.1)]",
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[#EF4444] mt-1.5">{error}</p>}
      </div>
    );
  },
);

DateInput.displayName = "DateInput";
