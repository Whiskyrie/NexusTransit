import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/shared/components/atoms";
import { Select, type SelectOption } from "../ui/Select";
import type {
  DeliveryFilters as DeliveryFiltersType,
  DeliveryStatus,
  DeliveryPriority,
} from "../../types/delivery.types";

interface DeliveryFiltersProps {
  filters: DeliveryFiltersType;
  onFiltersChange: (filters: DeliveryFiltersType) => void;
  onClearFilters: () => void;
}

const STATUS_OPTIONS: { value: DeliveryStatus; label: string }[] = [
  { value: "PENDING", label: "Pendente" },
  { value: "ASSIGNED", label: "Atribuído" },
  { value: "PICKED_UP", label: "Coletado" },
  { value: "IN_TRANSIT", label: "Em Trânsito" },
  { value: "OUT_FOR_DELIVERY", label: "Saiu para Entrega" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "FAILED", label: "Falhou" },
  { value: "CANCELLED", label: "Cancelado" },
];

const PRIORITY_OPTIONS: { value: DeliveryPriority; label: string }[] = [
  { value: "LOW", label: "Baixa" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "Alta" },
  { value: "CRITICAL", label: "Crítica" },
];

const QUICK_FILTER_STATUSES: DeliveryStatus[] = ["PENDING", "IN_TRANSIT", "DELIVERED"];

const statusLabels: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map(({ value, label }) => [value, label]),
);

export function DeliveryFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: DeliveryFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.tracking_code || "");

  const activeFiltersCount = [filters.status, filters.priority].filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0 || filters.tracking_code;

  // Debounce para busca por código de rastreamento
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedValue = searchValue.trim();
      // Só envia se tiver pelo menos 3 caracteres ou estiver vazio (para limpar)
      if (trimmedValue.length >= 3 || trimmedValue === "") {
        onFiltersChange({ ...filters, tracking_code: trimmedValue || undefined, page: 1 });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Sincroniza searchValue quando filters.tracking_code muda externamente (ex: limpar filtros)
  useEffect(() => {
    if (filters.tracking_code !== searchValue) {
      setSearchValue(filters.tracking_code || "");
    }
  }, [filters.tracking_code]);

  const handleFilterChange = useCallback(
    <K extends keyof DeliveryFiltersType>(key: K, value: DeliveryFiltersType[K] | undefined) => {
      onFiltersChange({ ...filters, [key]: value, page: 1 });
    },
    [filters, onFiltersChange],
  );

  const statusOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "", label: "Todos os status" },
      ...STATUS_OPTIONS.map(({ value, label }) => ({
        value,
        label,
      })),
    ],
    [],
  );

  const priorityOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "", label: "Todas as prioridades" },
      ...PRIORITY_OPTIONS.map(({ value, label }) => ({
        value,
        label,
      })),
    ],
    [],
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="p-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Buscar por código de rastreamento (mín. 3 caracteres)..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
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
            <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white text-xs flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearFilters} className="h-12 px-3 text-gray-500">
            <X className="w-4 h-4" strokeWidth={1.5} />
            <span className="hidden sm:inline ml-1">Limpar</span>
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Status</label>
              <Select
                options={statusOptions}
                value={filters.status || ""}
                onChange={(value) =>
                  handleFilterChange("status", (value as DeliveryStatus) || undefined)
                }
                placeholder="Todos os status"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Prioridade</label>
              <Select
                options={priorityOptions}
                value={filters.priority || ""}
                onChange={(value) =>
                  handleFilterChange("priority", (value as DeliveryPriority) || undefined)
                }
                placeholder="Todas as prioridades"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleFilterChange("today", !filters.today)}
                className={`h-10 whitespace-nowrap ${filters.today ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : ""}`}
              >
                Apenas Hoje
              </Button>
              <Button
                variant="outline"
                onClick={() => handleFilterChange("overdue", !filters.overdue)}
                className={`h-10 whitespace-nowrap ${filters.overdue ? "bg-red-500 text-white border-red-500" : ""}`}
              >
                Atrasadas
              </Button>
              <Button
                variant="outline"
                onClick={() => handleFilterChange("active_only", !filters.active_only)}
                className={`h-10 whitespace-nowrap ${filters.active_only ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : ""}`}
              >
                Apenas Ativas
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
