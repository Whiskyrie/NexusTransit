import { Eye, Edit2, Trash2 } from "lucide-react";

interface DeliveryActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function DeliveryActions({ onView, onEdit, onDelete }: DeliveryActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onView && (
        <button
          onClick={onView}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-all cursor-pointer active:scale-95"
          title="Ver detalhes"
        >
          <Eye className="w-4 h-4" strokeWidth={1.5} />
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-all cursor-pointer active:scale-95"
          title="Editar entrega"
        >
          <Edit2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-all cursor-pointer active:scale-95"
          title="Excluir entrega"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
