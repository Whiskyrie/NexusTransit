import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  events?: Record<string, { type: "deliveries" | "pending" | "overdue"; count?: number }>;
  className?: string;
}

type ViewMode = "days" | "months" | "years";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function Calendar({ value, onChange, minDate, maxDate, className }: CalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("days");
  const [viewDate, setViewDate] = useState(value || new Date());

  // Gerar anos para seleção (100 anos para trás e 10 para frente)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 111 }, (_, i) => currentYear - 100 + i);

  // Ano inicial para exibição na grade de anos (mostra 12 anos por vez)
  const [yearsStartIndex, setYearsStartIndex] = useState(() => {
    const selectedYear = viewDate.getFullYear();
    const index = years.indexOf(selectedYear);
    return Math.max(0, Math.floor(index / 12) * 12);
  });

  const handleMonthClick = () => {
    setViewMode("months");
  };

  const handleYearClick = () => {
    // Centralizar o ano atual na visualização
    const selectedYear = viewDate.getFullYear();
    const index = years.indexOf(selectedYear);
    setYearsStartIndex(Math.max(0, Math.floor(index / 12) * 12));
    setViewMode("years");
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(monthIndex);
    setViewDate(newDate);
    setViewMode("days");
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(newDate);
    setViewMode("months");
  };

  const handlePrevYears = () => {
    setYearsStartIndex(Math.max(0, yearsStartIndex - 12));
  };

  const handleNextYears = () => {
    setYearsStartIndex(Math.min(years.length - 12, yearsStartIndex + 12));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setViewDate(date);
    }
    onChange?.(date);
  };

  const displayedYears = years.slice(yearsStartIndex, yearsStartIndex + 12);

  // Renderizar seleção de anos
  if (viewMode === "years") {
    return (
      <div
        className={clsx(
          "bg-white rounded-2xl p-5 shadow-lg border border-gray-100 w-[320px]",
          className,
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handlePrevYears}
            disabled={yearsStartIndex === 0}
            className="w-9 h-9 rounded-xl bg-[#F5F5F0] hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 text-[#4B5563]" strokeWidth={2} />
          </button>
          <span className="text-lg font-semibold text-[#1A1A1A]">
            {displayedYears[0]} - {displayedYears[displayedYears.length - 1]}
          </span>
          <button
            type="button"
            onClick={handleNextYears}
            disabled={yearsStartIndex >= years.length - 12}
            className="w-9 h-9 rounded-xl bg-[#F5F5F0] hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-[#4B5563]" strokeWidth={2} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {displayedYears.map((year) => {
            const isSelected = year === viewDate.getFullYear();
            const isCurrent = year === currentYear;
            return (
              <button
                key={year}
                type="button"
                onClick={() => handleYearSelect(year)}
                className={clsx(
                  "py-3 px-2 rounded-xl text-sm font-medium transition-all",
                  isSelected
                    ? "bg-[#1A1A1A] text-white shadow-md"
                    : isCurrent
                      ? "bg-[#F5F5F0] text-[#1A1A1A] font-bold"
                      : "hover:bg-[#F5F5F0] text-gray-700",
                )}
              >
                {year}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Renderizar seleção de meses
  if (viewMode === "months") {
    return (
      <div
        className={clsx(
          "bg-white rounded-2xl p-5 shadow-lg border border-gray-100 w-[320px]",
          className,
        )}
      >
        <div className="flex items-center justify-center mb-4">
          <button
            type="button"
            onClick={handleYearClick}
            className="text-lg font-semibold text-[#1A1A1A] hover:bg-[#F5F5F0] transition-colors cursor-pointer px-3 py-1 rounded-lg"
          >
            {viewDate.getFullYear()}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((month, index) => {
            const isSelected =
              index === viewDate.getMonth() &&
              viewDate.getFullYear() === (value?.getFullYear() ?? viewDate.getFullYear());
            const isCurrent =
              index === new Date().getMonth() && viewDate.getFullYear() === currentYear;
            return (
              <button
                key={month}
                type="button"
                onClick={() => handleMonthSelect(index)}
                className={clsx(
                  "py-3 px-2 rounded-xl text-sm font-medium transition-all",
                  isSelected
                    ? "bg-[#1A1A1A] text-white shadow-md"
                    : isCurrent
                      ? "bg-[#F5F5F0] text-[#1A1A1A] font-bold"
                      : "hover:bg-[#F5F5F0] text-gray-700",
                )}
              >
                {month.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Renderizar calendário normal de dias
  const monthName = viewDate.toLocaleDateString("pt-BR", { month: "long" });
  const year = viewDate.getFullYear();

  const handlePrevMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setViewDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setViewDate(newDate);
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl p-5 shadow-lg border border-gray-100 w-[320px]",
        className,
      )}
    >
      {/* Navegação customizada */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-9 h-9 rounded-xl bg-[#F5F5F0] hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#4B5563]" strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={handleMonthClick}
          className="text-lg font-semibold text-[#1A1A1A] capitalize hover:bg-[#F5F5F0] transition-colors cursor-pointer px-3 py-1 rounded-lg"
        >
          {monthName} {year}
        </button>

        <button
          type="button"
          onClick={handleNextMonth}
          className="w-9 h-9 rounded-xl bg-[#F5F5F0] hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[#4B5563]" strokeWidth={2} />
        </button>
      </div>

      <style>{`
        .rdp-root {
          --rdp-accent-color: #1A1A1A;
          --rdp-accent-background-color: #1A1A1A;
          --rdp-day_button-border-radius: 0.75rem;
          --rdp-day_button-height: 2.5rem;
          --rdp-day_button-width: 2.5rem;
          --rdp-selected-font: 500 0.875rem/1.25rem system-ui;
        }
        .rdp-today:not(.rdp-selected) .rdp-day_button {
          background-color: #F5F5F0;
          font-weight: 700;
        }
        .rdp-selected .rdp-day_button {
          background-color: #1A1A1A !important;
          color: white !important;
          border-radius: 0.75rem !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .rdp-selected .rdp-day_button:hover {
          background-color: #333 !important;
        }
        .rdp-day_button:hover {
          background-color: #F5F5F0 !important;
        }
        .rdp-selected .rdp-day_button:hover {
          background-color: #333 !important;
        }
        .rdp-outside .rdp-day_button {
          color: #d1d5db;
        }
        .rdp-disabled .rdp-day_button {
          color: #d1d5db;
          cursor: not-allowed;
        }
        .rdp-disabled .rdp-day_button:hover {
          background-color: transparent !important;
        }
      `}</style>
      <DayPicker
        mode="single"
        locale={ptBR}
        month={viewDate}
        onMonthChange={setViewDate}
        selected={value}
        onSelect={handleDateSelect}
        disabled={[
          ...(minDate ? [{ before: minDate }] : []),
          ...(maxDate ? [{ after: maxDate }] : []),
        ]}
        showOutsideDays
        fixedWeeks
        hideNavigation
        classNames={{
          root: "rdp-root",
          months: "flex flex-col",
          month: "space-y-4",
          month_caption: "hidden",
          weekdays: "grid grid-cols-7 gap-1 mb-2",
          weekday:
            "text-xs font-semibold text-gray-500 text-center w-10 h-8 flex items-center justify-center uppercase",
          week: "grid grid-cols-7 gap-1",
          day: "relative",
          day_button:
            "w-10 h-10 text-sm font-medium rounded-xl transition-all duration-150 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 hover:bg-[#F5F5F0]",
        }}
      />
    </div>
  );
}
