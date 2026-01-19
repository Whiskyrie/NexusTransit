/**
 * Icon Component
 * Wrapper type-safe para ícones lucide-react
 *
 * @example
 * <Icon icon={AlertTriangle} size="lg" color="warning" />
 */

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { IconProps } from "./Icon.types";
import { iconSizes, iconColors } from "./Icon.styles";

export const Icon = memo<IconProps>(function Icon({
  icon: LucideIcon,
  size = "md",
  color = "default",
  className,
  strokeWidth = 1.5,
  ...props
}) {
  return (
    <LucideIcon
      size={iconSizes[size]}
      strokeWidth={strokeWidth}
      className={cn(iconColors[color], className)}
      {...props}
    />
  );
});
