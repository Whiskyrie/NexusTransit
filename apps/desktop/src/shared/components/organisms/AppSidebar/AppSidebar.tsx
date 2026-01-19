/**
 * AppSidebar Component
 * Sidebar principal da aplicação com design minimalista
 * Inspirado em Linear/Inter UI
 *
 * Features:
 * - Seções colapsáveis
 * - Navegação por rota ativa
 * - Badges de notificação
 * - Logo com branding
 * - Footer com configurações
 * - Sidebar minimizável
 */

import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavItem, CollapsibleSection } from "@/shared/components/molecules";
import { navigationConfig, footerNavConfig, useActiveRoute } from "@/core/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { ConfirmLogoutModal } from "@/components/ui/ConfirmLogoutModal";

export const AppSidebar = memo(function AppSidebar() {
  const activePath = useActiveRoute();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleNavClick = (to: string) => {
    if (to === "/logout") {
      setShowLogoutModal(true);
    }
  };

  const handleLogoutConfirm = () => {
    clearAuth();
    setShowLogoutModal(false);
    navigate("/login");
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <aside
      className={`h-[calc(100vh-24px)] my-3 ml-3 bg-white border border-gray-200 rounded-xl flex flex-col transition-all duration-300 shadow-sm ${
        collapsed ? "w-16" : "w-65"
      }`}
    >
      {/* Header com Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {/* Logo e Nome */}
          <div className="flex items-center gap-3">
            <img src="/iconDark.png" alt="NexusTransit" className="w-8 h-8 object-contain" />
            {!collapsed && (
              <span
                className="text-xl font-semibold text-gray-900 tracking-tight"
                style={{ fontFamily: "Geist, sans-serif" }}
              >
                Nexus
              </span>
            )}
          </div>

          {/* Toggle Button */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Minimizar sidebar"
            >
              <PanelLeftClose className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full mt-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            title="Expandir sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {navigationConfig.map((section) =>
          collapsed ? (
            // Modo collapsed: apenas itens sem seção
            <div key={section.id} className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  badge={item.badge}
                  alert={item.alert}
                  active={activePath === item.to}
                  collapsed={collapsed}
                />
              ))}
            </div>
          ) : (
            // Modo expandido: com seções
            <CollapsibleSection
              key={section.id}
              title={section.title}
              defaultOpen={section.defaultOpen}
            >
              {section.items.map((item) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  badge={item.badge}
                  alert={item.alert}
                  active={activePath === item.to}
                  collapsed={collapsed}
                />
              ))}
            </CollapsibleSection>
          ),
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 space-y-0.5">
        {footerNavConfig.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            to={item.to}
            active={activePath === item.to}
            collapsed={collapsed}
            onClick={item.id === "logout" ? () => handleNavClick(item.to) : undefined}
          />
        ))}
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmLogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </aside>
  );
});
