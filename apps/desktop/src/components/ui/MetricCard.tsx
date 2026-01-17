import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: "up" | "down";
  };
  variant?: "primary" | "secondary" | "success" | "warning";
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = "primary",
  className,
}: MetricCardProps) {
  const variants = {
    primary: "bg-[#1A1A1A] text-white",
    secondary: "bg-[#F5F5F0] text-[#1A1A1A]",
    success: "bg-[#ECFDF5] text-[#10B981]",
    warning: "bg-[#FEF3C7] text-[#F59E0B]",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-5 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
          variants[variant],
        )}
      >
        <Icon className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold text-[#1A1A1A] leading-tight truncate">{value}</div>
        <div className="text-[13px] font-medium text-[#6B6B6B] mt-1 truncate">{label}</div>
      </div>

      {trend && (
        <div className="self-start ml-auto">
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend.direction === "up" ? "text-[#10B981]" : "text-[#EF4444]",
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{trend.value}</span>
          </div>
        </div>
      )}
    </div>
  );
}
