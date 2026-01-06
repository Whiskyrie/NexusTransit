import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "../ui/Button";
import { Select, type SelectOption } from "../ui/Select";
import type { UserFilters as UserFiltersType, User } from "../../types/user.types";

interface UserFiltersProps {
  filters: UserFiltersType;
  onFiltersChange: (filters: UserFiltersType) => void;
  onClearFilters: () => void;
}

const statusLabels: Record<User["status"], string> = {
  active: "Ativo",
  inactive: "Inativo",
  suspended: "Suspenso",
};

const typeLabels: Record<User["user_type"], string> = {
  admin: "Administrador",
  driver: "Motorista",
  customer: "Cliente",
  operator: "Operador",
  manager: "Gerente",
};

export function UserFilters({ filters, onFiltersChange, onClearFilters }: UserFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount = [filters.status, filters.user_type].filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0 || filters.search;

  const handleFilterChange = (key: keyof UserFiltersType, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const statusOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "", label: "Todos os status" },
      { value: "active", label: "Ativo" },
      { value: "inactive", label: "Inativo" },
      { value: "suspended", label: "Suspenso" },
    ],
    [],
  );

  const userTypeOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "", label: "Todos os tipos" },
      { value: "admin", label: "Administrador" },
      { value: "driver", label: "Motorista" },
      { value: "customer", label: "Cliente" },
      { value: "operator", label: "Operador" },
      { value: "manager", label: "Gerente" },
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
            placeholder="Buscar por nome ou email..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full h-12 pl-12 pr-4 text-sm bg-[#F5F5F0] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 placeholder:text-gray-400 transition-all"
          />
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {(["active", "inactive", "suspended"] as User["status"][]).map((status) => (
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
                handleFilterChange("status", value ? (value as User["status"]) : undefined)
              }
              placeholder="Todos os status"
            />

            <Select
              label="Tipo de Usuário"
              options={userTypeOptions}
              value={filters.user_type || ""}
              onChange={(value) =>
                handleFilterChange("user_type", value ? (value as User["user_type"]) : undefined)
              }
              placeholder="Todos os tipos"
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
                    Status: {statusLabels[filters.status]}
                    <button
                      onClick={() => handleFilterChange("status", undefined)}
                      className="hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.user_type && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#1A1A1A] text-white rounded-full text-xs">
                    Tipo: {typeLabels[filters.user_type]}
                    <button
                      onClick={() => handleFilterChange("user_type", undefined)}
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
