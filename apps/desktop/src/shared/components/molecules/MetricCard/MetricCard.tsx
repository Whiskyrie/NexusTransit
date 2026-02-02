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
import { tokens } from "@/styles/tokens";

const variantStyles = {
  primary: {
    icon: {
      bg: tokens.colors.status.info.light,
      text: tokens.colors.status.info.dark,
    },
    trend: {
      up: tokens.colors.status.success.dark,
      down: tokens.colors.status.error.dark,
      neutral: tokens.colors.text.secondary,
    },
  },
  secondary: {
    icon: {
      bg: tokens.colors.background.tertiary,
      text: tokens.colors.text.primary,
    },
    trend: {
      up: tokens.colors.status.success.dark,
      down: tokens.colors.status.error.dark,
      neutral: tokens.colors.text.secondary,
    },
  },
  success: {
    icon: {
      bg: tokens.colors.status.success.light,
      text: tokens.colors.status.success.dark,
    },
    trend: {
      up: tokens.colors.status.success.dark,
      down: tokens.colors.status.error.dark,
      neutral: tokens.colors.text.secondary,
    },
  },
  warning: {
    icon: {
      bg: tokens.colors.status.warning.light,
      text: tokens.colors.status.warning.dark,
    },
    trend: {
      up: tokens.colors.status.success.dark,
      down: tokens.colors.status.error.dark,
      neutral: tokens.colors.text.secondary,
    },
  },
  error: {
    icon: {
      bg: tokens.colors.status.error.light,
      text: tokens.colors.status.error.dark,
    },
    trend: {
      up: tokens.colors.status.success.dark,
      down: tokens.colors.status.error.dark,
      neutral: tokens.colors.text.secondary,
    },
  },
  info: {
    icon: {
      bg: tokens.colors.status.info.light,
      text: tokens.colors.status.info.dark,
    },
    trend: {
      up: tokens.colors.status.success.dark,
      down: tokens.colors.status.error.dark,
      neutral: tokens.colors.text.secondary,
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
          <p className="text-sm mb-1" style={{ color: tokens.colors.text.secondary }}>
            {label}
          </p>
          <p className="text-2xl font-bold" style={{ color: tokens.colors.text.primary }}>
            {value}
          </p>

          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {TrendIcon && (
                <TrendIcon className="w-4 h-4" style={{ color: styles.trend[trend.direction] }} />
              )}
              <span
                className="text-sm font-medium"
                style={{ color: styles.trend[trend.direction] }}
              >
                {trend.value}
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div
            className="p-3 rounded-xl"
            style={{
              backgroundColor: styles.icon.bg,
              color: styles.icon.text,
            }}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
});
