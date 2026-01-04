import { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TabOption {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabSwitcherProps {
  options: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function TabSwitcher({ options, activeTab, onChange, className }: TabSwitcherProps) {
  return (
    <div
      className={cn(
        "inline-flex bg-[#F5F5F0] rounded-[10px] p-1 gap-1 w-full justify-center",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center",
            activeTab === option.id
              ? "bg-white text-[#1A1A1A] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
              : "bg-transparent text-[#6B6B6B] hover:text-[#1A1A1A]",
          )}
          aria-selected={activeTab === option.id}
          role="tab"
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
