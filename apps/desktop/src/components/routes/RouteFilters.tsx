import { RouteStatus, RouteType, RouteFilters as RouteFiltersType } from "../../types/route.types";
import { Input } from "../ui/Input";
import { DateRangePicker } from "../ui/DateRangePicker";
import { Button } from "../ui/Button";
import { Search, SlidersHorizontal, X, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";

interface RouteFiltersProps {
  filters: RouteFiltersType;
  onFiltersChange: (filters: RouteFiltersType) => void;
  onClearFilters: () => void;
}

const statusLabels: Record<RouteStatus, string> = {
  [RouteStatus.PLANNED]: "Planejada",
  [RouteStatus.IN_PROGRESS]: "Em Andamento",
  [RouteStatus.PAUSED]: "Pausada",
  [RouteStatus.COMPLETED]: "Concluída",
  [RouteStatus.CANCELLED]: "Cancelada",
};

const typeLabels: Record<RouteType, string> = {
  [RouteType.URBAN]: "Urbana",
  [RouteType.INTERSTATE]: "Interestadual",
  [RouteType.RURAL]: "Rural",
  [RouteType.EXPRESS]: "Expressa",
  [RouteType.LOCAL]: "Local",
};

export function RouteFilters({ filters, onFiltersChange, onClearFilters }: RouteFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount = [
    filters.status,
    filters.type,
    filters.driver_id,
    filters.vehicle_id,
    filters.start_date_from,
    filters.start_date_to,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0 || filters.search;

  const handleFilterChange = (key: keyof RouteFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Search Bar Principal */}
      <div className="p-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Buscar rotas por nome, motorista ou veículo..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full h-12 pl-12 pr-4 text-sm bg-[#F5F5F0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 placeholder:text-gray-400 transition-all"
          />
        </div>

        {/* Status Quick Filter Pills */}
        <div className="hidden lg:flex items-center gap-2">
          {Object.values(RouteStatus)
            .slice(0, 3)
            .map((status) => (
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

        {/* Toggle Advanced Filters */}
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
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            strokeWidth={1.5}
          />
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={onClearFilters}
            className="h-12 px-3 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-500" strokeWidth={2} />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Filtros Avançados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={filters.status || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "status",
                        e.target.value ? (e.target.value as RouteStatus) : undefined,
                      )
                    }
                    className="w-full h-11 px-4 pr-10 text-sm font-medium border border-gray-200 rounded-xl bg-white cursor-pointer focus:outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 appearance-none transition-all"
                  >
                    <option value="">Todos os status</option>
                    {Object.values(RouteStatus).map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Tipo de Rota
                </label>
                <div className="relative">
                  <select
                    value={filters.type || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "type",
                        e.target.value ? (e.target.value as RouteType) : undefined,
                      )
                    }
                    className="w-full h-11 px-4 pr-10 text-sm font-medium border border-gray-200 rounded-xl bg-white cursor-pointer focus:outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 appearance-none transition-all"
                  >
                    <option value="">Todos os tipos</option>
                    {Object.values(RouteType).map((type) => (
                      <option key={type} value={type}>
                        {typeLabels[type]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Driver ID */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Motorista
                </label>
                <Input
                  placeholder="Buscar motorista..."
                  value={filters.driver_id || ""}
                  onChange={(e) => handleFilterChange("driver_id", e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Vehicle ID */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Veículo
                </label>
                <Input
                  placeholder="Buscar veículo..."
                  value={filters.vehicle_id || ""}
                  onChange={(e) => handleFilterChange("vehicle_id", e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Date Range */}
              <div className="lg:col-span-2 space-y-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Período
                </label>
                <DateRangePicker
                  value={{
                    start: filters.start_date_from ? new Date(filters.start_date_from) : undefined,
                    end: filters.start_date_to ? new Date(filters.start_date_to) : undefined,
                  }}
                  onChange={(range) => {
                    handleFilterChange("start_date_from", range.start?.toISOString() || undefined);
                    handleFilterChange("start_date_to", range.end?.toISOString() || undefined);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
