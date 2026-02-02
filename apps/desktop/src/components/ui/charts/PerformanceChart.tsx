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
import { tokens } from "@/styles/tokens";

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
    <div
      className="rounded-lg p-3 min-w-40"
      style={{
        backgroundColor: tokens.colors.chart.tooltip.background,
        boxShadow: tokens.shadows.tooltip,
      }}
    >
      <p className="text-sm font-medium mb-2" style={{ color: tokens.colors.chart.tooltip.text }}>
        {data?.label || label}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tokens.colors.chart.primary }}
            />
            <span className="text-xs" style={{ color: tokens.colors.text.tertiary }}>
              {currentLabel}
            </span>
          </div>
          <span className="text-xs font-semibold" style={{ color: tokens.colors.chart.primary }}>
            {valueFormatter(data?.current || 0)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tokens.colors.chart.secondary }}
            />
            <span className="text-xs" style={{ color: tokens.colors.text.tertiary }}>
              {previousLabel}
            </span>
          </div>
          <span className="text-xs font-semibold" style={{ color: tokens.colors.chart.secondary }}>
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
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: tokens.colors.background.card,
          boxShadow: tokens.shadows.card,
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div
            className="h-6 w-32 rounded animate-pulse"
            style={{ backgroundColor: tokens.colors.background.tertiary }}
          />
          <div
            className="h-9 w-28 rounded-lg animate-pulse"
            style={{ backgroundColor: tokens.colors.background.tertiary }}
          />
        </div>
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            height,
            backgroundColor: tokens.colors.background.secondary,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{
                borderColor: tokens.colors.border.default,
                borderTopColor: tokens.colors.text.secondary,
              }}
            />
            <span className="text-sm" style={{ color: tokens.colors.text.secondary }}>
              Carregando dados...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: tokens.colors.background.card,
        boxShadow: tokens.shadows.card,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold" style={{ color: tokens.colors.text.primary }}>
          {title}
        </h3>

        {periodOptions.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: tokens.colors.background.secondary,
                color: tokens.colors.text.primary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = tokens.colors.background.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = tokens.colors.background.secondary;
              }}
            >
              {selectedOption?.label}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                style={{ color: tokens.colors.text.secondary }}
              />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-1 rounded-lg py-1 min-w-35 z-20"
                  style={{
                    backgroundColor: tokens.colors.background.card,
                    boxShadow: tokens.shadows.dropdown,
                    border: `1px solid ${tokens.colors.border.light}`,
                  }}
                >
                  {periodOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onPeriodChange?.(option.value);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm transition-colors"
                      style={{
                        color:
                          option.value === selectedPeriod
                            ? tokens.colors.brand.secondary
                            : tokens.colors.text.primary,
                        fontWeight: option.value === selectedPeriod ? 500 : 400,
                        backgroundColor:
                          option.value === selectedPeriod
                            ? tokens.colors.status.info.light
                            : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (option.value !== selectedPeriod) {
                          e.currentTarget.style.backgroundColor = tokens.colors.background.hover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (option.value !== selectedPeriod) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
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
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: tokens.colors.chart.primary }}
          />
          <span className="text-xs" style={{ color: tokens.colors.text.secondary }}>
            {currentLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: tokens.colors.chart.secondary }}
          />
          <span className="text-xs" style={{ color: tokens.colors.text.secondary }}>
            {previousLabel}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height, minHeight: height, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" aspect={undefined}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={currentGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tokens.colors.chart.primary} stopOpacity={0.15} />
                <stop offset="100%" stopColor={tokens.colors.chart.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={previousGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tokens.colors.chart.secondary} stopOpacity={0.1} />
                <stop offset="100%" stopColor={tokens.colors.chart.secondary} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke={tokens.colors.chart.grid}
              strokeOpacity={0.8}
            />

            <XAxis hide />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: tokens.colors.text.tertiary, fontSize: 12 }}
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
                stroke: tokens.colors.text.tertiary,
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            {/* Previous Period Area (behind) */}
            <Area
              type="monotone"
              dataKey="previous"
              stroke={tokens.colors.chart.secondary}
              strokeWidth={2}
              fill={`url(#${previousGradientId})`}
              dot={false}
              activeDot={{
                r: 5,
                fill: tokens.colors.chart.secondary,
                stroke: tokens.colors.background.card,
                strokeWidth: 2,
              }}
            />

            {/* Current Period Area (in front) */}
            <Area
              type="monotone"
              dataKey="current"
              stroke={tokens.colors.chart.primary}
              strokeWidth={2}
              fill={`url(#${currentGradientId})`}
              dot={false}
              activeDot={{
                r: 5,
                fill: tokens.colors.chart.primary,
                stroke: tokens.colors.background.card,
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
