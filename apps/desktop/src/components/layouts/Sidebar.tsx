import { useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Tooltip } from "@base-ui/react/tooltip";
import {
  LayoutDashboard,
  Users,
  IdCard,
  Truck,
  Route,
  Package,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuthStore, useUser } from "../../stores/auth.store";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================================================
// Types
// ============================================================================

export interface SidebarProps {
  /** Estado colapsado controlado externamente */
  collapsed?: boolean;
  /** Callback quando o estado collapsed muda */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Estado inicial quando não controlado */
  defaultCollapsed?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}

// ============================================================================
// Constants
// ============================================================================

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const TRANSITION_DURATION = "duration-300";
const TRANSITION_EASING = "ease-in-out";

const menuItems: MenuItem[] = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/users", icon: Users, label: "Usuários" },
  { path: "/drivers", icon: IdCard, label: "Motoristas" },
  { path: "/vehicles", icon: Truck, label: "Veículos" },
  { path: "/routes", icon: Route, label: "Rotas" },
  { path: "/deliveries", icon: Package, label: "Entregas" },
];

// ============================================================================
// Utility Functions
// ============================================================================

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Sub-components
// ============================================================================

interface SidebarHeaderProps {
  isCollapsed: boolean;
}

function SidebarHeader({ isCollapsed }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "transition-all",
        TRANSITION_DURATION,
        TRANSITION_EASING,
        isCollapsed ? "p-3" : "p-4",
      )}
    >
      <div
        className={cn(
          "flex items-center",
          "transition-all",
          TRANSITION_DURATION,
          TRANSITION_EASING,
          isCollapsed ? "justify-center" : "gap-3 px-2",
        )}
      >
        {/* Logo - Light mode (usa iconDark) */}
        <img
          src="/icon.png"
          alt="Nexus Transit"
          className={cn(
            "shrink-0 transition-all dark:hidden object-contain",
            TRANSITION_DURATION,
            TRANSITION_EASING,
            isCollapsed ? "h-10 w-10" : "h-10 w-auto",
          )}
        />
        {/* Logo - Dark mode (usa icon normal) */}
        <img
          src="/iconDark.png"
          alt="Nexus Transit"
          className={cn(
            "shrink-0 transition-all hidden dark:block object-contain",
            TRANSITION_DURATION,
            TRANSITION_EASING,
            isCollapsed ? "h-10 w-10" : "h-10 w-auto",
          )}
        />
      </div>
    </div>
  );
}

interface NavItemProps {
  item: MenuItem;
  isCollapsed: boolean;
}

function NavItem({ item, isCollapsed }: NavItemProps) {
  const linkContent = (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          "flex items-center rounded-xl",
          "transition-all",
          TRANSITION_DURATION,
          TRANSITION_EASING,
          isActive
            ? "bg-zinc-900 text-white shadow-md"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
          isCollapsed ? "w-11 h-11 justify-center" : "gap-3 px-4 h-12",
        )
      }
    >
      <item.icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
      {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
    </NavLink>
  );

  // Quando colapsado, envolve com Tooltip
  if (isCollapsed) {
    return (
      <li>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger render={linkContent} />
            <Tooltip.Portal>
              <Tooltip.Positioner side="right" sideOffset={8}>
                <Tooltip.Popup className="bg-zinc-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg">
                  {item.label}
                  <Tooltip.Arrow className="fill-zinc-900" />
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </li>
    );
  }

  return <li>{linkContent}</li>;
}

interface SidebarNavigationProps {
  isCollapsed: boolean;
}

function SidebarNavigation({ isCollapsed }: SidebarNavigationProps) {
  return (
    <nav
      className={cn(
        "flex-1 overflow-y-auto",
        "transition-all",
        TRANSITION_DURATION,
        TRANSITION_EASING,
        isCollapsed ? "px-3" : "px-4",
      )}
    >
      <ul className="space-y-1">
        {menuItems.map((item) => (
          <NavItem key={item.path} item={item} isCollapsed={isCollapsed} />
        ))}
      </ul>
    </nav>
  );
}

interface SidebarFooterProps {
  isCollapsed: boolean;
}

