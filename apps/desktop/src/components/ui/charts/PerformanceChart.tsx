import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";

export interface PerformanceDataPoint {
  day: string;
  label: string;
  current: number;
  previous: number;
}

interface PeriodOption {
  label: string;
  value: string;
}

interface PerformanceChartProps {
  title?: string;
  data: PerformanceDataPoint[];
  periodOptions?: PeriodOption[];
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
  height?: number;
  isLoading?: boolean;
  currentLabel?: string;
  previousLabel?: string;
  valueFormatter?: (value: number) => string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PerformanceDataPoint }>;
  label?: string;
  currentLabel?: string;
  previousLabel?: string;
  valueFormatter?: (value: number) => string;
}

// Custom Tooltip Component
function CustomTooltip({
  active,
  payload,
  label,
  currentLabel = "Este período",
  previousLabel = "Período anterior",
  valueFormatter = (v) => `${v}`,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload as PerformanceDataPoint;

  return (
    <div className="bg-[#1F2937] rounded-lg p-3 shadow-[0_4px_12px_rgba(0,0,0,0.15)] min-w-40">
      <p className="text-white text-sm font-medium mb-2">{data?.label || label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <span className="text-gray-300 text-xs">{currentLabel}</span>
          </div>
          <span className="text-[#3B82F6] text-xs font-semibold">
            {valueFormatter(data?.current || 0)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span className="text-gray-300 text-xs">{previousLabel}</span>
          </div>
          <span className="text-[#F59E0B] text-xs font-semibold">
            {valueFormatter(data?.previous || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PerformanceChart({
  title = "Performance",
  data,
  periodOptions = [],
  selectedPeriod,
  onPeriodChange,
  height = 320,
  isLoading = false,
  currentLabel = "Este período",
  previousLabel = "Período anterior",
  valueFormatter = (v) => `${v}`,
}: PerformanceChartProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedOption = useMemo(
    () => periodOptions.find((opt) => opt.value === selectedPeriod) || periodOptions[0],
    [periodOptions, selectedPeriod],
  );

  // Gradients IDs
  const currentGradientId = "currentGradient";
  const previousGradientId = "previousGradient";

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center justify-center bg-gray-50 rounded-xl" style={{ height }}>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Carregando dados...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#1A1A1A]">{title}</h3>

        {periodOptions.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              {selectedOption?.label}
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-35 z-20">
                  {periodOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onPeriodChange?.(option.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                        option.value === selectedPeriod
                          ? "text-blue-600 font-medium bg-blue-50"
                          : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
          <span className="text-xs text-gray-600">{currentLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
          <span className="text-xs text-gray-600">{previousLabel}</span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height, minHeight: height, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" aspect={undefined}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={currentGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={previousGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#E5E7EB"
              strokeOpacity={0.8}
            />

            <XAxis dataKey="day" hide />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString()}
              domain={[0, "auto"]}
              width={40}
            />

            <Tooltip
              content={
                <CustomTooltip
                  currentLabel={currentLabel}
                  previousLabel={previousLabel}
                  valueFormatter={valueFormatter}
                />
              }
              cursor={{
                stroke: "#9CA3AF",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            {/* Previous Period Area (behind) */}
            <Area
              type="monotone"
              dataKey="previous"
              stroke="#F59E0B"
              strokeWidth={2}
              fill={`url(#${previousGradientId})`}
              dot={false}
              activeDot={{
                r: 5,
                fill: "#F59E0B",
                stroke: "#FFFFFF",
                strokeWidth: 2,
              }}
            />

            {/* Current Period Area (in front) */}
            <Area
              type="monotone"
              dataKey="current"
              stroke="#3B82F6"
              strokeWidth={2}
              fill={`url(#${currentGradientId})`}
              dot={false}
              activeDot={{
                r: 5,
                fill: "#3B82F6",
                stroke: "#FFFFFF",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
