import { useState, useEffect } from "react";
import { Plus, RefreshCw, Download, Map, Calendar } from "lucide-react";
import { Table, TableColumn } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import {
  RouteStatusBadge,
  RoutePriorityBadge,
  RouteFilters,
  RouteMetricsCard,
  RouteFormModal,
} from "../components/routes";
import { routeService } from "../services/route.service";
import type { Route, RouteFilters as RouteFiltersType, RouteMetrics } from "../types/route.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [metrics, setMetrics] = useState<RouteMetrics | null>(null);
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
      setRoutes(response.data);
      setPagination(response.meta);
    } catch (error) {
      console.error("Failed to fetch routes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      // Simulated metrics - replace with actual API call when available
      const mockMetrics: RouteMetrics = {
        total_routes: pagination.total,
        active_routes: routes.filter((r) => r.status === "IN_PROGRESS").length,
        completed_routes: routes.filter((r) => r.status === "COMPLETED").length,
        pending_routes: routes.filter((r) => r.status === "PENDING").length,
        total_distance: routes.reduce((acc, r) => acc + (r.total_distance || 0), 0),
        average_duration: 0,
      };
      setMetrics(mockMetrics);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [filters]);

  useEffect(() => {
    if (routes.length > 0) {
      fetchMetrics();
    }
  }, [routes]);

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

  const handleCreateRoute = async (data: any) => {
    try {
      setIsCreating(true);
      await routeService.create(data);
      setShowCreateModal(false);
      fetchRoutes();
    } catch (error) {
      console.error("Failed to create route:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Removed unused handler functions - to be implemented when needed

  const handleExport = () => {
    console.log("Export routes");
    // Implement export functionality
  };

  const columns: TableColumn<Route>[] = [
    {
      key: "name",
      header: "Rota",
      width: "20%",
      render: (route) => (
        <div>
          <div className="font-semibold text-[#1A1A1A]">{route.name}</div>
          <div className="text-xs text-gray-500 mt-1">ID: {route.id.slice(0, 8)}...</div>
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
      key: "priority",
      header: "Prioridade",
      width: "12%",
      render: (route) => <RoutePriorityBadge priority={route.priority} />,
    },
    {
      key: "driver",
      header: "Motorista",
      width: "15%",
      render: (route) =>
        route.driver_name ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F5F0] flex items-center justify-center">
              <Map className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
            </div>
            <span className="text-sm text-[#1A1A1A]">{route.driver_name}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Não atribuído</span>
        ),
    },
    {
      key: "vehicle",
      header: "Veículo",
      width: "10%",
      render: (route) =>
        route.vehicle_plate ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-sm font-mono text-[#1A1A1A]">
            {route.vehicle_plate}
          </span>
        ) : (
          <span className="text-sm text-gray-400">Não atribuído</span>
        ),
    },
    {
      key: "progress",
      header: "Progresso",
      width: "15%",
      render: (route) => {
        const progressPercentage =
          route.total_deliveries > 0
            ? Math.round((route.completed_deliveries / route.total_deliveries) * 100)
            : 0;

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">
                {route.completed_deliveries}/{route.total_deliveries}
              </span>
              <span className="font-medium text-[#1A1A1A]">{progressPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1A1A1A] rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "date",
      header: "Data",
      width: "15%",
      render: (route) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>
              {format(new Date(route.start_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
          {route.estimated_end_date && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>
                Prev:{" "}
                {format(new Date(route.estimated_end_date), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "distance",
      header: "Distância",
      width: "10%",
      render: (route) =>
        route.total_distance ? (
          <div className="flex items-center gap-1.5 text-sm text-[#1A1A1A]">
            <Map className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            <span className="font-medium">{route.total_distance.toLocaleString("pt-BR")} km</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-8">
      <div className="max-w-360 mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">Rotas</h1>
            <p className="text-gray-600 mt-1">Gerencie todas as rotas de entrega</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport} className="h-10!">
              <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Exportar
            </Button>
            <Button variant="outline" onClick={fetchRoutes} className="h-10!">
              <RefreshCw className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Atualizar
            </Button>
            <Button onClick={() => setShowCreateModal(true)} className="h-10!">
              <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Nova Rota
            </Button>
          </div>
        </div>

        {/* Metrics */}
        {metrics && <RouteMetricsCard metrics={metrics} />}

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
      </div>
    </div>
  );
}
