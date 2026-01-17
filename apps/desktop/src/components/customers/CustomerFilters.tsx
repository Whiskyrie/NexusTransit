import { Search, Filter, X } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select/Select";
import type {
  CustomerFilters as CustomerFiltersType,
  CustomerStatus,
  CustomerType,
  CustomerCategory,
} from "../../types/customer.types";

interface CustomerFiltersProps {
  filters: CustomerFiltersType;
  onFiltersChange: (filters: CustomerFiltersType) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function CustomerFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
}: CustomerFiltersProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#1A1A1A]" />
          <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">Filtros</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearFilters} className="h-9 px-3">
            <X className="w-4 h-4 mr-1" />
            Limpar Filtros
          </Button>
        )}
      </div>

      <div className="px-4 pb-4 border-t border-gray-100 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Busca por nome */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-2">Buscar</label>
            <Input
              placeholder="Buscar por nome..."
              value={filters.search || ""}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Status */}
          <Select
            label="Status"
            options={[
              { value: "", label: "Todos" },
              { value: "active", label: "Ativo" },
              { value: "inactive", label: "Inativo" },
              { value: "blocked", label: "Bloqueado" },
              { value: "prospect", label: "Prospect" },
            ]}
            value={filters.status || ""}
            onChange={(value) =>
              onFiltersChange({
                ...filters,
                status: (value as CustomerStatus | undefined) || undefined,
              })
            }
            placeholder="Todos"
          />

          {/* Tipo */}
          <Select
            label="Tipo"
            options={[
              { value: "", label: "Todos" },
              { value: "individual", label: "Pessoa Física" },
              { value: "corporate", label: "Pessoa Jurídica" },
            ]}
            value={filters.type || ""}
            onChange={(value) =>
              onFiltersChange({
                ...filters,
                type: (value as CustomerType | undefined) || undefined,
              })
            }
            placeholder="Todos"
          />

          {/* Categoria */}
          <Select
            label="Categoria"
            options={[
              { value: "", label: "Todas" },
              { value: "standard", label: "Standard" },
              { value: "premium", label: "Premium" },
              { value: "vip", label: "VIP" },
            ]}
            value={filters.category || ""}
            onChange={(value) =>
              onFiltersChange({
                ...filters,
                category: (value as CustomerCategory | undefined) || undefined,
              })
            }
            placeholder="Todas"
          />

          {/* Ordenação */}
          <Select
            label="Ordenar por"
            options={[
              { value: "created_at", label: "Data de Cadastro" },
              { value: "name", label: "Nome" },
              { value: "email", label: "Email" },
            ]}
            value={filters.sort_by || "created_at"}
            onChange={(value) => onFiltersChange({ ...filters, sort_by: value })}
            placeholder="Data de Cadastro"
          />

          <Select
            label="Ordem"
            options={[
              { value: "DESC", label: "Mais Recentes" },
              { value: "ASC", label: "Mais Antigos" },
            ]}
            value={filters.sort_order || "DESC"}
            onChange={(value) =>
              onFiltersChange({ ...filters, sort_order: value as "ASC" | "DESC" })
            }
            placeholder="Mais Recentes"
          />
        </div>
      </div>
    </div>
  );
}
