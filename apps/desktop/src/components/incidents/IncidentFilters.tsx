/**
 * Componente de filtros para incidentes
 */

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select, type SelectOption } from "../ui/Select";
import type {
  IncidentFilters as IncidentFiltersType,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from "../../types/incident.types";
import {
  IncidentTypeLabels,
  IncidentSeverityLabels,
  IncidentStatusLabels,
} from "../../types/incident.types";

interface IncidentFiltersProps {
  filters: IncidentFiltersType;
  onFiltersChange: (filters: IncidentFiltersType) => void;
  onClearFilters: () => void;
}

export function IncidentFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: IncidentFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || "");

  const activeFiltersCount = [
    filters.incident_type,
    filters.severity,
    filters.status,
    filters.driver_id,
    filters.vehicle_id,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0 || filters.search;

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedValue = searchValue.trim();
      if (trimmedValue.length >= 3 || trimmedValue === "") {
        onFiltersChange({ ...filters, search: trimmedValue || undefined, page: 1 });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Sincroniza searchValue quando filters.search muda externamente
  useEffect(() => {
    if (filters.search !== searchValue) {
      setSearchValue(filters.search || "");
    }
  }, [filters.search]);

  const handleFilterChange = <K extends keyof IncidentFiltersType>(
    key: K,
    value: IncidentFiltersType[K] | undefined,
  ) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const typeOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "", label: "Todos os tipos" },
      ...Object.entries(IncidentTypeLabels).map(([value, label]) => ({
        value,
        label,
      })),
    ],
    [],
  );

  const severityOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "", label: "Todas as severidades" },
      ...Object.entries(IncidentSeverityLabels).map(([value, label]) => ({
        value,
        label,
      })),
    ],
    [],
  );

  const statusOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "", label: "Todos os status" },
      ...Object.entries(IncidentStatusLabels).map(([value, label]) => ({
        value,
        label,
      })),
    ],
    [],
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#1A1A1A]" />
          <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">Filtros</h3>
          {activeFiltersCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-[#1A1A1A] text-white text-xs font-medium rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" onClick={onClearFilters} className="h-9 px-3">
              <X className="w-4 h-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
          <Button variant="ghost" onClick={() => setIsExpanded(!isExpanded)} className="h-9 px-3">
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Recolher
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Expandir
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-4 border-t border-gray-100 pt-4">
        <Input
          placeholder="Buscar por número do incidente ou título..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Advanced Filters Panel */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          isExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className={isExpanded ? "" : "overflow-hidden"}>
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tipo */}
              <Select
                label="Tipo de Incidente"
                options={typeOptions}
                value={filters.incident_type || ""}
                onChange={(value) =>
                  handleFilterChange("incident_type", value ? (value as IncidentType) : undefined)
                }
                placeholder="Todos os tipos"
              />

              {/* Severidade */}
              <Select
                label="Severidade"
                options={severityOptions}
                value={filters.severity || ""}
                onChange={(value) =>
                  handleFilterChange("severity", value ? (value as IncidentSeverity) : undefined)
                }
                placeholder="Todas as severidades"
              />

              {/* Status */}
              <Select
                label="Status"
                options={statusOptions}
                value={filters.status || ""}
                onChange={(value) =>
                  handleFilterChange("status", value ? (value as IncidentStatus) : undefined)
                }
                placeholder="Todos os status"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
