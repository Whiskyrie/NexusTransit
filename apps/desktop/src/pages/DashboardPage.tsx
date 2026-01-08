import { useState, useEffect, useCallback, useMemo } from "react";
import { Truck, Clock, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useUser } from "../stores/auth.store";
import { MetricCard } from "../components/ui/MetricCard";
import {
  PerformanceChart,
  type PerformanceDataPoint,
} from "../components/ui/charts/PerformanceChart";
import { ShipmentsOverview, TopEstados, TopClientes } from "../components/dashboard";
import {
  dashboardService,
  type DashboardStats,
  type TopEstado,
  type TopCliente,
} from "../services/dashboard.service";
import { deliveryService } from "../services/delivery.service";
import type { Delivery } from "../types/delivery.types";

export function DashboardPage() {
  const user = useUser();

  // Memoizar o usuário para evitar re-renders se a referência mudar
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

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([]);
  const [topEstados, setTopEstados] = useState<TopEstado[]>([]);
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(true);
  const [isLoadingTopCards, setIsLoadingTopCards] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Memoizar o valor formatado de lastUpdated
  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) return "";
    return lastUpdated.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastUpdated]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  // Fetch performance data
  const fetchPerformanceData = useCallback(async (days: number) => {
    try {
      const data = await dashboardService.getPerformanceData(days);
      setPerformanceData(data);
    } catch (error) {
      console.error("Failed to fetch performance data:", error);
    }
  }, []);

  // Fetch recent deliveries
  const fetchRecentDeliveries = useCallback(async () => {
    try {
      const response = await deliveryService.list({
        limit: 5,
        sort_by: "created_at",
        sort_order: "DESC",
      });
      setRecentDeliveries(response.data);
    } catch (error) {
      console.error("Failed to fetch recent deliveries:", error);
    }
  }, []);

  // Fetch top cards data
  const fetchTopCards = useCallback(async () => {
    try {
      const [estados, clientes] = await Promise.all([
        dashboardService.getTopEstados(),
        dashboardService.getTopClientes(),
      ]);
      setTopEstados(estados);
      setTopClientes(clientes);
    } catch (error) {
      console.error("Failed to fetch top cards:", error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoadingStats(true);
      setIsLoadingChart(true);
      setIsLoadingDeliveries(true);
      setIsLoadingTopCards(true);

      try {
        await Promise.all([
          fetchStats(),
          fetchPerformanceData(parseInt(selectedPeriod)),
          fetchRecentDeliveries(),
          fetchTopCards(),
        ]);
      } catch (error) {
        console.error("[Dashboard] Error loading data:", error);
      } finally {
        setIsLoadingStats(false);
        setIsLoadingChart(false);
        setIsLoadingDeliveries(false);
        setIsLoadingTopCards(false);
      }
    };

    loadAllData();
  }, [selectedPeriod]);
  // Handle period change
  const handlePeriodChange = useCallback(
    (period: string) => {
      if (period !== selectedPeriod) {
        setSelectedPeriod(period);
      }
    },
    [selectedPeriod],
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsLoadingStats(true);
    setIsLoadingChart(true);
    setIsLoadingDeliveries(true);
    setIsLoadingTopCards(true);

    Promise.all([
      fetchStats(),
      fetchPerformanceData(parseInt(selectedPeriod)),
      fetchRecentDeliveries(),
      fetchTopCards(),
    ]).finally(() => {
      setIsLoadingStats(false);
      setIsLoadingChart(false);
      setIsLoadingDeliveries(false);
      setIsLoadingTopCards(false);
    });
  }, [selectedPeriod]);

  return (
    <div className="space-y-6 font-sans text-[#1A1A1A]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-sm text-[#6B6B6B]">
            Bem-vindo de volta, {stableUser?.first_name || "Usuário"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-500">Atualizado às {lastUpdatedText}</span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoadingStats || isLoadingChart}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoadingStats || isLoadingChart ? "animate-spin" : ""}`}
            />
            Atualizar
          </button>
        </div>
      </div>

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
          data={performanceData}
          periodOptions={periodOptions}
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
          isLoading={isLoadingChart}
          currentLabel="Este período"
          previousLabel="Período anterior"
          valueFormatter={(v) => `${v} entregas`}
          height={350}
        />
        <TopClientes data={topClientes} isLoading={isLoadingTopCards} />
        <TopEstados data={topEstados} isLoading={isLoadingTopCards} />
      </div>

      {/* Row 2: Shipments Overview (full width) */}
      <ShipmentsOverview deliveries={recentDeliveries} isLoading={isLoadingDeliveries} />

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
