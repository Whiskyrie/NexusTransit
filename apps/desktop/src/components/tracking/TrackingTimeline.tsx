import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Package,
  CheckCircle,
  Truck,
  MapPin,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import type { PublicTrackingEvent, EventType } from "../../types/tracking.types";

interface TrackingTimelineProps {
  events: PublicTrackingEvent[];
}

const eventConfig: Record<EventType, { icon: typeof Package; label: string; color: string }> = {
  CREATED: { icon: Package, label: "Criada", color: "bg-gray-500" },
  ASSIGNED: { icon: CheckCircle, label: "Atribuída", color: "bg-blue-500" },
  PICKUP_STARTED: { icon: Clock, label: "Coleta Iniciada", color: "bg-yellow-500" },
  PICKED_UP: { icon: CheckCircle, label: "Coletada", color: "bg-green-500" },
  IN_TRANSIT: { icon: Truck, label: "Em Trânsito", color: "bg-indigo-500" },
  NEAR_DESTINATION: { icon: MapPin, label: "Próximo ao Destino", color: "bg-purple-500" },
  ARRIVED: { icon: MapPin, label: "Chegou ao Local", color: "bg-cyan-500" },
  DELIVERED: { icon: CheckCircle, label: "Entregue", color: "bg-emerald-500" },
  FAILED: { icon: XCircle, label: "Falha na Entrega", color: "bg-red-500" },
  CANCELED: { icon: XCircle, label: "Cancelada", color: "bg-gray-500" },
  DELAYED: { icon: AlertTriangle, label: "Atrasada", color: "bg-orange-500" },
  RESCHEDULED: { icon: Calendar, label: "Reagendada", color: "bg-amber-500" },
};

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-indigo-500" />
        Histórico de Eventos
      </h3>

      <div className="space-y-4">
        {events.map((event, index) => {
          const config = eventConfig[event.event_type as EventType] || {
            icon: Package,
            label: event.event_type,
            color: "bg-gray-500",
          };
          const Icon = config.icon;
          const isLast = index === events.length - 1;

          let timestamp: Date;
          try {
            timestamp = new Date(event.timestamp);
          } catch {
            timestamp = new Date();
          }

          return (
            <div key={index} className="relative flex gap-4 group">
              {/* Linha vertical (não aparece no último) */}
              {!isLast && (
                <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200 group-hover:bg-indigo-200 transition-colors" />
              )}

              {/* Ícone */}
              <div className="relative z-10 shrink-0">
                <div
                  className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center shadow-sm border-2 border-white`}
                >
                  <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 pb-2">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div className="font-bold text-gray-900">{config.label}</div>
                  <div className="text-xs text-gray-500 font-medium shrink-0">
                    {format(timestamp, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                </div>

                {event.location && (
                  <div className="text-sm text-gray-600 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {event.location}
                  </div>
                )}

                {event.notes && (
                  <div className="text-sm text-gray-500 mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    {event.notes}
                  </div>
                )}

                {/* Badge de status */}
                {event.event_status !== "SUCCESS" && (
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        event.event_status === "WARNING"
                          ? "bg-yellow-100 text-yellow-700"
                          : event.event_status === "ERROR"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {event.event_status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {events.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">Nenhum evento registrado ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
