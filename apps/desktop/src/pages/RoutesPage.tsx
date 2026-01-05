import { useState, useEffect } from "react";
import {
  Plus,
  RefreshCw,
  Download,
  Calendar,
  Truck,
  User,
  Navigation,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { Table, TableColumn } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { RouteStatusBadge, RouteFilters, RouteFormModal } from "../components/routes";
import { routeService } from "../services/route.service";
import type { Route, RouteFilters as RouteFiltersType, CreateRouteDto } from "../types/route.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Simple toast notification component
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-2 duration-200 ${
        type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      {type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        ×
      </button>
    </div>
  );
}

// Modal de confirmação de exclusão
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  routeName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteModal({
  isOpen,
  routeName,
  isDeleting,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Excluir Rota</h3>
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir a rota{" "}
            <span className="font-semibold text-[#1A1A1A]">"{routeName}"</span>?
          </p>
          <p className="text-xs text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4! py-2! text-sm"
          >
            Cancelar
          </Button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Excluir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; route: Route | null }>({
    isOpen: false,
    route: null,
  });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [filters, setFilters] = useState<RouteFiltersType>({
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 1,
    has_previous: false,
    has_next: false,
  });

  // Fetch routes
  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      const response = await routeService.list(filters);
      // Adicionar campos computados
      const routesWithComputed = response.data.map((route) => ({
        ...route,
        total_deliveries: route.stops?.length || 0,
        completed_deliveries: route.stops?.filter((s) => s.status === "COMPLETED").length || 0,
      }));
      setRoutes(routesWithComputed);
      setPagination(response.meta);
    } catch (error) {
      console.error("Failed to fetch routes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [filters]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleFilterChange = (newFilters: RouteFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
    });
  };

  const handleCreateRoute = async (data: CreateRouteDto) => {
    try {
      setIsCreating(true);
      await routeService.create(data);
      setShowCreateModal(false);
      setToast({ message: "Rota criada com sucesso!", type: "success" });
      fetchRoutes();
    } catch (error) {
      console.error("Failed to create route:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao criar rota. Verifique os dados e tente novamente.";
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  // Removed unused handler functions - to be implemented when needed

  const openDeleteModal = (route: Route) => {
    setDeleteModal({ isOpen: true, route });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, route: null });
  };

  const handleDeleteRoute = async () => {
    if (!deleteModal.route) return;
    try {
      setIsDeleting(true);
      await routeService.delete(deleteModal.route.id);
      setToast({ message: "Rota excluída com sucesso!", type: "success" });
      closeDeleteModal();
      fetchRoutes();
    } catch (error) {
      console.error("Failed to delete route:", error);
      setToast({ message: "Erro ao excluir rota.", type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditRoute = (route: Route) => {
    // TODO: Implementar modal de edição
    void route; // Evita erro de variável não utilizada
    setToast({ message: "Função de edição em desenvolvimento.", type: "error" });
  };

  const handleExport = () => {
    // Implement export functionality
  };

  const columns: TableColumn<Route>[] = [
    {
      key: "name",
      header: "Rota",
      width: "18%",
      render: (route) => (
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-dark-gray-300" strokeWidth={1.75} />
          <div>
            <div className="font-semibold text-[#1A1A1A] text-sm">{route.name}</div>
            <div className="text-[10px] text-gray-400 font-mono">#{route.id.slice(0, 8)}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "12%",
      render: (route) => <RouteStatusBadge status={route.status} />,
    },
    {
      key: "type",
      header: "Tipo",
      width: "10%",
      render: (route) => {
        const typeLabels: Record<string, string> = {
          URBAN: "Urbana",
          LONG_DISTANCE: "Longa Distância",
          REGIONAL: "Regional",
          EXPRESS: "Expressa",
        };
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {typeLabels[route.type] || route.type}
          </span>
        );
      },
    },
    {
      key: "driver",
      header: "Motorista",
      width: "14%",
      render: (route) =>
        route.driver ? (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <span className="text-sm text-[#1A1A1A]">
              {route.driver.full_name.split(" ").slice(0, 2).join(" ")}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        ),
    },
    {
      key: "vehicle",
      header: "Veículo",
      width: "10%",
      render: (route) =>
        route.vehicle ? (
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-[#1A1A1A] font-mono">
              {route.vehicle.license_plate}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
    {
      key: "progress",
      header: "Progresso",
      width: "12%",
      render: (route) => {
        const totalStops = route.stops?.length || 0;
        const completedStops = route.stops?.filter((s) => s.status === "COMPLETED").length || 0;
        const progressPercentage =
          totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

        const getProgressColor = () => {
          if (progressPercentage === 100) return "bg-emerald-500";
          if (progressPercentage >= 50) return "bg-blue-500";
          if (progressPercentage > 0) return "bg-amber-500";
          return "bg-gray-300";
        };

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {completedStops}/{totalStops}
            </span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-12">
              <div
                className={`h-full ${getProgressColor()} rounded-full`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-[#1A1A1A] min-w-8">
              {progressPercentage}%
            </span>
          </div>
        );
      },
    },
    {
      key: "date",
      header: "Data",
      width: "16%",
      render: (route) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
            <span className="text-xs font-medium text-[#1A1A1A]">
              {format(
                new Date(`${route.planned_date}T${route.planned_start_time}`),
                "dd/MM/yy HH:mm",
                { locale: ptBR },
              )}
            </span>
          </div>
          {route.planned_end_time && (
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.5} />
              <span className="text-xs text-blue-600">
                {format(
                  new Date(`${route.planned_date}T${route.planned_end_time}`),
                  "dd/MM/yy HH:mm",
                  { locale: ptBR },
                )}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "distance",
      header: "Distância",
      width: "8%",
      render: (route) => (
        <div className="flex items-center justify-center">
          {route.estimated_distance_km ? (
            <span className="text-sm font-medium text-emerald-600">
              {route.estimated_distance_km.toLocaleString("pt-BR")} km
            </span>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "8%",
      render: (route) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleEditRoute(route)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
            title="Editar rota"
          >
            <Edit2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => openDeleteModal(route)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
            title="Excluir rota"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
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
              <h1 className="text-xl font-bold text-[#1A1A1A]">Rotas</h1>
              <p className="text-xs text-gray-500">Gerencie suas rotas de entrega</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleExport} className="h-9 px-3">
                <Download className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button variant="outline" onClick={fetchRoutes} className="h-9 px-3">
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  strokeWidth={1.5}
                />
              </Button>
              <Button onClick={() => setShowCreateModal(true)} className="h-9 px-4">
                <Plus className="w-4 h-4 mr-1" strokeWidth={2} />
                Nova Rota
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <RouteFilters
          filters={filters}
          onFiltersChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Table
            columns={columns}
            data={routes}
            keyExtractor={(route) => route.id}
            isLoading={isLoading}
            pagination={{
              page: filters.page || 1,
              limit: filters.limit || 10,
              total: pagination.total,
              total_pages: pagination.total_pages,
              has_previous: pagination.has_previous,
              has_next: pagination.has_next,
              onPageChange: handlePageChange,
            }}
            emptyMessage="Nenhuma rota encontrada"
          />
        </div>

        {/* Create Modal */}
        <RouteFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRoute}
          isLoading={isCreating}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          routeName={deleteModal.route?.name || ""}
          isDeleting={isDeleting}
          onConfirm={handleDeleteRoute}
          onCancel={closeDeleteModal}
        />

        {/* Toast Notification */}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </div>
  );
}
