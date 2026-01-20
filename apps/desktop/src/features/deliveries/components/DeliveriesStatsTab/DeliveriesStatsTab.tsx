/**
 * DeliveriesStatsTab Component
 * Tab de estatísticas e métricas de entregas
 */

import { useState, useEffect } from "react";
import { Package, TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface DeliveryStats {
  total: number;
  pending: number;
  in_transit: number;
  delivered: number;
  failed: number;
  cancelled: number;
  success_rate: number;
  avg_delivery_time: number;
}

export function DeliveriesStatsTab() {
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      // TODO: Implementar endpoint de estatísticas no backend
      // const response = await deliveryService.getStats();
      // setStats(response);

      // Mock data temporário
      setStats({
        total: 1250,
        pending: 45,
        in_transit: 120,
        delivered: 980,
        failed: 85,
        cancelled: 20,
        success_rate: 78.4,
        avg_delivery_time: 4.5,
      });
    } catch (error) {
      console.error("Failed to fetch delivery stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Erro ao carregar estatísticas</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total de Entregas",
      value: stats.total.toLocaleString("pt-BR"),
      icon: Package,
      color: "indigo",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      label: "Pendentes",
      value: stats.pending.toLocaleString("pt-BR"),
      icon: Clock,
      color: "yellow",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
    },
    {
      label: "Em Trânsito",
      value: stats.in_transit.toLocaleString("pt-BR"),
      icon: TrendingUp,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Entregues",
      value: stats.delivered.toLocaleString("pt-BR"),
      icon: CheckCircle,
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Falhadas",
      value: stats.failed.toLocaleString("pt-BR"),
      icon: XCircle,
      color: "red",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      label: "Taxa de Sucesso",
      value: `${stats.success_rate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "emerald",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">{card.label}</div>
              <div className="text-3xl font-bold text-gray-900">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Adicionais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">Tempo Médio de Entrega</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.avg_delivery_time.toFixed(1)}h
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Entregas Canceladas</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.cancelled.toLocaleString("pt-BR")}
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder para gráficos futuros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gráficos e Tendências</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
          <p className="text-gray-500">Gráficos serão implementados em breve</p>
        </div>
      </div>
    </div>
  );
}
