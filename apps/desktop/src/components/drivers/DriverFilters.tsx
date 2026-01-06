import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "../ui/Button";
import { Select, type SelectOption } from "../ui/Select";
import { DriverFilters as DriverFiltersType, DriverStatus } from "../../types/driver.types";

interface DriverFiltersProps {
  filters: DriverFiltersType;
  onFiltersChange: (filters: DriverFiltersType) => void;
  onClearFilters: () => void;
}

// Status disponíveis no sistema (valores que o backend aceita)
const AVAILABLE_STATUSES = [
  { value: DriverStatus.AVAILABLE, label: "Disponível" },
  { value: DriverStatus.ON_ROUTE, label: "Em Rota" },
  { value: DriverStatus.UNAVAILABLE, label: "Indisponível" },
  { value: DriverStatus.VACATION, label: "Férias" },
  { value: DriverStatus.BLOCKED_LEGACY, label: "Bloqueado" },
] as const;

// Status para quick filters (botões rápidos)
const QUICK_FILTER_STATUSES = [
  DriverStatus.AVAILABLE,
  DriverStatus.UNAVAILABLE,
  DriverStatus.VACATION,
] as const;

const statusLabels: Record<string, string> = Object.fromEntries(
  AVAILABLE_STATUSES.map(({ value, label }) => [value, label]),
);

export function DriverFilters({ filters, onFiltersChange, onClearFilters }: DriverFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount = [filters.status].filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0 || filters.search;

  const handleFilterChange = (
    key: keyof DriverFiltersType,
    value: string | DriverStatus | undefined,
  ) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const statusOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "", label: "Todos os status" },
      ...AVAILABLE_STATUSES.map(({ value, label }) => ({
        value,
        label,
      })),
    ],
    [],
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou CNH..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full h-12 pl-12 pr-4 text-sm bg-[#F5F5F0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 placeholder:text-gray-400 transition-all"
          />
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {QUICK_FILTER_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() =>
                handleFilterChange("status", filters.status === status ? undefined : status)
              }
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                filters.status === status
                  ? "bg-[#1A1A1A] text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`h-12 px-4 gap-2 ${isExpanded ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : ""}`}
        >
          <SlidersHorizontal className="w-4 h-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">Filtros</span>
          {activeFiltersCount > 0 && (
            <span
              className={`min-w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                isExpanded ? "bg-white text-[#1A1A1A]" : "bg-[#1A1A1A] text-white"
              }`}
            >
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={onClearFilters}
            className="h-12 px-4 text-gray-500 hover:text-red-500"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
            <span className="hidden sm:inline ml-1">Limpar</span>
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Status"
              options={statusOptions}
              value={filters.status || ""}
              onChange={(value) =>
                handleFilterChange("status", value ? (value as DriverStatus) : undefined)
              }
              placeholder="Todos os status"
            />
          </div>

          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Filtros ativos:</span>
                {filters.search && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#1A1A1A] text-white rounded-full text-xs">
                    Busca: {filters.search}
                    <button
                      onClick={() => handleFilterChange("search", "")}
                      className="hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.status && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#1A1A1A] text-white rounded-full text-xs">
                    Status: {statusLabels[filters.status] || filters.status}
                    <button
                      onClick={() => handleFilterChange("status", undefined)}
                      className="hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
