/**
 * Componente de ações para incidentes (tabela)
 */

import { memo } from "react";
import { Eye, Edit2, Trash2 } from "lucide-react";
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
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => onView(incident)}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-all cursor-pointer active:scale-95"
        title="Ver detalhes"
      >
        <Eye className="w-4 h-4" strokeWidth={1.5} />
      </button>
      <button
        onClick={() => onEdit(incident)}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-all cursor-pointer active:scale-95"
        title="Editar incidente"
      >
        <Edit2 className="w-4 h-4" strokeWidth={1.5} />
      </button>
      <button
        onClick={() => onDelete(incident)}
        className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-all cursor-pointer active:scale-95"
        title="Excluir incidente"
      >
        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
      </button>
    </div>
  );
});
