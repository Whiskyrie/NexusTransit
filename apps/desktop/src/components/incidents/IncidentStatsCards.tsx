/**
 * Cards de estatísticas de incidentes
 */

import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Activity, CheckCircle, Clock } from "lucide-react";
import { incidentService } from "../../services/incident.service";
import { IncidentStatus } from "../../types/incident.types";

export const IncidentStatsCards = memo(function IncidentStatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["incident-stats"],
    queryFn: () => incidentService.getStats(),
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total de Incidentes",
      value: stats.total,
      icon: AlertTriangle,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      label: "Críticos",
      value: stats.critical_count,
      icon: Activity,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      label: "Abertos",
      value: stats.open_count,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      label: "Resolvidos",
      value: stats.by_status[IncidentStatus.RESOLVED] || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">{card.label}</p>
              <div
                className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 ${card.color}`} strokeWidth={2} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
});
