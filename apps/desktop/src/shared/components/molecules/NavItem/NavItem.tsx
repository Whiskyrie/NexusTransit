/**
 * NavItem Component
 * Item de navegação com suporte a badges e estados ativos
 *
 * @example
 * <NavItem icon={Home} label="Dashboard" to="/dashboard" />
 * <NavItem icon={Inbox} label="Inbox" badge={12} active />
 */

import { memo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/shared/components/atoms";
import type { NavItemProps } from "./NavItem.types";

export const NavItem = memo<NavItemProps>(function NavItem({
  icon: Icon,
  label,
  to,
  badge,
  active = false,
  alert = false,
  onClick,
  className,
  collapsed = false,
}) {
  const baseStyles = cn(
    "flex items-center gap-3 w-full text-left",
    collapsed ? "justify-center px-2 py-2" : "justify-between px-3 py-2",
    "rounded-lg text-sm font-medium transition-all cursor-pointer",
    "hover:bg-blue-50 active:scale-95",
    active
      ? "bg-blue-900/10 text-blue-900 hover:bg-blue-900/15"
      : "text-gray-600 hover:text-gray-900",
    className,
  );

  const content = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <Icon
          className={cn("w-4 h-4 shrink-0", active ? "text-blue-900" : "text-gray-500")}
          strokeWidth={1.5}
        />
        {!collapsed && <span className="truncate">{label}</span>}
      </div>

      {!collapsed && (badge !== undefined || alert) && (
        <div className="flex items-center gap-1 shrink-0">
          {alert && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
          {badge !== undefined && (
            <Badge variant={active ? "primary" : "default"} size="sm">
              {badge}
            </Badge>
          )}
        </div>
      )}
    </>
  );

  // Se tiver onClick, usa button ao invés de Link
  if (onClick) {
    return (
      <button type="button" className={baseStyles} onClick={onClick}>
        {content}
      </button>
    );
  }

  if (to) {
    return (
      <Link to={to} className={baseStyles}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={baseStyles}>
      {content}
    </button>
  );
});
