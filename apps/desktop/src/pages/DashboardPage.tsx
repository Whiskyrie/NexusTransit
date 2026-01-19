import { useState, useMemo } from "react";
import { Truck, Clock, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "../stores/auth.store";
import { PageHeader, MetricCard } from "@/shared/components/molecules";
import { Button } from "@/shared/components/atoms";
import { PerformanceChart } from "../components/ui/charts/PerformanceChart";
import { ShipmentsOverview, TopEstados, TopClientes } from "../components/dashboard";
import { dashboardService } from "../services/dashboard.service";
import { deliveryService } from "../services/delivery.service";

export function DashboardPage() {
  const user = useUser();
  const queryClient = useQueryClient();

  // Memoizar o usuário
  const stableUser = useMemo(() => user, [user?.id, user?.first_name, user?.last_name]);

  // --- Period Options (memoized) ---
  const periodOptions = useMemo(
    () => [
      { label: "Últimos 7 dias", value: "7" },
      { label: "Últimos 14 dias", value: "14" },
      { label: "Últimos 30 dias", value: "30" },
    ],
    [],
  );

  const [selectedPeriod, setSelectedPeriod] = useState("7");

  // --- React Query Hooks ---

  // 1. Dashboard Stats
  const {
    data: stats,
    isLoading: isLoadingStats,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardService.getStats(),
  });

  // 2. Performance Data
  const { data: performanceData, isLoading: isLoadingChart } = useQuery({
    queryKey: ["dashboard", "performance", selectedPeriod],
    queryFn: () => dashboardService.getPerformanceData(parseInt(selectedPeriod)),
  });

  // 3. Recent Deliveries
  const { data: recentDeliveries, isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ["dashboard", "recent-deliveries"],
    queryFn: async () => {
      const response = await deliveryService.list({
        limit: 5,
        sort_by: "created_at",
        sort_order: "DESC",
      });
      return response.data;
    },
  });

  // 4. Top Cards (Estados & Clientes)
  const { data: topEstados, isLoading: isLoadingTopEstados } = useQuery({
    queryKey: ["dashboard", "top-estados"],
    queryFn: () => dashboardService.getTopEstados(),
  });

  const { data: topClientes, isLoading: isLoadingTopClientes } = useQuery({
    queryKey: ["dashboard", "top-clientes"],
    queryFn: () => dashboardService.getTopClientes(),
  });

  // Derived state for formatted date
  const lastUpdatedText = useMemo(() => {
    if (!dataUpdatedAt) return "";
    return new Date(dataUpdatedAt).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [dataUpdatedAt]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const isGlobalLoading =
    isLoadingStats ||
    isLoadingChart ||
    isLoadingDeliveries ||
    isLoadingTopEstados ||
    isLoadingTopClientes ||
    queryClient.isFetching() > 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <PageHeader
        title="Dashboard"
        subtitle={`Bem-vindo de volta, ${stableUser?.first_name || "Usuário"}`}
        actions={
          <div className="flex items-center gap-3">
            {lastUpdatedText && (
              <span className="text-xs text-gray-500">Atualizado às {lastUpdatedText}</span>
            )}
            <Button
              variant="outline"
              size="md"
              onClick={handleRefresh}
              leftIcon={RefreshCw}
              isLoading={isGlobalLoading}
            >
              Atualizar
            </Button>
          </div>
        }
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Entregas Hoje"
          value={isLoadingStats ? "..." : stats?.deliveries.today.toLocaleString() || "0"}
          icon={Truck}
          variant="primary"
          trend={
            stats
              ? {
                  value: `${stats.deliveries.todayTrend > 0 ? "+" : ""}${stats.deliveries.todayTrend}%`,
                  direction: stats.deliveries.todayTrend >= 0 ? "up" : "down",
                }
              : undefined
          }
        />
        <MetricCard
          label="Em Trânsito"
          value={isLoadingStats ? "..." : stats?.deliveries.inTransit.toLocaleString() || "0"}
          icon={Clock}
          variant="secondary"
          trend={
            stats
              ? {
                  value: `${stats.deliveries.inTransitTrend > 0 ? "+" : ""}${stats.deliveries.inTransitTrend}%`,
                  direction: stats.deliveries.inTransitTrend >= 0 ? "up" : "down",
                }
              : undefined
          }
        />
        <MetricCard
          label="Concluídas"
          value={isLoadingStats ? "..." : stats?.deliveries.delivered.toLocaleString() || "0"}
          icon={CheckCircle}
          variant="success"
          trend={
            stats
              ? {
                  value: `${stats.deliveries.deliveredTrend > 0 ? "+" : ""}${stats.deliveries.deliveredTrend}%`,
                  direction: stats.deliveries.deliveredTrend >= 0 ? "up" : "down",
                }
              : undefined
          }
        />
        <MetricCard
          label="Pendentes"
          value={isLoadingStats ? "..." : stats?.deliveries.pending.toLocaleString() || "0"}
          icon={AlertCircle}
          variant="warning"
          trend={
            stats
              ? {
                  value: `${stats.deliveries.pendingTrend > 0 ? "+" : ""}${stats.deliveries.pendingTrend}%`,
                  direction: stats.deliveries.pendingTrend <= 0 ? "up" : "down",
                }
              : undefined
          }
        />
      </div>

      {/* Row 1: Performance Chart | Top Clientes | Top Estados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PerformanceChart
          title="Performance de Entregas"
          data={performanceData || []}
          periodOptions={periodOptions}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          isLoading={isLoadingChart}
          currentLabel="Este período"
          previousLabel="Período anterior"
          valueFormatter={(v) => `${v} entregas`}
          height={350}
        />
        <TopClientes data={topClientes || []} isLoading={isLoadingTopClientes} />
        <TopEstados data={topEstados || []} isLoading={isLoadingTopEstados} />
      </div>

      {/* Row 2: Shipments Overview (full width) */}
      <ShipmentsOverview deliveries={recentDeliveries || []} isLoading={isLoadingDeliveries} />

      {/* Row 3: Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#E5E7EB]">
          <p className="text-xs text-gray-500 mb-1">Rotas Ativas</p>
          <p className="text-xl font-bold text-[#1A1A1A]">
            {isLoadingStats ? "..." : stats?.routes.active || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#E5E7EB]">
          <p className="text-xs text-gray-500 mb-1">Rotas Concluídas</p>
          <p className="text-xl font-bold text-[#1A1A1A]">
            {isLoadingStats ? "..." : stats?.routes.completed || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#E5E7EB]">
          <p className="text-xs text-gray-500 mb-1">Motoristas</p>
          <p className="text-xl font-bold text-[#1A1A1A]">
            {isLoadingStats ? "..." : stats?.drivers.total || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#E5E7EB]">
          <p className="text-xs text-gray-500 mb-1">Veículos</p>
          <p className="text-xl font-bold text-[#1A1A1A]">
            {isLoadingStats ? "..." : stats?.vehicles.total || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
