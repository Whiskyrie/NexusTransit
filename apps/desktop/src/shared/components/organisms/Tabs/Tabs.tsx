/**
 * Tabs Component
 * Sistema de navegação por tabs com acessibilidade WAI-ARIA
 *
 * Features:
 * - Navegação por teclado (Arrow keys, Home, End)
 * - Estados disabled
 * - Badges/contadores
 * - Ícones opcionais
 * - Variants (default, pills)
 *
 * @example
 * <Tabs
 *   items={[
 *     { id: 'list', label: 'Incidentes', icon: AlertTriangle },
 *     { id: 'stats', label: 'Estatísticas', badge: 12 }
 *   ]}
 *   activeTab="list"
 *   onChange={(id) => setActiveTab(id)}
 * />
 */

import { memo } from "react";
import { cn } from "@/lib/utils";
import { TabButton } from "@/shared/components/molecules";
import type { TabsProps } from "./Tabs.types";
import { useTabNavigation } from "./useTabNavigation";

export const Tabs = memo<TabsProps>(function Tabs({
  items,
  activeTab,
  onChange,
  variant = "default",
  className,
}) {
  const { handleTabChange, handleKeyNavigation } = useTabNavigation(items, activeTab, onChange);

  return (
    <div
      role="tablist"
      aria-label="Navegação por abas"
      className={cn("flex gap-1", variant === "pills" && "bg-gray-100 p-1 rounded-lg", className)}
    >
      {items.map((item) => (
        <TabButton
          key={item.id}
          id={item.id}
          label={item.label}
          icon={item.icon}
          badge={item.badge}
          active={item.id === activeTab}
          disabled={item.disabled}
          onClick={() => handleTabChange(item.id)}
          onKeyDown={(e) => handleKeyNavigation(e, item.id)}
        />
      ))}
    </div>
  );
});
