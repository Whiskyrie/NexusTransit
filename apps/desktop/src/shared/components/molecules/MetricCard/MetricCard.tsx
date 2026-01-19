/**
 * MetricCard Component
 * Card para exibir métricas, estatísticas e KPIs
 *
 * @example
 * <MetricCard
 *   label="Entregas Hoje"
 *   value={145}
 *   icon={Truck}
 *   variant="primary"
 *   trend={{ value: "+12%", direction: "up" }}
 * />
 */

import { memo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "../../atoms/Card";
import { cn } from "../../../utils";
import type { MetricCardProps } from "./MetricCard.types";

const variantStyles = {
  primary: {
    icon: "text-blue-900 bg-blue-50",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-gray-500",
    },
  },
  secondary: {
    icon: "text-gray-700 bg-gray-100",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-gray-500",
    },
  },
  success: {
    icon: "text-green-700 bg-green-50",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-gray-500",
    },
  },
  warning: {
    icon: "text-amber-700 bg-amber-50",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-gray-500",
    },
  },
  error: {
    icon: "text-red-700 bg-red-50",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-gray-500",
    },
  },
  info: {
    icon: "text-blue-700 bg-blue-50",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-gray-500",
    },
  },
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export const MetricCard = memo<MetricCardProps>(function MetricCard({
  label,
  value,
  icon: Icon,
  variant = "primary",
  trend,
  className,
  onClick,
}) {
  const styles = variantStyles[variant];
  const TrendIcon = trend ? trendIcons[trend.direction] : null;

  return (
    <Card
      variant="default"
      padding="md"
      className={cn(
        "transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>

          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {TrendIcon && <TrendIcon className={cn("w-4 h-4", styles.trend[trend.direction])} />}
              <span className={cn("text-sm font-medium", styles.trend[trend.direction])}>
                {trend.value}
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={cn("p-3 rounded-xl", styles.icon)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
});
