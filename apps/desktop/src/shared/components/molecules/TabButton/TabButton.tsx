/**
 * TabButton Component
 * Botão individual de tab com acessibilidade
 *
 * @example
 * <TabButton
 *   id="tab1"
 *   label="Incidentes"
 *   active={true}
 *   onClick={handleClick}
 * />
 */

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/shared/components/atoms";
import type { TabButtonProps } from "./TabButton.types";

export const TabButton = memo<TabButtonProps>(function TabButton({
  id,
  label,
  icon: Icon,
  badge,
  active,
  disabled = false,
  onClick,
  onKeyDown,
  className,
}) {
  return (
    <button
      role="tab"
      id={`tab-${id}`}
      aria-selected={active}
      aria-controls={`panel-${id}`}
      tabIndex={active ? 0 : -1}
      disabled={disabled}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-lg",
        "text-sm font-medium transition-all cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-orange-500 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        active
          ? "bg-gray-900 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-95",
        className,
      )}
    >
      {Icon && <Icon className="w-4 h-4" strokeWidth={active ? 2 : 1.5} />}
      <span>{label}</span>
      {badge !== undefined && (
        <Badge variant={active ? "default" : "primary"} size="sm">
          {badge}
        </Badge>
      )}
    </button>
  );
});
