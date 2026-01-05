import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  events?: Record<string, { type: "deliveries" | "pending" | "overdue"; count?: number }>;
  className?: string;
}

const DAYS_OF_WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];
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

export function Calendar({
  value,
  onChange,
  minDate,
  maxDate,
  events = {},
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (minDate && newDate < minDate) return;
    if (maxDate && newDate > maxDate) return;

    onChange?.(newDate);
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isToday = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (
      date.getDate() === value.getDate() &&
      date.getMonth() === value.getMonth() &&
      date.getFullYear() === value.getFullYear()
    );
  };

  const getEventForDay = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events[key];
  };

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Previous month days
    const prevMonthDays = getDaysInMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div
          key={`prev-${i}`}
          className="h-12 flex flex-col items-center justify-center text-sm text-gray-300 cursor-default"
        >
          {prevMonthDays - i}
        </div>,
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const event = getEventForDay(day);
      const disabled = isDateDisabled(day);
      const todayDay = isToday(day);
      const selected = isSelected(day);

      days.push(
        <button
          key={day}
          onClick={() => handleDayClick(day)}
          disabled={disabled}
          className={clsx(
            "h-12 flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 relative",
            disabled && "text-gray-300 cursor-not-allowed",
            !disabled && !selected && !todayDay && "text-[#1A1A1A] hover:bg-[#F5F5F0]",
            todayDay &&
              !selected &&
              "bg-[#F5F5F0] text-[#1A1A1A] font-semibold ring-2 ring-[#E5E7EB]",
            selected && "bg-[#1A1A1A] text-white shadow-md",
            !disabled && "cursor-pointer",
          )}
        >
          <span className="relative z-10">{day}</span>
          {event && !selected && (
            <div className="absolute bottom-1 flex gap-0.5">
              {event.count ? (
                <span
                  className={clsx(
                    "text-[9px] font-bold",
                    event.type === "deliveries" && "text-green-600",
                    event.type === "pending" && "text-amber-600",
                    event.type === "overdue" && "text-red-600",
                  )}
                >
                  {event.count}
                </span>
              ) : (
                <div
                  className={clsx(
                    "w-1 h-1 rounded-full",
                    event.type === "deliveries" && "bg-green-600",
                    event.type === "pending" && "bg-amber-600",
                    event.type === "overdue" && "bg-red-600",
                  )}
                />
              )}
            </div>
          )}
        </button>,
      );
    }

    return days;
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl p-7 shadow-lg border border-gray-100 w-full min-w-95",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <h3 className="text-base font-semibold text-[#1A1A1A]">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F0] text-[#6B6B6B] hover:text-[#1A1A1A] transition-all duration-150"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          </button>
          <button
            onClick={nextMonth}
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F0] text-[#6B6B6B] hover:text-[#1A1A1A] transition-all duration-150"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {DAYS_OF_WEEK.map((day, index) => (
          <div
            key={index}
            className="h-9 flex items-center justify-center text-xs font-medium text-[#9CA3AF] uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2">{renderDays()}</div>
    </div>
  );
}
