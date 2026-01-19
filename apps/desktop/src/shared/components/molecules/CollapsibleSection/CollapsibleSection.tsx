/**
 * CollapsibleSection Component
 * Seção colapsável com animação suave
 *
 * @example
 * <CollapsibleSection title="Operações">
 *   <NavItem icon={Truck} label="Entregas" />
 * </CollapsibleSection>
 */

import { memo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollapsible } from "@/shared/hooks";
import type { CollapsibleSectionProps } from "./CollapsibleSection.types";

export const CollapsibleSection = memo<CollapsibleSectionProps>(function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
  className,
}) {
  const { isOpen, toggle } = useCollapsible(defaultOpen);

  return (
    <div className={cn("space-y-1", className)}>
      <button
        onClick={toggle}
        className={cn(
          "w-full flex items-center justify-between",
          "px-3 py-2 rounded-lg",
          "text-xs font-semibold text-gray-500 uppercase tracking-wider",
          "hover:text-gray-700 hover:bg-gray-50",
          "transition-all cursor-pointer",
        )}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? "Recolher" : "Expandir"} seção ${title}`}
      >
        <span>{title}</span>
        <ChevronDown
          className={cn("w-3.5 h-3.5 transition-transform", isOpen ? "rotate-0" : "-rotate-90")}
          strokeWidth={2}
        />
      </button>

      {isOpen && (
        <div className="space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
});
