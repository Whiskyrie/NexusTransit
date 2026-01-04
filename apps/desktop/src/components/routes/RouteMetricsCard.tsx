import { RouteMetrics } from "../../types/route.types";
import { Route, MapPin, CheckCircle, AlertCircle } from "lucide-react";

interface RouteMetricsCardProps {
  metrics: RouteMetrics;
}

export function RouteMetricsCard({ metrics }: RouteMetricsCardProps) {
  const metricItems = [
    {
      label: "Total de Rotas",
      value: metrics.total_routes,
      icon: Route,
      color: "bg-[#1A1A1A] text-white",
      trend: null,
    },
    {
      label: "Rotas Ativas",
      value: metrics.active_routes,
      icon: MapPin,
      color: "bg-[#EFF6FF] text-[#2563EB]",
      trend: null,
    },
    {
      label: "Concluídas",
      value: metrics.completed_routes,
      icon: CheckCircle,
      color: "bg-[#ECFDF5] text-[#10B981]",
      trend: null,
    },
    {
      label: "Pendentes",
      value: metrics.pending_routes,
      icon: AlertCircle,
      color: "bg-[#FEF3C7] text-[#F59E0B]",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricItems.map((item, index) => (
        <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}>
              <item.icon className="w-6 h-6" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-[#1A1A1A]">{item.value}</p>
            <p className="text-sm font-medium text-gray-600">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
