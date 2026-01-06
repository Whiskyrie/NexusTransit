import { useState, useEffect } from "react";
import { Plus, RefreshCw, Download } from "lucide-react";
import { Table, TableColumn } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Toast } from "../components/ui/Toast";
import { ConfirmDeleteModal } from "../components/ui/ConfirmDeleteModal";
import {
  DriverStatusBadge,
  DriverFilters,
  DriverFormModal,
  DriverActions,
} from "../components/drivers";
import { driverService } from "../services/driver.service";
import type {
  Driver,
  DriverFilters as DriverFiltersType,
  CreateDriverDto,
} from "../types/driver.types";

export function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<DriverFiltersType>({
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

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    driverId: string | null;
    driverName: string;
  }>({
    isOpen: false,
    driverId: null,
    driverName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
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

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      const response = await driverService.list(filters);
      setDrivers(response.data);
      setPagination(response.meta);
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
      showToast("Erro ao carregar motoristas", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [filters.page, filters.limit, filters.search, filters.status]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleFiltersChange = (newFilters: DriverFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
    });
  };

  const handleCreateDriver = async (data: CreateDriverDto) => {
    try {
      setIsCreating(true);
      await driverService.create(data);
      setIsFormModalOpen(false);
      showToast("Motorista criado com sucesso!", "success");
      fetchDrivers();
    } catch (error) {
      console.error("Failed to create driver:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao criar motorista. Verifique os dados e tente novamente.";
      showToast(errorMessage, "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (driver: Driver) => {
    setDeleteModal({
      isOpen: true,
      driverId: driver.id,
      driverName: driver.full_name,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.driverId) return;

    try {
      setIsDeleting(true);
      await driverService.delete(deleteModal.driverId);
      showToast("Motorista excluído com sucesso!", "success");
      setDeleteModal({ isOpen: false, driverId: null, driverName: "" });
      fetchDrivers();
    } catch (error) {
      console.error("Failed to delete driver:", error);
      showToast("Erro ao excluir motorista", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, driverId: null, driverName: "" });
  };

  const handleEditDriver = (driver: Driver) => {
    console.log("Edit driver:", driver);
    // TODO: Implementar edição
  };

  const columns: TableColumn<Driver>[] = [
    {
      key: "full_name",
      header: "Motorista",
      width: "25%",
      render: (driver) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
            {driver.full_name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <div className="font-semibold text-[#1A1A1A] text-sm">{driver.full_name}</div>
            <div className="text-xs text-gray-500">{driver.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "cpf",
      header: "CPF",
      width: "12%",
      render: (driver) => (
        <span className="text-sm font-medium text-gray-700">
          {driver.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
        </span>
      ),
    },
    {
      key: "cnh",
      header: "CNH",
      width: "15%",
      render: (driver) => (
        <div>
          <div className="text-sm font-medium text-[#1A1A1A]">{driver.cnh_number}</div>
          <div className="text-xs text-gray-500">Categoria: {driver.cnh_category}</div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Telefone",
      width: "12%",
      render: (driver) => <span className="text-sm text-gray-700">{driver.phone}</span>,
    },
    {
      key: "status",
      header: "Status",
      width: "12%",
      render: (driver) => <DriverStatusBadge status={driver.status} />,
    },
    {
      key: "actions",
      header: "",
      width: "8%",
      render: (driver) => (
        <DriverActions
          onEdit={() => handleEditDriver(driver)}
          onDelete={() => handleDeleteClick(driver)}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <div className="max-w-full mx-auto space-y-4 px-4">
        {/* Header Compacto */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#1A1A1A]">Motoristas</h1>
              <p className="text-xs text-gray-500">Gerencie sua equipe de motoristas</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="h-9 px-3">
                <Download className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button variant="outline" onClick={fetchDrivers} className="h-9 px-3">
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  strokeWidth={1.5}
                />
              </Button>
              <Button onClick={() => setIsFormModalOpen(true)} className="h-9 px-4">
                <Plus className="w-4 h-4 mr-1" strokeWidth={2} />
                Novo Motorista
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <DriverFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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

        {/* Modals */}
        <DriverFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSubmit={handleCreateDriver}
          isLoading={isCreating}
        />

        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          title="Excluir Motorista"
          itemName={deleteModal.driverName}
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
    </div>
  );
}
