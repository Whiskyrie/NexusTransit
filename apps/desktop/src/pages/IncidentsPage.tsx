/**
 * Página de Incidentes
 * Gerenciamento completo de incidentes operacionais
 */

import { useState } from "react";
import { Plus, RefreshCw, Download, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableColumn } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Toast } from "../components/ui/Toast";
import { ConfirmDeleteModal } from "../components/ui/ConfirmDeleteModal";
import {
  IncidentTypeBadge,
  IncidentSeverityBadge,
  IncidentStatusBadge,
  IncidentFilters,
  IncidentActions,
  IncidentFormModal,
  IncidentDetailsModal,
} from "../components/incidents";
import { incidentService } from "../services/incident.service";
import type {
  CreateIncidentDto,
  Incident,
  IncidentFilters as IncidentFiltersType,
  UpdateIncidentDto,
} from "../types/incident.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function IncidentsPage() {
  const [filters, setFilters] = useState<IncidentFiltersType>({
    page: 1,
    limit: 10,
    sort_by: "reported_at",
    sort_order: "DESC",
  });

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    incident: Incident | null;
  }>({
    isOpen: false,
    incident: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Modal (Create/Edit) - Placeholder
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    incident: Incident | null;
  }>({
    isOpen: false,
    incident: null,
  });

  // Details Modal - Placeholder
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    incident: Incident | null;
  }>({
    isOpen: false,
    incident: null,
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

  // Query para buscar incidentes
  const {
    data: incidentsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["incidents", filters],
    queryFn: () => incidentService.list(filters),
  });

  const incidents = incidentsData?.data || [];
  const pagination = incidentsData?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
    has_previous: false,
    has_next: false,
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleFiltersChange = (newFilters: IncidentFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sort_by: "reported_at",
      sort_order: "DESC",
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = async () => {
    try {
      const blob = await incidentService.export(filters, "csv");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `incidentes_${format(new Date(), "yyyy-MM-dd_HHmmss")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Relatório exportado com sucesso", "success");
    } catch (error) {
      console.error("Failed to export incidents:", error);
      showToast("Erro ao exportar relatório", "error");
    }
  };

  const handleCreateIncident = () => {
    setFormModal({ isOpen: true, incident: null });
  };

  const handleViewIncident = (incident: Incident) => {
    setDetailsModal({ isOpen: true, incident });
  };

  const handleEditIncident = (incident: Incident) => {
    setFormModal({ isOpen: true, incident });
  };

  const handleDeleteIncident = (incident: Incident) => {
    setDeleteModal({ isOpen: true, incident });
  };

  const confirmDelete = async () => {
    if (!deleteModal.incident) return;

    try {
      setIsDeleting(true);
      await incidentService.delete(deleteModal.incident.id);
      showToast("Incidente removido com sucesso", "success");
      setDeleteModal({ isOpen: false, incident: null });
      refetch();
    } catch (error) {
      console.error("Failed to delete incident:", error);
      showToast("Erro ao remover incidente", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: CreateIncidentDto | UpdateIncidentDto) => {
    try {
      if (formModal.incident) {
        await incidentService.update(formModal.incident.id, data as UpdateIncidentDto);
        showToast("Incidente atualizado com sucesso", "success");
      } else {
        await incidentService.create(data as CreateIncidentDto);
        showToast("Incidente criado com sucesso", "success");
      }
      setFormModal({ isOpen: false, incident: null });
      refetch();
    } catch (error) {
      console.error("Failed to save incident:", error);
      showToast("Erro ao salvar incidente", "error");
      throw error;
    }
  };

  // Colunas da tabela
  const columns: TableColumn<Incident>[] = [
    {
      key: "incident_number",
      header: "Número",
      width: "120px",
      render: (incident) => (
        <span className="font-mono text-sm font-medium text-gray-900">
          {incident.incident_number}
        </span>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      width: "200px",
      render: (incident) => <IncidentTypeBadge type={incident.incident_type} />,
    },
    {
      key: "severity",
      header: "Severidade",
      width: "130px",
      render: (incident) => <IncidentSeverityBadge severity={incident.severity} />,
    },
    {
      key: "status",
      header: "Status",
      width: "150px",
      render: (incident) => <IncidentStatusBadge status={incident.status} />,
    },
    {
      key: "title",
      header: "Título",
      render: (incident) => (
        <p className="text-sm font-medium text-gray-900 truncate max-w-md">{incident.title}</p>
      ),
    },
    {
      key: "driver",
      header: "Motorista",
      width: "180px",
      render: (incident) => (
        <span className="text-sm text-gray-900">
          {incident.driver?.full_name || <span className="text-gray-400">Não informado</span>}
        </span>
      ),
    },
    {
      key: "vehicle",
      header: "Veículo",
      width: "120px",
      render: (incident) => (
        <span className="text-sm text-gray-600">{incident.vehicle?.license_plate || "-"}</span>
      ),
    },
    {
      key: "reported_at",
      header: "Reportado em",
      width: "140px",
      render: (incident) => (
        <span className="text-sm text-gray-600">
          {format(new Date(incident.reported_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      width: "80px",
      render: (incident) => (
        <IncidentActions
          incident={incident}
          onView={handleViewIncident}
          onEdit={handleEditIncident}
          onDelete={handleDeleteIncident}
        />
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A1A]">Incidentes</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gerenciamento de incidentes operacionais
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleExport} className="h-9 px-3">
                <Download className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button variant="outline" onClick={handleRefresh} className="h-9 px-3">
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  strokeWidth={1.5}
                />
              </Button>
              <Button onClick={handleCreateIncident} className="h-9 px-4">
                <Plus className="w-4 h-4 mr-1" strokeWidth={2} />
                Novo Incidente
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <IncidentFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Table
          columns={columns}
          data={incidents}
          keyExtractor={(incident) => incident.id}
          isLoading={isLoading}
          pagination={{
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            total_pages: pagination.total_pages,
            has_previous: pagination.has_previous,
            has_next: pagination.has_next,
            onPageChange: handlePageChange,
          }}
        />
      </div>

      {/* Form Modal */}
      <IncidentFormModal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, incident: null })}
        onSubmit={handleFormSubmit}
        incident={formModal.incident}
      />

      {/* Details Modal */}
      <IncidentDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, incident: null })}
        incident={detailsModal.incident}
      />

      {/* Delete Confirmation */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onCancel={() => setDeleteModal({ isOpen: false, incident: null })}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="Remover Incidente"
        itemName={deleteModal.incident?.incident_number}
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
