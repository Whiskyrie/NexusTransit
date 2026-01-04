import { useState, useEffect } from "react";
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react";
import { Table, TableColumn } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { vehicleService } from "../services/vehicle.service";
import type { Vehicle, VehicleFilters } from "../types/vehicle.types";

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<VehicleFilters>({
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

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const response = await vehicleService.list(filters);
      setVehicles(response.data);
      setPagination(response.meta);
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [filters]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const columns: TableColumn<Vehicle>[] = [
    {
      key: "vehicle",
      header: "Veículo",
      render: (vehicle) => (
        <div>
          <div className="font-medium text-[#1A1A1A]">
            {vehicle.brand} {vehicle.model}
          </div>
          <div className="text-sm text-gray-500">
            {vehicle.year} • {vehicle.color}
          </div>
        </div>
      ),
    },
    {
      key: "license_plate",
      header: "Placa",
      render: (vehicle) => (
        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
          {vehicle.license_plate}
        </span>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (vehicle) => <span className="capitalize">{vehicle.vehicle_type.toLowerCase()}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (vehicle) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
          ${
            vehicle.status === "AVAILABLE"
              ? "bg-green-100 text-green-800"
              : vehicle.status === "IN_USE"
                ? "bg-blue-100 text-blue-800"
                : vehicle.status === "MAINTENANCE"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
          }`}
        >
          {vehicle.status.replace(/_/g, " ").toLowerCase()}
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
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Veículos</h1>
          <p className="text-gray-500 mt-1">Gerencie a frota de veículos</p>
        </div>
        <Button>
          <Plus className="w-5 h-5 mr-2" />
          Novo Veículo
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar por placa, modelo ou marca..."
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
        data={vehicles}
        keyExtractor={(vehicle) => vehicle.id}
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
