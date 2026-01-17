import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, X, ChevronUp, ChevronDown } from "lucide-react";
import { Calendar } from "./Calendar";
import { clsx } from "clsx";

interface DateTimePickerProps {
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

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Selecione data e hora",
  label,
  error,
  minDate,
  maxDate,
  clearable = true,
  className,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);
  const [hours, setHours] = useState(value ? String(value.getHours()).padStart(2, "0") : "08");
  const [minutes, setMinutes] = useState(
    value ? String(value.getMinutes()).padStart(2, "0") : "00",
  );
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
        const dropdownHeight = 600; // Altura aproximada do calendário + time picker
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

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    date.setHours(parseInt(hours), parseInt(minutes));
    onChange?.(date);
  };

  const handleHoursInput = (newHours: string) => {
    // Permitir apenas números e limitar a 2 dígitos
    const numericValue = newHours.replace(/\D/g, "").slice(0, 2);

    // Atualizar estado imediatamente para permitir digitação
    setHours(numericValue || "0");
  };

  const handleHoursBlur = () => {
    // Validar e formatar quando o usuário sair do campo
    const hoursNum = parseInt(hours) || 0;
    const validHours = Math.min(Math.max(hoursNum, 0), 23);
    const formattedHours = String(validHours).padStart(2, "0");

    setHours(formattedHours);

    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(validHours, parseInt(minutes));
      onChange?.(newDate);
    }
  };

  const handleMinutesInput = (newMinutes: string) => {
    // Permitir apenas números e limitar a 2 dígitos
    const numericValue = newMinutes.replace(/\D/g, "").slice(0, 2);

    // Atualizar estado imediatamente para permitir digitação
    setMinutes(numericValue || "0");
  };

  const handleMinutesBlur = () => {
    // Validar e formatar quando o usuário sair do campo
    const minutesNum = parseInt(minutes) || 0;
    const validMinutes = Math.min(Math.max(minutesNum, 0), 59);
    const formattedMinutes = String(validMinutes).padStart(2, "0");

    setMinutes(formattedMinutes);

    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours), validMinutes);
      onChange?.(newDate);
    }
  };

  const incrementHours = () => {
    const newHours = (parseInt(hours) + 1) % 24;
    setHours(String(newHours).padStart(2, "0"));
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(newHours, parseInt(minutes));
      onChange?.(newDate);
    }
  };

  const decrementHours = () => {
    const newHours = parseInt(hours) - 1 < 0 ? 23 : parseInt(hours) - 1;
    setHours(String(newHours).padStart(2, "0"));
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(newHours, parseInt(minutes));
      onChange?.(newDate);
    }
  };

  const incrementMinutes = () => {
    const newMinutes = (parseInt(minutes) + 1) % 60;
    setMinutes(String(newMinutes).padStart(2, "0"));
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours), newMinutes);
      onChange?.(newDate);
    }
  };

  const decrementMinutes = () => {
    const newMinutes = parseInt(minutes) - 1 < 0 ? 59 : parseInt(minutes) - 1;
    setMinutes(String(newMinutes).padStart(2, "0"));
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours), newMinutes);
      onChange?.(newDate);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(undefined);
    setHours("08");
    setMinutes("00");
    onChange?.(undefined);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      const finalDate = new Date(selectedDate);
      finalDate.setHours(parseInt(hours), parseInt(minutes));
      onChange?.(finalDate);
      setIsOpen(false);
    }
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
          {value ? formatDateTime(value) : placeholder}
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

      {/* Calendar & Time Dropdown */}
      {isOpen && (
        <div
          className="fixed z-9999 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: `calc(100vh - ${dropdownPosition.top}px - 16px)`,
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-y-auto max-h-full">
            {/* Calendar */}
            <div className="p-4">
              <Calendar
                value={selectedDate}
                onChange={handleDateChange}
                minDate={minDate}
                maxDate={maxDate}
                className="shadow-none border-0"
              />
            </div>

            {/* Time Picker */}
            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50">
              <label className="block text-xs font-medium text-[#6B6B6B] mb-3">Horário</label>
              <div className="flex items-center gap-3">
                {/* Time Selectors */}
                <div className="flex-1 flex items-center gap-3">
                  <Clock size={16} strokeWidth={1.5} className="text-[#9CA3AF]" />

                  {/* Hours Column */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={incrementHours}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50 transition-colors"
                    >
                      <ChevronUp size={16} strokeWidth={2} className="text-[#6B6B6B]" />
                    </button>
                    <div className="w-14 h-11 flex items-center justify-center bg-white border border-gray-200 rounded-lg">
                      <input
                        type="text"
                        value={hours}
                        onChange={(e) => handleHoursInput(e.target.value)}
                        onBlur={handleHoursBlur}
                        className="w-full h-full text-center text-lg font-semibold text-[#1A1A1A] bg-transparent border-none outline-none"
                        maxLength={2}
                        inputMode="numeric"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={decrementHours}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50 transition-colors"
                    >
                      <ChevronDown size={16} strokeWidth={2} className="text-[#6B6B6B]" />
                    </button>
                  </div>

                  <span className="text-2xl font-bold text-[#9CA3AF]">:</span>

                  {/* Minutes Column */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={incrementMinutes}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50 transition-colors"
                    >
                      <ChevronUp size={16} strokeWidth={2} className="text-[#6B6B6B]" />
                    </button>
                    <div className="w-14 h-11 flex items-center justify-center bg-white border border-gray-200 rounded-lg">
                      <input
                        type="text"
                        value={minutes}
                        onChange={(e) => handleMinutesInput(e.target.value)}
                        onBlur={handleMinutesBlur}
                        className="w-full h-full text-center text-lg font-semibold text-[#1A1A1A] bg-transparent border-none outline-none"
                        maxLength={2}
                        inputMode="numeric"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={decrementMinutes}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50 transition-colors"
                    >
                      <ChevronDown size={16} strokeWidth={2} className="text-[#6B6B6B]" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!selectedDate}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-[#1A1A1A] rounded-lg hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
