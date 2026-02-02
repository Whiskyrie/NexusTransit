import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { tokens } from "@/styles/tokens";

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
  isLoading?: boolean;
}

// Skeleton loader component
function MetricCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-pulse">
      <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-7 bg-gray-200 rounded w-20" />
        <div className="h-4 bg-gray-200 rounded w-28" />
      </div>
      <div className="w-12 h-5 bg-gray-200 rounded" />
    </div>
  );
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = "primary",
  className,
  isLoading = false,
}: MetricCardProps) {
  const variants = {
    primary: `bg-[${tokens.colors.metric.primary.bg}] text-[${tokens.colors.metric.primary.text}]`,
    secondary: `bg-[${tokens.colors.metric.secondary.bg}] text-[${tokens.colors.metric.secondary.text}]`,
    success: `bg-[${tokens.colors.metric.success.bg}] text-[${tokens.colors.metric.success.text}]`,
    warning: `bg-[${tokens.colors.metric.warning.bg}] text-[${tokens.colors.metric.warning.text}]`,
  };

  if (isLoading) {
    return <MetricCardSkeleton />;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-5 bg-white rounded-2xl shadow-card transition-shadow duration-200 hover:shadow-lg",
        className,
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105",
          variants[variant],
        )}
      >
        <Icon className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="text-2xl font-bold leading-tight truncate"
          style={{ color: tokens.colors.text.primary }}
        >
          {value}
        </div>
        <div
          className="text-[13px] font-medium mt-1 truncate"
          style={{ color: tokens.colors.text.secondary }}
        >
          {label}
        </div>
      </div>

      {trend && (
        <div className="self-start ml-auto">
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium transition-colors duration-200",
              trend.direction === "up"
                ? `text-[${tokens.colors.status.success.main}]`
                : `text-[${tokens.colors.status.error.main}]`,
            )}
            style={{
              color:
                trend.direction === "up"
                  ? tokens.colors.status.success.main
                  : tokens.colors.status.error.main,
            }}
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

export { MetricCardSkeleton };
