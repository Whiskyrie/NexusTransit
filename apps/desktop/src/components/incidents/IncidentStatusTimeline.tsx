/**
 * Timeline de histórico de status do incidente
 */

import { memo } from "react";
import { CheckCircle, Clock } from "lucide-react";
import type { IncidentStatusHistory } from "../../types/incident.types";
import { IncidentStatusBadge } from "./IncidentStatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IncidentStatusTimelineProps {
  history: IncidentStatusHistory[];
}

export const IncidentStatusTimeline = memo(function IncidentStatusTimeline({
  history,
}: IncidentStatusTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Nenhuma mudança de status registrada</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Timeline Items */}
      <div className="space-y-6">
        {history.map((item, index) => {
          const isLast = index === history.length - 1;

          return (
            <div key={item.id} className="relative pl-10">
              {/* Timeline Dot */}
              <div
                className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isLast ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                {isLast ? (
                  <CheckCircle className="w-5 h-5 text-green-600" strokeWidth={2} />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                )}
              </div>

              {/* Content */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {item.previous_status && (
                        <>
                          <IncidentStatusBadge status={item.previous_status} showIcon={false} />
                          <span className="text-gray-400">→</span>
                        </>
                      )}
                      <IncidentStatusBadge status={item.new_status} />
                    </div>
                    <p className="text-xs text-gray-500">
                      Por <span className="font-medium">{item.changed_by_name}</span>
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>

                {item.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-700">{item.notes}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
