import { useState, useEffect } from "react";
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react";
import { Table, TableColumn } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { driverService } from "../services/driver.service";
import type { Driver, DriverFilters } from "../types/driver.types";

export function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<DriverFilters>({
    page: 1,
    limit: 10,
    search: "",
  });
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 1,
    has_previous: false,
    has_next: false,
  });

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      const response = await driverService.list(filters);
      setDrivers(response.data);
      setPagination(response.meta);
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [filters]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const columns: TableColumn<Driver>[] = [
    {
      key: "full_name",
      header: "Nome",
      render: (driver) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A] font-semibold">
            {driver.full_name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <div className="font-medium text-[#1A1A1A]">{driver.full_name}</div>
            <div className="text-sm text-gray-500">{driver.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "cpf",
      header: "CPF",
      render: (driver) => driver.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
    },
    {
      key: "cnh",
      header: "CNH",
      render: (driver) => (
        <div>
          <div className="font-medium">{driver.cnh_number}</div>
          <div className="text-xs text-gray-500">Cat: {driver.cnh_category}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (driver) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
          ${
            driver.status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : driver.status === "INACTIVE"
                ? "bg-gray-100 text-gray-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {driver.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "50px",
      render: () => (
        <div className="flex items-center justify-end gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Motoristas</h1>
          <p className="text-gray-500 mt-1">Gerencie a frota de motoristas</p>
        </div>
        <Button>
          <Plus className="w-5 h-5 mr-2" />
          Novo Motorista
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar por nome, CPF ou CNH..."
            icon={<Search className="w-5 h-5" />}
            value={filters.search}
            onChange={handleSearch}
          />
        </div>
        <Button variant="outline" className="px-4">
          <Filter className="w-5 h-5 mr-2" />
          Filtros
        </Button>
      </div>

      <Table
        columns={columns}
        data={drivers}
        keyExtractor={(driver) => driver.id}
        isLoading={isLoading}
        pagination={{
          ...pagination,
          page: filters.page || 1,
          limit: filters.limit || 10,
          onPageChange: handlePageChange,
        }}
      />
    </div>
  );
}
