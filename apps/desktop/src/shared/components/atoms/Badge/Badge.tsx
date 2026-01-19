/**
 * Badge Component
 * Componente atômico para exibição de status, contadores e labels
 *
 * @example
 * <Badge variant="success">Ativo</Badge>
 * <Badge variant="warning" size="sm">12</Badge>
 */

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { BadgeProps } from "./Badge.types";
import { badgeStyles } from "./Badge.styles";

export const Badge = memo<BadgeProps>(function Badge({
  variant = "default",
  size = "md",
  pill = false,
  outlined = false,
  className,
  children,
}) {
  return (
    <span
      className={cn(
        badgeStyles.base,
        badgeStyles.variants[variant],
        badgeStyles.sizes[size],
        pill ? badgeStyles.pill : badgeStyles.square,
        outlined && badgeStyles.outlined,
        className,
      )}
    >
      {children}
    </span>
  );
});
