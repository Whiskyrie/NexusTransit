import {
  VehicleStatus,
  VehicleType,
  VehicleFilters as VehicleFiltersType,
} from "../../types/vehicle.types";
import { Button } from "../ui/Button";
import { Select, type SelectOption } from "../ui/Select";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

interface VehicleFiltersProps {
  filters: VehicleFiltersType;
  onFiltersChange: (filters: VehicleFiltersType) => void;
  onClearFilters: () => void;
}

const statusLabels: Record<VehicleStatus, string> = {
  [VehicleStatus.ACTIVE]: "Ativo",
  [VehicleStatus.INACTIVE]: "Inativo",
  [VehicleStatus.IN_ROUTE]: "Em Rota",
  [VehicleStatus.MAINTENANCE]: "Manutenção",
  [VehicleStatus.OUT_OF_SERVICE]: "Fora de Serviço",
};

const typeLabels: Record<VehicleType, string> = {
  [VehicleType.MOTORCYCLE]: "Moto",
  [VehicleType.CAR]: "Carro",
  [VehicleType.VAN]: "Van",
  [VehicleType.TRUCK]: "Caminhão",
  [VehicleType.BICYCLE]: "Bicicleta",
};

export function VehicleFilters({ filters, onFiltersChange, onClearFilters }: VehicleFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount = [filters.status, filters.vehicle_type].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0 || filters.search;

  const handleFilterChange = (
    key: keyof VehicleFiltersType,
    value: string | VehicleStatus | VehicleType | undefined,
  ) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  // Opções de status para o Select
  const statusOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "", label: "Todos os status" },
      ...Object.entries(statusLabels).map(([value, label]) => ({
        value,
        label,
      })),
    ],
    [],
  );

  // Opções de tipo de veículo para o Select
  const typeOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "", label: "Todos os tipos" },
      ...Object.entries(typeLabels).map(([value, label]) => ({
        value,
        label,
      })),
    ],
    [],
  );

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
            placeholder="Buscar por placa, modelo ou marca..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full h-12 pl-12 pr-4 text-sm bg-[#F5F5F0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 placeholder:text-gray-400 transition-all"
          />
        </div>

        {/* Status Quick Filter Pills */}
        <div className="hidden lg:flex items-center gap-2">
          {[VehicleStatus.ACTIVE, VehicleStatus.IN_ROUTE, VehicleStatus.MAINTENANCE].map(
            (status) => (
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
            ),
          )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <Select
                label="Status"
                options={statusOptions}
                value={filters.status || ""}
                onChange={(value) =>
                  handleFilterChange("status", value ? (value as VehicleStatus) : undefined)
                }
                placeholder="Todos os status"
              />

              {/* Tipo */}
              <Select
                label="Tipo de Veículo"
                options={typeOptions}
                value={filters.vehicle_type || ""}
                onChange={(value) =>
                  handleFilterChange("vehicle_type", value ? (value as VehicleType) : undefined)
                }
                placeholder="Todos os tipos"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
