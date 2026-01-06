import { Route, RoutePriority } from "../../types/route.types";
import { RouteStatusBadge } from "./RouteStatusBadge";
import { RoutePriorityBadge } from "./RoutePriorityBadge";
import { MapPin, Truck, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RouteTableRowProps {
  route: Route;
}

export function RouteTableRow({ route }: RouteTableRowProps) {
  const progressPercentage =
    route.total_deliveries > 0
      ? Math.round((route.completed_deliveries / route.total_deliveries) * 100)
      : 0;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Calcula prioridade baseado no status se não definido
  const priority = route.priority ?? RoutePriority.MEDIUM;

  return (
    <tr className="hover:bg-gray-50 transition-colors cursor-pointer group">
      {/* Route Name */}
      <td className="px-6 py-4">
        <div>
          <div className="font-semibold text-[#1A1A1A] group-hover:text-[#2563EB] transition-colors">
            {route.name}
          </div>
          <div className="text-xs text-gray-500 mt-1">ID: {route.id.slice(0, 8)}...</div>
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <RouteStatusBadge status={route.status} />
      </td>

      {/* Priority */}
      <td className="px-6 py-4">
        <RoutePriorityBadge priority={priority} />
      </td>

      {/* Driver */}
      <td className="px-6 py-4">
        {route.driver?.full_name ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F5F0] flex items-center justify-center">
              <Truck className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
            </div>
            <span className="text-sm text-[#1A1A1A]">{route.driver.full_name}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Não atribuído</span>
        )}
      </td>

      {/* Vehicle */}
      <td className="px-6 py-4">
        {route.vehicle?.license_plate ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-sm font-mono text-[#1A1A1A]">
            {route.vehicle.license_plate}
          </span>
        ) : (
          <span className="text-sm text-gray-400">Não atribuído</span>
        )}
      </td>

      {/* Progress */}
      <td className="px-6 py-4">
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
      </td>

      {/* Date */}
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{formatDate(route.planned_date)}</span>
          </div>
          {route.planned_end_time && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Prev: {route.planned_end_time}</span>
            </div>
          )}
        </div>
      </td>

      {/* Distance */}
      <td className="px-6 py-4">
        {route.estimated_distance_km ? (
          <div className="flex items-center gap-1.5 text-sm text-[#1A1A1A]">
            <MapPin className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            <span className="font-medium">
              {route.estimated_distance_km.toLocaleString("pt-BR")} km
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
    </tr>
  );
}
