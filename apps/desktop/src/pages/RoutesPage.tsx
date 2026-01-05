import { useState, useEffect } from "react";
import { Plus, RefreshCw, Download, Map, Calendar, MapPin, Truck } from "lucide-react";
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
    // Implement export functionality
  };

  const columns: TableColumn<Route>[] = [
    {
      key: "name",
      header: "Rota",
      width: "18%",
      render: (route) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-linear-to-br from-[#1A1A1A] to-gray-700 rounded-xl shadow-md">
            <MapPin className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <div className="font-semibold text-[#1A1A1A] text-sm">{route.name}</div>
            <div className="text-xs text-gray-400 font-mono mt-0.5">#{route.id.slice(0, 8)}</div>
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
      width: "11%",
      render: (route) =>
        route.vehicle_plate ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-linear-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-sm">
            <Truck className="w-3.5 h-3.5 text-gray-600" strokeWidth={2} />
            <span className="text-sm font-bold text-[#1A1A1A] font-mono tracking-wide">
              {route.vehicle_plate}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic">Não atribuído</span>
        ),
    },
    {
      key: "progress",
      header: "Progresso",
      width: "16%",
      render: (route) => {
        const progressPercentage =
          route.total_deliveries > 0
            ? Math.round((route.completed_deliveries / route.total_deliveries) * 100)
            : 0;

        const getProgressColor = () => {
          if (progressPercentage === 100) return "bg-green-500";
          if (progressPercentage >= 50) return "bg-blue-500";
          if (progressPercentage > 0) return "bg-amber-500";
          return "bg-gray-300";
        };

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs font-medium text-[#1A1A1A]">
                  <span className="font-semibold">{route.completed_deliveries}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">{route.total_deliveries}</span>
                </div>
              </div>
              <span className="inline-flex items-center justify-center min-w-10.5 px-2 py-0.5 rounded-md bg-[#1A1A1A] text-white text-xs font-bold">
                {progressPercentage}%
              </span>
            </div>
            <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full ${getProgressColor()} rounded-full transition-all duration-500 ease-out shadow-sm`}
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
      width: "18%",
      render: (route) => (
        <div className="space-y-2.5">
          {/* Data de Início */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F0] rounded-lg border border-gray-100">
            <div className="flex items-center justify-center w-6 h-6 bg-white rounded-md shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-[#1A1A1A]" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-[#6B6B6B] leading-tight">Início</span>
              <span className="text-xs font-semibold text-[#1A1A1A] leading-tight">
                {format(new Date(route.start_date), "dd/MM/yy HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>

          {/* Data Prevista */}
          {route.estimated_end_date && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-center w-6 h-6 bg-white rounded-md shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-blue-600 leading-tight">
                  Previsão
                </span>
                <span className="text-xs font-semibold text-blue-700 leading-tight">
                  {format(new Date(route.estimated_end_date), "dd/MM/yy HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-linear-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
            <Map className="w-4 h-4 text-green-600" strokeWidth={2} />
            <span className="text-sm font-bold text-green-700">
              {route.total_distance.toLocaleString("pt-BR")} km
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic">-</span>
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 bg-linear-to-br from-[#1A1A1A] to-gray-700 rounded-2xl shadow-lg">
                <MapPin className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#1A1A1A] mb-1">Rotas</h1>
                <p className="text-sm text-gray-600">
                  Gerencie e monitore todas as rotas de entrega em tempo real
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleExport} className="h-11 shadow-sm">
                <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Exportar
              </Button>
              <Button variant="outline" onClick={fetchRoutes} className="h-11 shadow-sm">
                <RefreshCw className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Atualizar
              </Button>
              <Button onClick={() => setShowCreateModal(true)} className="h-11 shadow-lg">
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Nova Rota
              </Button>
            </div>
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