function SidebarFooter({ isCollapsed }: SidebarFooterProps) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useUser();

  const handleLogout = useCallback(() => {
    clearAuth();
    navigate("/login", { replace: true });
  }, [clearAuth, navigate]);

  const userInitial = user?.first_name?.charAt(0) || "U";
  const userEmail = user?.email || "admin@nexus.com";

  const footerContent = (
    <div
      className={cn(
        "bg-zinc-100 rounded-xl",
        "transition-all",
        TRANSITION_DURATION,
        TRANSITION_EASING,
        isCollapsed ? "p-2" : "p-3",
      )}
    >
      {/* User Info */}
      <div
        className={cn(
          "flex items-center",
          "transition-all",
          TRANSITION_DURATION,
          TRANSITION_EASING,
          isCollapsed ? "flex-col gap-2" : "gap-3 mb-3",
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            "bg-zinc-300 rounded-xl flex items-center justify-center text-lg font-bold text-zinc-600 shrink-0",
            "w-10 h-10",
          )}
        >
          {userInitial}
        </div>

        {/* User Details */}
        {!isCollapsed && (
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-zinc-600 truncate">{userEmail}</p>
          </div>
        )}

        {/* Logout Button - inline when collapsed */}
        {isCollapsed && (
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger
                render={
                  <button
                    onClick={handleLogout}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                }
              />
              <Tooltip.Portal>
                <Tooltip.Positioner side="right" sideOffset={8}>
                  <Tooltip.Popup className="bg-zinc-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg">
                    Sair da conta
                    <Tooltip.Arrow className="fill-zinc-900" />
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        )}
      </div>

      {/* Logout Button - full width when expanded */}
      {!isCollapsed && (
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-900 text-xs font-medium hover:bg-zinc-50 transition-colors"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          <span>Sair da conta</span>
        </button>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "mt-auto",
        "transition-all",
        TRANSITION_DURATION,
        TRANSITION_EASING,
        isCollapsed ? "p-3" : "p-4",
      )}
    >
      {footerContent}
    </div>
  );
}

interface ToggleButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

function ToggleButton({ isCollapsed, onToggle }: ToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "absolute -right-3 top-8 w-6 h-6 bg-white border border-zinc-200 rounded-full",
        "flex items-center justify-center shadow-sm",
        "hover:bg-zinc-50 transition-colors",
        "z-10",
      )}
      aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
    >
      {isCollapsed ? (
        <ChevronRight className="w-4 h-4 text-zinc-600" strokeWidth={1.5} />
      ) : (
        <ChevronLeft className="w-4 h-4 text-zinc-600" strokeWidth={1.5} />
      )}
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Sidebar colapsável para navegação do dashboard
 *
 * Pode ser usado como componente controlado ou não-controlado:
 *
 * @example
 * // Não-controlado (estado interno)
 * <Sidebar defaultCollapsed={false} />
 *
 * @example
 * // Controlado (estado externo)
 * const [collapsed, setCollapsed] = useState(false);
 * <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
 */
export function Sidebar({
  collapsed,
  onCollapsedChange,
  defaultCollapsed = false,
  className,
}: SidebarProps) {
  // Estado interno para modo não-controlado
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);

  // Determina se está em modo controlado
  const isControlled = collapsed !== undefined;
  const isCollapsed = isControlled ? collapsed : internalCollapsed;

  // Handler para toggle
  const handleToggle = useCallback(() => {
    const newValue = !isCollapsed;

    if (isControlled) {
      onCollapsedChange?.(newValue);
    } else {
      setInternalCollapsed(newValue);
    }
  }, [isCollapsed, isControlled, onCollapsedChange]);

  return (
    <aside
      className={cn(
        "relative bg-[#F5F5F0] border-r border-zinc-200 rounded-[20px] flex flex-col",
        "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        "transition-all",
        TRANSITION_DURATION,
        TRANSITION_EASING,
        className,
      )}
      style={{
        width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        minWidth: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
      }}
    >
      <ToggleButton isCollapsed={isCollapsed} onToggle={handleToggle} />
      <SidebarHeader isCollapsed={isCollapsed} />
      <SidebarNavigation isCollapsed={isCollapsed} />
      <SidebarFooter isCollapsed={isCollapsed} />
    </aside>
  );
}

export default Sidebar;
