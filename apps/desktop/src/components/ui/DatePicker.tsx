import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Calendar } from "./Calendar";
import { clsx } from "clsx";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
  clearable?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  label,
  error,
  minDate,
  maxDate,
  clearable = true,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);

      // Calcular posição do dropdown
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dropdownHeight = 480; // Altura aproximada do calendário
        const spaceBelow = window.innerHeight - rect.bottom - 16;
        const spaceAbove = rect.top - 16;

        // Mostrar acima se não couber embaixo e houver mais espaço acima
        const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

        setDropdownPosition({
          top: showAbove
            ? Math.max(16, rect.top - Math.min(dropdownHeight, spaceAbove))
            : rect.bottom + 8,
          left: rect.left,
          width: rect.width,
        });
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const handleDateChange = (date: Date) => {
    onChange?.(date);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
  };

  return (
    <div ref={containerRef} className={clsx("relative w-full", className)}>
      {label && <label className="block text-sm font-medium text-[#1A1A1A] mb-2">{label}</label>}

      {/* Input */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full pl-12 pr-4 py-3.5 text-sm bg-white border rounded-xl outline-none transition-all duration-200 text-left relative",
          error
            ? "border-[#EF4444] shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
            : "border-[#E5E7EB] focus:border-[#1A1A1A] focus:shadow-[0_0_0_3px_rgba(26,26,26,0.1)]",
          isOpen && !error && "border-[#1A1A1A] shadow-[0_0_0_3px_rgba(26,26,26,0.1)]",
        )}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] flex items-center justify-center">
          <CalendarIcon size={18} strokeWidth={1.5} />
        </div>

        <span className={clsx(value ? "text-[#1A1A1A] font-medium" : "text-[#9CA3AF]")}>
          {value ? formatDate(value) : placeholder}
        </span>

        {clearable && value && (
          <button
            onClick={handleClear}
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B6B6B] transition-colors flex items-center justify-center"
          >
            <X size={16} strokeWidth={2} />
          </button>
        )}
      </button>

      {error && <p className="text-xs text-[#EF4444] mt-1.5">{error}</p>}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          className="fixed z-9999 animate-in fade-in slide-in-from-top-2 duration-200 overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            maxHeight: `calc(100vh - ${dropdownPosition.top}px - 16px)`,
          }}
        >
          <Calendar value={value} onChange={handleDateChange} minDate={minDate} maxDate={maxDate} />
        </div>
      )}
    </div>
  );
}
