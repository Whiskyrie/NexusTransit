/**
 * Componente de ações para incidentes (tabela)
 */

import { memo } from "react";
import { Eye, Edit2, Trash2, MoreVertical } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import type { Incident } from "../../types/incident.types";

interface IncidentActionsProps {
  incident: Incident;
  onView: (incident: Incident) => void;
  onEdit: (incident: Incident) => void;
  onDelete: (incident: Incident) => void;
}

export const IncidentActions = memo(function IncidentActions({
  incident,
  onView,
  onEdit,
  onDelete,
}: IncidentActionsProps) {
  return (
    <Popover.Root>
      <Popover.Trigger className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors">
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={4}>
          <Popover.Popup className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-40 z-50">
            <button
              onClick={() => onView(incident)}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Ver Detalhes
            </button>
            <button
              onClick={() => onEdit(incident)}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={() => onDelete(incident)}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Deletar
            </button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
});
