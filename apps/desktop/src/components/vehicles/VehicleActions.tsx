import { Edit2, Trash2 } from "lucide-react";

interface VehicleActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
}

export function VehicleActions({ onEdit, onDelete }: VehicleActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          title="Editar veículo"
        >
          <Edit2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
          title="Excluir veículo"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
