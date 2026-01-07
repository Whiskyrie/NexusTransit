import { useState, useEffect } from "react";
import { Plus, RefreshCw, Download, Package } from "lucide-react";
import { Table, TableColumn } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Toast } from "../components/ui/Toast";
import { ConfirmDeleteModal } from "../components/ui/ConfirmDeleteModal";
import {
  DeliveryStatusBadge,
  DeliveryPriorityBadge,
  DeliveryFilters,
  DeliveryActions,
} from "../components/deliveries";
import { deliveryService } from "../services/delivery.service";
import type { Delivery, DeliveryFilters as DeliveryFiltersType } from "../types/delivery.types";

export function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<DeliveryFiltersType>({
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "DESC",
  });
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 1,
    has_previous: false,
    has_next: false,
  });

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    deliveryId: string | null;
    trackingCode: string;
  }>({
    isOpen: false,
    deliveryId: null,
    trackingCode: "",
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

  const fetchDeliveries = async () => {
    try {
      setIsLoading(true);
      const response = await deliveryService.list(filters);
      setDeliveries(response.data);
      setPagination(response.meta);
    } catch (error) {
      console.error("Failed to fetch deliveries:", error);
      showToast("Erro ao carregar entregas", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [
    filters.page,
    filters.limit,
    filters.tracking_code,
    filters.status,
    filters.priority,
    filters.today,
    filters.overdue,
    filters.active_only,
  ]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleFiltersChange = (newFilters: DeliveryFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sort_by: "created_at",
      sort_order: "DESC",
    });
  };

  const handleRefresh = () => {
    fetchDeliveries();
  };

  const handleExport = () => {
    // TODO: Implementar exportação
    showToast("Funcionalidade de exportação em desenvolvimento", "info");
  };

  const handleCreateDelivery = () => {
    // TODO: Abrir modal de criação
    showToast("Funcionalidade de criação em desenvolvimento", "info");
  };

  const handleViewDelivery = (delivery: Delivery) => {
    // TODO: Abrir modal de detalhes
    console.warn("Ver entrega:", delivery.tracking_code);
    showToast(`Detalhes de ${delivery.tracking_code}`, "info");
  };

  const handleEditDelivery = (delivery: Delivery) => {
    // TODO: Abrir modal de edição
    console.warn("Editar entrega:", delivery.tracking_code);
    showToast("Funcionalidade de edição em desenvolvimento", "info");
  };

  const handleDeleteClick = (delivery: Delivery) => {
    setDeleteModal({
      isOpen: true,
      deliveryId: delivery.id,
      trackingCode: delivery.tracking_code,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.deliveryId) return;

    try {
      setIsDeleting(true);
      await deliveryService.delete(deleteModal.deliveryId);
      showToast("Entrega excluída com sucesso!", "success");
      setDeleteModal({ isOpen: false, deliveryId: null, trackingCode: "" });
      fetchDeliveries();
    } catch (error) {
      console.error("Failed to delete delivery:", error);
      showToast("Erro ao excluir entrega", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, deliveryId: null, trackingCode: "" });
  };

  const formatAddress = (address: Delivery["pickup_address"] | Delivery["delivery_address"]) => {
    if (!address) return "-";
    return `${address.city}, ${address.state}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns: TableColumn<Delivery>[] = [
    {
      key: "tracking_code",
      header: "Código",
      width: "14%",
      render: (delivery) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Package className="w-4 h-4" strokeWidth={2} />
          </div>
          <div className="whitespace-nowrap">
            <div className="font-semibold text-[#1A1A1A] text-sm">{delivery.tracking_code}</div>
            <div className="text-xs text-gray-500">{formatDate(delivery.created_at)}</div>
          </div>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      width: "16%",
      render: (delivery) => (
        <div className="max-w-36">
          <div
            className="font-medium text-sm text-[#1A1A1A] truncate"
            title={delivery.customer?.name}
          >
            {delivery.customer?.name || "Cliente não informado"}
          </div>
          <div className="text-xs text-gray-500 truncate" title={delivery.customer?.email}>
            {delivery.customer?.email || "-"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "10%",
      render: (delivery) => (
        <div className="flex justify-center">
          <DeliveryStatusBadge status={delivery.status} size="sm" />
        </div>
      ),
    },
    {
      key: "priority",
      header: "Prioridade",
      width: "9%",
      render: (delivery) => (
        <div className="flex justify-center">
          <DeliveryPriorityBadge priority={delivery.priority} size="sm" />
        </div>
      ),
    },
    {
      key: "driver",
      header: "Motorista",
      width: "12%",
      render: (delivery) => (
        <div className="max-w-28">
          <div
            className="text-sm font-medium text-[#1A1A1A] truncate"
            title={delivery.driver?.full_name}
          >
            {delivery.driver?.full_name || "-"}
          </div>
          {delivery.vehicle && (
            <div className="text-xs text-gray-500">{delivery.vehicle.license_plate}</div>
          )}
        </div>
      ),
    },
    {
      key: "route",
      header: "Rota",
      width: "20%",
      render: (delivery) => (
        <div className="text-sm whitespace-nowrap">
          <div
            className="text-gray-700 truncate max-w-48"
            title={formatAddress(delivery.pickup_address)}
          >
            De: {formatAddress(delivery.pickup_address)}
          </div>
          <div
            className="text-gray-500 truncate max-w-48"
            title={formatAddress(delivery.delivery_address)}
          >
            Para: {formatAddress(delivery.delivery_address)}
          </div>
        </div>
      ),
    },
    {
      key: "scheduled_at",
      header: "Agendamento",
      width: "11%",
      render: (delivery) => (
        <div className="text-sm whitespace-nowrap text-center">
          <div className="font-medium text-[#1A1A1A]">
            {formatDate(delivery.scheduled_delivery_at)}
          </div>
          <div className="text-xs text-gray-500">{formatTime(delivery.scheduled_delivery_at)}</div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "7%",
      render: (delivery) => (
        <DeliveryActions
          onView={() => handleViewDelivery(delivery)}
          onEdit={() => handleEditDelivery(delivery)}
          onDelete={() => handleDeleteClick(delivery)}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <div className="max-w-full mx-auto space-y-4 px-4">
        {/* Header */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#1A1A1A]">Entregas</h1>
              <p className="text-xs text-gray-500">
                Gerencie todas as entregas do sistema em tempo real
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleExport} className="h-9 px-3">
                <Download className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button variant="outline" onClick={handleRefresh} className="h-9 px-3">
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  strokeWidth={1.5}
                />
              </Button>
              <Button onClick={handleCreateDelivery} className="h-9 px-4">
                <Plus className="w-4 h-4 mr-1" strokeWidth={2} />
                Nova Entrega
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <DeliveryFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Table
            columns={columns}
            data={deliveries}
            keyExtractor={(delivery) => delivery.id}
            isLoading={isLoading}
            pagination={{
              ...pagination,
              page: filters.page || 1,
              limit: filters.limit || 10,
              onPageChange: handlePageChange,
            }}
            emptyMessage="Nenhuma entrega encontrada"
          />
        </div>

        {/* Delete Modal */}
        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          title="Excluir Entrega"
          itemName={deleteModal.trackingCode}
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
