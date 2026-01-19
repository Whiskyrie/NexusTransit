import { useState, useEffect } from "react";
import { Plus, RefreshCw, Download } from "lucide-react";
import { PageHeader, Table, type TableColumn } from "@/shared/components/molecules";
import { Button } from "@/shared/components/atoms";
import { Toast, ConfirmDeleteModal } from "../components/ui";
import {
  VehicleStatusBadge,
  VehicleFilters,
  VehicleFormModal,
  VehicleActions,
} from "../components/vehicles";
import { vehicleService } from "../services/vehicle.service";
import type {
  Vehicle,
  VehicleFilters as VehicleFiltersType,
  CreateVehicleDto,
} from "../types/vehicle.types";

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<VehicleFiltersType>({
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

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete modal states
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    vehicleId: string;
    vehicleName: string;
  }>({
    isOpen: false,
    vehicleId: "",
    vehicleName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "success",
  ) => {
    setToast({ show: true, message, type });
  };

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const response = await vehicleService.list(filters);
      setVehicles(response.data);
      setPagination(response.meta);
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      showToast("Erro ao carregar veículos", "error");
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.search, filters.status, filters.vehicle_type]);

  const handleFiltersChange = (newFilters: VehicleFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleCreateVehicle = async (data: CreateVehicleDto) => {
    try {
      setIsCreating(true);
      await vehicleService.create(data);
      showToast("Veículo criado com sucesso!", "success");
      setIsFormModalOpen(false);
      fetchVehicles();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erro ao criar veículo. Verifique os dados e tente novamente.";
      showToast(errorMessage, "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (vehicle: Vehicle) => {
    setDeleteModal({
      isOpen: true,
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand} ${vehicle.model} - ${vehicle.license_plate}`,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await vehicleService.delete(deleteModal.vehicleId);
      showToast("Veículo excluído com sucesso!", "success");
      setDeleteModal({ isOpen: false, vehicleId: "", vehicleName: "" });
      fetchVehicles();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erro ao excluir veículo. Tente novamente.";
      showToast(errorMessage, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, vehicleId: "", vehicleName: "" });
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsEditModalOpen(true);
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
      render: (vehicle) => <VehicleStatusBadge status={vehicle.status} />,
    },
    {
      key: "actions",
      header: "",
      width: "80px",
      render: (vehicle) => (
        <VehicleActions
          onEdit={() => handleEditVehicle(vehicle)}
          onDelete={() => handleDeleteClick(vehicle)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Veículos"
        subtitle="Gerencie sua frota de veículos"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" leftIcon={Download} />
            <Button
              variant="outline"
              size="md"
              onClick={fetchVehicles}
              leftIcon={RefreshCw}
              isLoading={isLoading}
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsFormModalOpen(true)}
              leftIcon={Plus}
            >
              Novo Veículo
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <VehicleFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
          emptyMessage="Nenhum veículo encontrado"
        />
      </div>

      {/* Modals */}
      <VehicleFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleCreateVehicle}
        isLoading={isCreating}
      />

      <VehicleFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVehicle(null);
        }}
        onSubmit={handleCreateVehicle}
        isLoading={isCreating}
        vehicle={selectedVehicle}
      />

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title="Excluir Veículo"
        itemName={deleteModal.vehicleName}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
