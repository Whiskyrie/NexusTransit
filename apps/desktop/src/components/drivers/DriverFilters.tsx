import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { DriverFilters as DriverFiltersType, DriverStatus } from "../../types/driver.types";

interface DriverFiltersProps {
  filters: DriverFiltersType;
  onFiltersChange: (filters: DriverFiltersType) => void;
  onClearFilters: () => void;
}

export function DriverFilters({ filters, onFiltersChange, onClearFilters }: DriverFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value, page: 1 });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      status: e.target.value ? (e.target.value as DriverStatus) : undefined,
      page: 1,
    });
  };

  const hasActiveFilters = filters.search || filters.status;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar por nome, CPF ou CNH..."
            icon={<Search className="w-4 h-4" />}
            value={filters.search || ""}
            onChange={handleSearchChange}
          />
        </div>

        <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)} className="gap-2">
          <Filter className="w-4 h-4" strokeWidth={1.5} />
          Filtros
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearFilters} className="gap-2">
            <X className="w-4 h-4" strokeWidth={1.5} />
            Limpar
          </Button>
        )}
      </div>

      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={filters.status || ""}
                onChange={handleStatusChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent text-sm"
              >
                <option value="">Todos os status</option>
                <option value={DriverStatus.ACTIVE}>Ativo</option>
                <option value={DriverStatus.INACTIVE}>Inativo</option>
                <option value={DriverStatus.SUSPENDED}>Suspenso</option>
                <option value={DriverStatus.ON_LEAVE}>De Férias</option>
                <option value={DriverStatus.BLOCKED}>Bloqueado</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
