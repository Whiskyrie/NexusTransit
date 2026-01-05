import { useState } from "react";
import { clsx } from "clsx";
import { DatePicker } from "./DatePicker";

interface DateRange {
  start?: Date;
  end?: Date;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  label?: string;
  error?: string;
  className?: string;
}

const PRESETS = [
  { label: "Hoje", value: "today" },
  { label: "Últimos 7 dias", value: "last7" },
  { label: "Últimos 30 dias", value: "last30" },
  { label: "Este mês", value: "thisMonth" },
];

export function DateRangePicker({
  value = {},
  onChange,
  label,
  error,
  className,
}: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handlePreset = (preset: string) => {
    const now = new Date();
    let start: Date;
    const end = new Date();

    switch (preset) {
      case "today":
        start = new Date();
        break;
      case "last7":
        start = new Date(now.setDate(now.getDate() - 7));
        break;
      case "last30":
        start = new Date(now.setDate(now.getDate() - 30));
        break;
      case "thisMonth":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        return;
    }

    setActivePreset(preset);
    onChange?.({ start, end });
  };

  return (
    <div className={clsx("w-full", className)}>
      {label && <label className="block text-sm font-medium text-[#1A1A1A] mb-3">{label}</label>}

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handlePreset(preset.value)}
            className={clsx(
              "px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-150",
              activePreset === preset.value
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-white text-[#6B6B6B] border-[#E5E7EB] hover:bg-[#F5F5F0] hover:border-[#D1D5DB]",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Seleção Manual */}
      <div className="grid grid-cols-2 gap-3">
        <DatePicker
          label="Início"
          value={value.start}
          onChange={(date) => {
            onChange?.({ ...value, start: date });
            setActivePreset(null);
          }}
          placeholder="Selecione a data inicial"
          clearable
        />
        <DatePicker
          label="Fim"
          value={value.end}
          onChange={(date) => {
            onChange?.({ ...value, end: date });
            setActivePreset(null);
          }}
          placeholder="Selecione a data final"
          minDate={value.start}
          clearable
        />
      </div>

      {error && <p className="text-xs text-[#EF4444] mt-1.5">{error}</p>}
    </div>
  );
}
