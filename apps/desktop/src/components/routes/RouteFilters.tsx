import {
  RouteStatus,
  RoutePriority,
  RouteFilters as RouteFiltersType,
} from "../../types/route.types";
import { Input } from "../ui/Input";
import { DateRangePicker } from "../ui/DateRangePicker";
import { Button } from "../ui/Button";
import { Search, Filter, X } from "lucide-react";

interface RouteFiltersProps {
  filters: RouteFiltersType;
  onFiltersChange: (filters: RouteFiltersType) => void;
  onClearFilters: () => void;
}

export function RouteFilters({ filters, onFiltersChange, onClearFilters }: RouteFiltersProps) {
  const hasActiveFilters =
    filters.status ||
    filters.priority ||
    filters.driver_id ||
    filters.vehicle_id ||
    filters.start_date_from ||
    filters.start_date_to;

  const handleFilterChange = (key: keyof RouteFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Filtros</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearFilters} className="h-8! px-3! text-xs!">
            <X className="w-4 h-4 mr-1" strokeWidth={1.5} />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <Input
            placeholder="Buscar por nome..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            icon={<Search className="w-5 h-5 text-gray-400" strokeWidth={1.5} />}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Status</label>
          <select
            value={filters.status || ""}
            onChange={(e) =>
              handleFilterChange(
                "status",
                e.target.value ? (e.target.value as RouteStatus) : undefined,
              )
            }
            className="w-full h-11 px-4 pr-10 text-sm border border-gray-200 rounded-xl bg-white cursor-pointer focus:outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 appearance-none"
          >
            <option value="">Todos</option>
            {Object.values(RouteStatus).map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, " ").toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Prioridade</label>
          <select
            value={filters.priority || ""}
            onChange={(e) =>
              handleFilterChange(
                "priority",
                e.target.value ? (e.target.value as RoutePriority) : undefined,
              )
            }
            className="w-full h-11 px-4 pr-10 text-sm border border-gray-200 rounded-xl bg-white cursor-pointer focus:outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 appearance-none"
          >
            <option value="">Todas</option>
            {Object.values(RoutePriority).map((priority) => (
              <option key={priority} value={priority}>
                {priority.replace(/_/g, " ").toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="lg:col-span-2">
          <DateRangePicker
            label="Período"
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

        {/* Driver ID */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Motorista</label>
          <Input
            placeholder="ID do motorista"
            value={filters.driver_id || ""}
            onChange={(e) => handleFilterChange("driver_id", e.target.value)}
          />
        </div>

        {/* Vehicle ID */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Veículo</label>
          <Input
            placeholder="ID do veículo"
            value={filters.vehicle_id || ""}
            onChange={(e) => handleFilterChange("vehicle_id", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
