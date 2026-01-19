import { useState, useEffect } from "react";
import { Plus, RefreshCw, Download, Package, Copy } from "lucide-react";
import { PageHeader } from "@/shared/components/molecules";
import { Button } from "@/shared/components/atoms";
import { Table, type TableColumn } from "@/shared/components/molecules";
import { Toast } from "../components/ui/Toast";
import { ConfirmDeleteModal } from "../components/ui/ConfirmDeleteModal";
import {
  DeliveryStatusBadge,
  DeliveryFilters,
  DeliveryActions,
  DeliveryFormModal,
  DeliveryDetailsModal,
} from "../components/deliveries";
import { deliveryService } from "../services/delivery.service";
import type {
  Delivery,
  DeliveryFilters as DeliveryFiltersType,
  CreateDeliveryDto,
  UpdateDeliveryDto,
} from "../types/delivery.types";

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

  // Form Modal (Create/Edit)
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    delivery: Delivery | null;
  }>({
    isOpen: false,
    delivery: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Details Modal
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    delivery: Delivery | null;
  }>({
    isOpen: false,
    delivery: null,
  });

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
    setFormModal({ isOpen: true, delivery: null });
  };

  const handleViewDelivery = (delivery: Delivery) => {
    setDetailsModal({ isOpen: true, delivery });
  };

  const handleEditDelivery = (delivery: Delivery) => {
    setFormModal({ isOpen: true, delivery });
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

  const handleFormSubmit = async (data: CreateDeliveryDto | UpdateDeliveryDto) => {
    try {
      setIsSubmitting(true);
      if (formModal.delivery) {
        // Edição
        await deliveryService.update(formModal.delivery.id, data as UpdateDeliveryDto);
        showToast("Entrega atualizada com sucesso!", "success");
      } else {
        // Criação
        await deliveryService.create(data as CreateDeliveryDto);
        showToast("Entrega criada com sucesso!", "success");
      }
      setFormModal({ isOpen: false, delivery: null });
      fetchDeliveries();
    } catch (error) {
      console.error("Failed to save delivery:", error);
      showToast(
        formModal.delivery ? "Erro ao atualizar entrega" : "Erro ao criar entrega",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormClose = () => {
    setFormModal({ isOpen: false, delivery: null });
  };

  const handleDetailsClose = () => {
    setDetailsModal({ isOpen: false, delivery: null });
  };

  const formatShortTrackingCode = (trackingCode: string) => {
    // Pega os 2 últimos dígitos numéricos antes das letras finais
    // Exemplo: NEX00000000500BR -> NEX0BR
    const match = trackingCode.match(/NEX(\d+)([A-Z]+)$/);
    if (match) {
      const numbers = match[1];
      const letters = match[2];
      const lastTwoDigits = numbers.slice(-2);
      return `NEX${lastTwoDigits}${letters}`;
    }
    return trackingCode;
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
            <div className="flex items-center gap-2">
              <div className="font-semibold text-[#1A1A1A] text-sm" title={delivery.tracking_code}>
                {formatShortTrackingCode(delivery.tracking_code)}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(delivery.tracking_code);
                  setToast({ show: true, message: "Código copiado!", type: "success" });
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors group cursor-pointer"
                title="Copiar código completo"
              >
                <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>
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
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Entregas"
        subtitle="Gerencie todas as entregas do sistema em tempo real"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" onClick={handleExport} leftIcon={Download} />
            <Button
              variant="outline"
              size="md"
              onClick={handleRefresh}
              leftIcon={RefreshCw}
              isLoading={isLoading}
            />
            <Button variant="primary" size="md" onClick={handleCreateDelivery} leftIcon={Plus}>
              Nova Entrega
            </Button>
          </div>
        }
      />

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

      {/* Form Modal (Create/Edit) */}
      <DeliveryFormModal
        isOpen={formModal.isOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        delivery={formModal.delivery}
      />

      {/* Details Modal */}
      <DeliveryDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={handleDetailsClose}
        delivery={detailsModal.delivery}
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
