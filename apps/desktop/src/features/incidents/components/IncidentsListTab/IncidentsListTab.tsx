/**
 * IncidentsListTab Component
 * Tab de listagem de incidentes (migrado do conteúdo atual)
 */

import { useState } from "react";
import { Plus, RefreshCw, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/shared/components/atoms";
import { Table, type TableColumn } from "@/shared/components/molecules";
import { Toast } from "@/components/ui/Toast";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import {
  IncidentTypeBadge,
  IncidentSeverityBadge,
  IncidentStatusBadge,
  IncidentFilters,
  IncidentActions,
  IncidentFormModal,
  IncidentDetailsModal,
} from "@/components/incidents";
import { incidentService } from "@/services/incident.service";
import type {
  CreateIncidentDto,
  Incident,
  IncidentFilters as IncidentFiltersType,
  UpdateIncidentDto,
} from "@/types/incident.types";

export function IncidentsListTab() {
  const [filters, setFilters] = useState<IncidentFiltersType>({
    page: 1,
    limit: 10,
    sort_by: "reported_at",
    sort_order: "DESC",
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    incident: Incident | null;
  }>({
    isOpen: false,
    incident: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    incident: Incident | null;
  }>({
    isOpen: false,
    incident: null,
  });

  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    incident: Incident | null;
  }>({
    isOpen: false,
    incident: null,
  });

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
      width: "120px",
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
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" onClick={handleExport} leftIcon={Download}>
            Exportar
          </Button>
          <Button variant="outline" size="md" onClick={handleRefresh} leftIcon={RefreshCw}>
            {isLoading ? "Carregando..." : "Atualizar"}
          </Button>
        </div>
        <Button variant="primary" size="md" onClick={handleCreateIncident} leftIcon={Plus}>
          Novo Incidente
        </Button>
      </div>

      {/* Filters */}
      <IncidentFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
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

      {/* Modals */}
      <IncidentFormModal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, incident: null })}
        onSubmit={handleFormSubmit}
        incident={formModal.incident}
      />

      <IncidentDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, incident: null })}
        incident={detailsModal.incident}
      />

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onCancel={() => setDeleteModal({ isOpen: false, incident: null })}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="Remover Incidente"
        itemName={deleteModal.incident?.incident_number}
      />

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
