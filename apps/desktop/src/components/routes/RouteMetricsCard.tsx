import { RouteMetrics } from "../../types/route.types";
import { Route, CheckCircle, Clock, TrendingUp, Navigation } from "lucide-react";

interface RouteMetricsCardProps {
  metrics: RouteMetrics;
}

export function RouteMetricsCard({ metrics }: RouteMetricsCardProps) {
  const metricItems = [
    {
      label: "Total de Rotas",
      value: metrics.total_routes,
      icon: Route,
      iconBg: "bg-gradient-to-br from-[#1A1A1A] to-gray-700",
      iconColor: "text-white",
      cardBg: "bg-white",
      trend: { value: 12, isPositive: true },
    },
    {
      label: "Em Andamento",
      value: metrics.active_routes,
      icon: Navigation,
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconColor: "text-white",
      cardBg: "bg-gradient-to-br from-blue-50 to-white",
      trend: { value: 8, isPositive: true },
    },
    {
      label: "Concluídas",
      value: metrics.completed_routes,
      icon: CheckCircle,
      iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
      iconColor: "text-white",
      cardBg: "bg-gradient-to-br from-emerald-50 to-white",
      trend: { value: 24, isPositive: true },
    },
    {
      label: "Planejadas",
      value: metrics.pending_routes,
      icon: Clock,
      iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
      iconColor: "text-white",
      cardBg: "bg-gradient-to-br from-amber-50 to-white",
      trend: { value: 3, isPositive: false },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {metricItems.map((item, index) => (
        <div
          key={index}
          className={`${item.cardBg} rounded-2xl p-5 border border-gray-100/80 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group`}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}
            >
              <item.icon className={`w-5 h-5 ${item.iconColor}`} strokeWidth={2} />
            </div>
            {item.trend && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  item.trend.isPositive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <TrendingUp
                  className={`w-3 h-3 ${!item.trend.isPositive ? "rotate-180" : ""}`}
                  strokeWidth={2.5}
                />
                {item.trend.value}%
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-[#1A1A1A] tracking-tight">{item.value}</p>
            <p className="text-sm font-medium text-gray-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
