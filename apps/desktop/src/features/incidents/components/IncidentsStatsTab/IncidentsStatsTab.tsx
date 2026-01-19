/**
 * IncidentsStatsTab Component
 * Dashboard de estatísticas de incidentes
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardBody } from "@/shared/components/atoms";
import { incidentService } from "@/services/incident.service";
import { AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
}

function StatCard({ title, value, trend, icon: Icon, iconColor, iconBg }: StatCardProps) {
  return (
    <Card variant="bordered" padding="lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>

          {trend && (
            <div className="flex items-center gap-1 mt-3">
              {trend.direction === "up" && <TrendingUp className="w-4 h-4 text-green-600" />}
              {trend.direction === "down" && <TrendingDown className="w-4 h-4 text-red-600" />}
              {trend.direction === "neutral" && <Minus className="w-4 h-4 text-gray-400" />}
              <span
                className={`text-sm font-medium ${
                  trend.direction === "up"
                    ? "text-green-600"
                    : trend.direction === "down"
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-sm text-gray-500">vs. mês anterior</span>
            </div>
          )}
        </div>

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}

export function IncidentsStatsTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["incident-stats"],
    queryFn: () => incidentService.getStats(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="bordered" padding="lg">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Incidentes"
          value={stats?.total || 0}
          trend={{ value: 12, direction: "up" }}
          icon={AlertTriangle}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />

        <StatCard
          title="Resolvidos"
          value={stats?.by_status?.RESOLVED || 0}
          trend={{ value: 8, direction: "up" }}
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />

        <StatCard
          title="Em Andamento"
          value={stats?.by_status?.IN_PROGRESS || 0}
          trend={{ value: 0, direction: "neutral" }}
          icon={Clock}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />

        <StatCard
          title="Críticos"
          value={stats?.critical_count || 0}
          trend={{ value: -5, direction: "down" }}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
      </div>

      {/* Placeholder for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="bordered" padding="lg">
          <CardHeader title="Tendências" subtitle="Últimos 30 dias" />
          <CardBody>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Gráfico de tendências (implementar com Recharts)
            </div>
          </CardBody>
        </Card>

        <Card variant="bordered" padding="lg">
          <CardHeader title="Por Tipo" subtitle="Distribuição" />
          <CardBody>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Gráfico de pizza (implementar com Recharts)
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card variant="bordered" padding="lg">
          <CardHeader title="Por Status" subtitle="Breakdown detalhado" />
          <CardBody>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Gráfico de barras (implementar com Recharts)
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
